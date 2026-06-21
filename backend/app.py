import os
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import oracledb


BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent
load_dotenv(BASE_DIR / ".env")


app = Flask(__name__, static_folder=str(PROJECT_DIR), static_url_path="")
CORS(app)


def init_oracle_client():
    """Oracle 11g XE needs thick mode. Point this to the XE client/server bin folder."""
    client_dir = os.getenv("ORACLE_CLIENT_LIB_DIR", "").strip()
    if not client_dir:
        common_xe_dir = Path(r"C:\oraclexe\app\oracle\product\11.2.0\server\bin")
        if common_xe_dir.exists():
            client_dir = str(common_xe_dir)
    try:
        if client_dir:
            oracledb.init_oracle_client(lib_dir=client_dir)
        else:
            oracledb.init_oracle_client()
    except oracledb.ProgrammingError:
        # Client already initialized.
        pass


init_oracle_client()


def get_connection():
    host = os.getenv("ORACLE_HOST", "localhost")
    port = int(os.getenv("ORACLE_PORT", "1521"))
    sid = os.getenv("ORACLE_SID", "xe")
    username = os.getenv("ORACLE_USER", "COURT_APP")
    password = os.getenv("ORACLE_PASSWORD")
    if not password:
        raise RuntimeError("ORACLE_PASSWORD is not set. Copy backend/.env.example to backend/.env and add your local Oracle password.")
    dsn = oracledb.makedsn(host, port, sid=sid)
    return oracledb.connect(user=username, password=password, dsn=dsn)


def rows_to_dicts(cursor):
    columns = [col[0].lower() for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def normalize_date(value):
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d")
    return value


def booking_duration(start_time, end_time):
    start = datetime.strptime(start_time, "%H:%M")
    end = datetime.strptime(end_time, "%H:%M")
    return int((end - start).seconds / 3600)


def add_hours(start_time, duration):
    start = datetime.strptime(start_time, "%H:%M")
    end_hour = start.hour + int(duration)
    return f"{end_hour:02d}:{start.minute:02d}"


def next_id(cursor, table_name, column_name, prefix):
    cursor.execute(
        f"""
        SELECT MAX(TO_NUMBER(SUBSTR({column_name}, :prefix_len_plus_one)))
        FROM {table_name}
        WHERE {column_name} LIKE :pattern
          AND REGEXP_LIKE(SUBSTR({column_name}, :prefix_len_plus_one), '^[0-9]+$')
        """,
        {
            "prefix_len_plus_one": len(prefix) + 1,
            "pattern": f"{prefix}%",
        },
    )
    current = cursor.fetchone()[0] or 0
    return f"{prefix}{current + 1:03d}"


def ensure_user(cursor, payload):
    email = (payload.get("email") or "").strip()
    full_name = (payload.get("fullName") or payload.get("full_name") or "Student User").strip()
    phone_no = (payload.get("phoneNo") or payload.get("phone_no") or "0000000000").strip()

    if email:
        cursor.execute(
            """
            SELECT UserID, FullName, Email, PhoneNo
            FROM USERS
            WHERE LOWER(Email) = LOWER(:email)
            """,
            {"email": email},
        )
        row = cursor.fetchone()
        if row:
            return {
                "userId": row[0],
                "fullName": row[1],
                "email": row[2],
                "phoneNo": row[3],
            }

    user_id = next_id(cursor, "USERS", "UserID", "U")
    cursor.execute(
        """
        INSERT INTO USERS (UserID, FullName, Email, PhoneNo, Password)
        VALUES (:user_id, :full_name, :email, :phone_no, :password)
        """,
        {
            "user_id": user_id,
            "full_name": full_name[:50],
            "email": email[:50],
            "phone_no": phone_no[:15],
            "password": "CLERK_AUTH",
        },
    )
    return {
        "userId": user_id,
        "fullName": full_name,
        "email": email,
        "phoneNo": phone_no,
    }


def get_booking_rows(cursor, where_clause="", params=None):
    query = f"""
        SELECT b.BookingID,
               b.UserID,
               u.FullName,
               c.CourtID,
               c.CourtName,
               ct.TypeName,
               b.BookingDate,
               b.StartTime,
               b.EndTime,
               b.BookingStatus,
               p.PaymentID,
               p.Amount,
               p.PaymentMethod,
               p.PaymentStatus
        FROM BOOKING b
        JOIN USERS u ON b.UserID = u.UserID
        JOIN COURT c ON b.CourtID = c.CourtID
        JOIN COURT_TYPE ct ON c.CourtTypeID = ct.CourtTypeID
        LEFT JOIN PAYMENT p ON b.BookingID = p.BookingID
        {where_clause}
        ORDER BY b.BookingDate DESC, b.StartTime DESC
    """
    cursor.execute(query, params or {})
    bookings = []
    for row in cursor.fetchall():
        duration = booking_duration(row[7], row[8])
        booking_status = row[9] or "Pending"
        payment_status = row[13] or "Unpaid"
        amount = float(row[11] or 0)
        if booking_status == "Cancelled" or payment_status in ("Cancelled", "Refunded"):
            amount = 0

        bookings.append(
            {
                "bookingId": row[0],
                "userId": row[1],
                "fullName": row[2],
                "courtId": row[3],
                "courtName": row[4],
                "typeName": row[5],
                "bookingDate": normalize_date(row[6]),
                "startTime": row[7],
                "endTime": row[8],
                "duration": duration,
                "bookingStatus": booking_status,
                "paymentId": row[10],
                "amount": amount,
                "paymentMethod": row[12] or "Pending",
                "paymentStatus": payment_status,
            }
        )
    return bookings


def error_response(message, status=400):
    return jsonify({"success": False, "message": message}), status


@app.route("/")
def index():
    return send_from_directory(PROJECT_DIR, "index.html")


@app.route("/<path:path>")
def static_files(path):
    target = PROJECT_DIR / path
    if target.exists() and target.is_file():
        return send_from_directory(PROJECT_DIR, path)
    return send_from_directory(PROJECT_DIR, "index.html")


@app.get("/api/health")
def health():
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT 'OK' FROM dual")
                value = cursor.fetchone()[0]
        return jsonify({"success": True, "database": value})
    except Exception as exc:
        return error_response(str(exc), 500)


@app.post("/api/users/sync")
def sync_user():
    payload = request.get_json(force=True)
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                user = ensure_user(cursor, payload)
            conn.commit()
        return jsonify({"success": True, "user": user})
    except Exception as exc:
        return error_response(str(exc), 500)


@app.get("/api/court-types")
def court_types():
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT ct.CourtTypeID,
                           ct.TypeName,
                           COUNT(c.CourtID) AS CourtCount
                    FROM COURT_TYPE ct
                    LEFT JOIN COURT c ON ct.CourtTypeID = c.CourtTypeID
                    GROUP BY ct.CourtTypeID, ct.TypeName
                    ORDER BY ct.CourtTypeID
                    """
                )
                items = [
                    {"courtTypeId": row[0], "typeName": row[1], "courtCount": row[2]}
                    for row in cursor.fetchall()
                ]
        return jsonify({"success": True, "courtTypes": items})
    except Exception as exc:
        return error_response(str(exc), 500)


@app.get("/api/courts")
def courts():
    type_id = request.args.get("type_id")
    available_only = request.args.get("available") == "1"
    clauses = []
    params = {}
    if type_id:
        clauses.append("c.CourtTypeID = :type_id")
        params["type_id"] = type_id
    if available_only:
        clauses.append("c.CourtStatus = 'Available'")

    where_clause = f"WHERE {' AND '.join(clauses)}" if clauses else ""

    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    f"""
                    SELECT c.CourtID,
                           c.CourtName,
                           c.CourtTypeID,
                           ct.TypeName,
                           c.CourtStatus,
                           c.Location,
                           c.PricePerHour
                    FROM COURT c
                    JOIN COURT_TYPE ct ON c.CourtTypeID = ct.CourtTypeID
                    {where_clause}
                    ORDER BY c.CourtID
                    """,
                    params,
                )
                items = [
                    {
                        "courtId": row[0],
                        "courtName": row[1],
                        "courtTypeId": row[2],
                        "typeName": row[3],
                        "courtStatus": row[4],
                        "location": row[5],
                        "pricePerHour": float(row[6]),
                    }
                    for row in cursor.fetchall()
                ]
        return jsonify({"success": True, "courts": items})
    except Exception as exc:
        return error_response(str(exc), 500)


@app.post("/api/courts")
def add_court():
    payload = request.get_json(force=True)
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                court_id = payload.get("courtId") or next_id(cursor, "COURT", "CourtID", "C")
                cursor.execute(
                    """
                    INSERT INTO COURT (CourtID, CourtName, CourtTypeID, CourtStatus, Location, PricePerHour)
                    VALUES (:court_id, :court_name, :court_type_id, :court_status, :location, :price_per_hour)
                    """,
                    {
                        "court_id": court_id,
                        "court_name": payload["courtName"],
                        "court_type_id": payload["courtTypeId"],
                        "court_status": payload.get("courtStatus", "Available"),
                        "location": payload["location"],
                        "price_per_hour": payload.get("pricePerHour", 10),
                    },
                )
            conn.commit()
        return jsonify({"success": True, "message": "Court added.", "courtId": court_id})
    except Exception as exc:
        return error_response(str(exc), 500)


@app.put("/api/courts/<court_id>")
def update_court(court_id):
    payload = request.get_json(force=True)
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    UPDATE COURT
                    SET CourtName = :court_name,
                        CourtTypeID = :court_type_id,
                        CourtStatus = :court_status,
                        Location = :location,
                        PricePerHour = :price_per_hour
                    WHERE CourtID = :court_id
                    """,
                    {
                        "court_id": court_id,
                        "court_name": payload["courtName"],
                        "court_type_id": payload["courtTypeId"],
                        "court_status": payload["courtStatus"],
                        "location": payload["location"],
                        "price_per_hour": payload["pricePerHour"],
                    },
                )
                if cursor.rowcount == 0:
                    return error_response("Court ID does not exist.", 404)
            conn.commit()
        return jsonify({"success": True, "message": "Court updated."})
    except Exception as exc:
        return error_response(str(exc), 500)


@app.delete("/api/courts/<court_id>")
def delete_court(court_id):
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("DELETE FROM COURT WHERE CourtID = :court_id", {"court_id": court_id})
                if cursor.rowcount == 0:
                    return error_response("Court ID does not exist.", 404)
            conn.commit()
        return jsonify({"success": True, "message": "Court deleted."})
    except Exception as exc:
        return error_response(str(exc), 500)


@app.get("/api/bookings")
def bookings():
    user_id = request.args.get("user_id")
    where_clause = ""
    params = {}
    if user_id:
        where_clause = "WHERE b.UserID = :user_id"
        params["user_id"] = user_id

    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                items = get_booking_rows(cursor, where_clause, params)
        return jsonify({"success": True, "bookings": items})
    except Exception as exc:
        return error_response(str(exc), 500)


@app.post("/api/bookings")
def create_booking():
    payload = request.get_json(force=True)
    user_payload = payload.get("user") or {}

    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                user = ensure_user(cursor, user_payload)
                booking_id = next_id(cursor, "BOOKING", "BookingID", "B")
                payment_id = next_id(cursor, "PAYMENT", "PaymentID", "P")
                start_time = payload["startTime"]
                end_time = add_hours(start_time, payload.get("duration", 1))

                cursor.callproc(
                    "ADD_NEW_BOOKING",
                    [
                        booking_id,
                        user["userId"],
                        payload["courtId"],
                        datetime.strptime(payload["bookingDate"], "%Y-%m-%d"),
                        start_time,
                        end_time,
                    ],
                )

                amount_var = cursor.callfunc("CALCULATE_BOOKING_AMOUNT", oracledb.NUMBER, [booking_id])
                amount = float(amount_var)

                cursor.execute(
                    """
                    INSERT INTO PAYMENT (PaymentID, BookingID, PaymentDate, Amount, PaymentMethod, PaymentStatus)
                    VALUES (:payment_id, :booking_id, SYSDATE, :amount, :payment_method, :payment_status)
                    """,
                    {
                        "payment_id": payment_id,
                        "booking_id": booking_id,
                        "amount": amount,
                        "payment_method": payload.get("paymentMethod", "Pending"),
                        "payment_status": payload.get("paymentStatus", "Unpaid"),
                    },
                )
            conn.commit()

            with conn.cursor() as cursor:
                item = get_booking_rows(cursor, "WHERE b.BookingID = :booking_id", {"booking_id": booking_id})[0]

        return jsonify({"success": True, "message": "Booking saved to Oracle.", "booking": item, "user": user})
    except Exception as exc:
        return error_response(str(exc), 500)


@app.patch("/api/bookings/<booking_id>/status")
def update_booking_status(booking_id):
    payload = request.get_json(force=True)
    status = payload.get("bookingStatus")
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                if status == "Cancelled":
                    cursor.execute(
                        """
                        SELECT NVL(p.PaymentStatus, 'Unpaid')
                        FROM BOOKING b
                        LEFT JOIN PAYMENT p ON b.BookingID = p.BookingID
                        WHERE b.BookingID = :booking_id
                        """,
                        {"booking_id": booking_id},
                    )
                    row = cursor.fetchone()
                    if not row:
                        return error_response("Booking ID does not exist.", 404)
                    if row[0] in ("Paid", "Refunded"):
                        return error_response("Paid bookings cannot be cancelled.", 400)

                cursor.callproc("UPDATE_BOOKING_STATUS", [booking_id, status])
                if status == "Cancelled":
                    cursor.execute(
                        """
                        UPDATE PAYMENT
                        SET PaymentStatus = 'Cancelled'
                        WHERE BookingID = :booking_id
                          AND PaymentStatus <> 'Paid'
                        """,
                        {"booking_id": booking_id},
                    )
            conn.commit()
        return jsonify({"success": True, "message": "Booking status updated."})
    except Exception as exc:
        return error_response(str(exc), 500)


@app.patch("/api/bookings/<booking_id>/cancel")
def cancel_booking(booking_id):
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT b.BookingStatus,
                           NVL(p.PaymentStatus, 'Unpaid')
                    FROM BOOKING b
                    LEFT JOIN PAYMENT p ON b.BookingID = p.BookingID
                    WHERE b.BookingID = :booking_id
                    """,
                    {"booking_id": booking_id},
                )
                row = cursor.fetchone()
                if not row:
                    return error_response("Booking ID does not exist.", 404)

                booking_status, payment_status = row
                if booking_status == "Cancelled":
                    rows = get_booking_rows(cursor, "WHERE b.BookingID = :booking_id", {"booking_id": booking_id})
                    return jsonify({"success": True, "message": "Booking is already cancelled.", "booking": rows[0]})
                if payment_status in ("Paid", "Refunded"):
                    return error_response("Paid bookings cannot be cancelled.", 400)

                cursor.callproc("UPDATE_BOOKING_STATUS", [booking_id, "Cancelled"])
                cursor.execute(
                    """
                    UPDATE PAYMENT
                    SET PaymentStatus = 'Cancelled'
                    WHERE BookingID = :booking_id
                      AND PaymentStatus <> 'Paid'
                    """,
                    {"booking_id": booking_id},
                )
            conn.commit()

            with conn.cursor() as cursor:
                rows = get_booking_rows(cursor, "WHERE b.BookingID = :booking_id", {"booking_id": booking_id})
                if not rows:
                    return error_response("Booking ID does not exist.", 404)

        return jsonify({"success": True, "message": "Booking cancelled.", "booking": rows[0]})
    except Exception as exc:
        return error_response(str(exc), 500)


@app.delete("/api/bookings/<booking_id>")
def delete_cancelled_booking(booking_id):
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.callproc("DELETE_CANCELLED_BOOKING", [booking_id])
            conn.commit()
        return jsonify({"success": True, "message": "Cancelled booking deleted from Oracle."})
    except Exception as exc:
        return error_response(str(exc), 500)


@app.patch("/api/bookings/<booking_id>/payment")
def update_payment_status(booking_id):
    payload = request.get_json(force=True)
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                payment_status = payload.get("paymentStatus")
                payment_method = payload.get("paymentMethod")
                if payment_status and payment_method:
                    cursor.execute(
                        """
                        UPDATE PAYMENT
                        SET PaymentStatus = :payment_status,
                            PaymentMethod = :payment_method
                        WHERE BookingID = :booking_id
                        """,
                        {
                            "booking_id": booking_id,
                            "payment_status": payment_status,
                            "payment_method": payment_method,
                        },
                    )
                elif payment_status:
                    cursor.execute(
                        """
                        UPDATE PAYMENT
                        SET PaymentStatus = :payment_status
                        WHERE BookingID = :booking_id
                        """,
                        {
                            "booking_id": booking_id,
                            "payment_status": payment_status,
                        },
                    )
                elif payment_method:
                    cursor.execute(
                        """
                        UPDATE PAYMENT
                        SET PaymentMethod = :payment_method
                        WHERE BookingID = :booking_id
                        """,
                        {
                            "booking_id": booking_id,
                            "payment_method": payment_method,
                        },
                    )
                else:
                    return error_response("No payment status or method was provided.", 400)
                if cursor.rowcount == 0:
                    return error_response("Payment record does not exist.", 404)
            conn.commit()
        return jsonify({"success": True, "message": "Payment status updated."})
    except Exception as exc:
        return error_response(str(exc), 500)


@app.get("/api/admin/summary")
def admin_summary():
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT COUNT(*) FROM COURT")
                total_courts = cursor.fetchone()[0]
                cursor.execute("SELECT COUNT(*) FROM BOOKING")
                total_bookings = cursor.fetchone()[0]
                cursor.execute("SELECT COUNT(*) FROM PAYMENT WHERE PaymentStatus = 'Unpaid'")
                pending_payments = cursor.fetchone()[0]
                cursor.execute("SELECT COUNT(*) FROM BOOKING WHERE BookingStatus = 'Cancelled'")
                cancelled_bookings = cursor.fetchone()[0]
                recent = get_booking_rows(cursor)
        return jsonify(
            {
                "success": True,
                "summary": {
                    "totalCourts": total_courts,
                    "totalBookings": total_bookings,
                    "pendingPayments": pending_payments,
                    "cancelledBookings": cancelled_bookings,
                },
                "recentBookings": recent[:5],
            }
        )
    except Exception as exc:
        return error_response(str(exc), 500)


@app.get("/api/functions/booking-amount/<booking_id>")
def function_booking_amount(booking_id):
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                amount = cursor.callfunc("CALCULATE_BOOKING_AMOUNT", oracledb.NUMBER, [booking_id])
        return jsonify({"success": True, "bookingId": booking_id, "amount": float(amount)})
    except Exception as exc:
        return error_response(str(exc), 500)


@app.get("/api/functions/user-booking-count/<user_id>")
def function_user_booking_count(user_id):
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                total = cursor.callfunc("COUNT_USER_BOOKINGS", oracledb.NUMBER, [user_id])
        return jsonify({"success": True, "userId": user_id, "totalBookings": int(total)})
    except Exception as exc:
        return error_response(str(exc), 500)


if __name__ == "__main__":
    app.run(debug=False, host="127.0.0.1", port=5000)
