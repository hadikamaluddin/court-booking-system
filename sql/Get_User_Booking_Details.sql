---------------------- GET USER BOOKING DETAILS USING CURSOR ----------------------
-- This procedure uses an explicit cursor to display all bookings made by a user.
-- It also uses a subquery to get the court type name from COURT_TYPE.

SET SERVEROUTPUT ON;

CREATE OR REPLACE PROCEDURE Get_User_Booking_Details
(
    p_UserID IN USERS.UserID%TYPE
)
AS
    v_UserID USERS.UserID%TYPE;
    v_Count  NUMBER;

    CURSOR booking_cursor IS
        SELECT b.BookingID,
               c.CourtName,
               (
                   SELECT ct.TypeName
                   FROM COURT_TYPE ct
                   WHERE ct.CourtTypeID = c.CourtTypeID
               ) AS CourtType,
               b.BookingDate,
               b.StartTime,
               b.EndTime,
               b.BookingStatus,
               p.PaymentMethod,
               p.PaymentStatus
        FROM BOOKING b
        JOIN COURT c
          ON b.CourtID = c.CourtID
        LEFT JOIN PAYMENT p
          ON b.BookingID = p.BookingID
        WHERE b.UserID = v_UserID
        ORDER BY b.BookingDate DESC, b.StartTime DESC;

    booking_record booking_cursor%ROWTYPE;

BEGIN
    v_UserID := UPPER(TRIM(p_UserID));

    -- Check whether user exists.
    SELECT COUNT(*)
    INTO v_Count
    FROM USERS
    WHERE UserID = v_UserID;

    IF v_Count = 0 THEN
        RAISE_APPLICATION_ERROR(
            -20015,
            'User ID does not exist.'
        );
    END IF;

    DBMS_OUTPUT.PUT_LINE('Booking details for user ' || v_UserID);
    DBMS_OUTPUT.PUT_LINE('----------------------------------------');

    OPEN booking_cursor;

    LOOP
        FETCH booking_cursor INTO booking_record;
        EXIT WHEN booking_cursor%NOTFOUND;

        DBMS_OUTPUT.PUT_LINE('Booking ID: ' || booking_record.BookingID);
        DBMS_OUTPUT.PUT_LINE(
            'Court: ' || booking_record.CourtName ||
            ' (' || booking_record.CourtType || ')'
        );
        DBMS_OUTPUT.PUT_LINE(
            'Date: ' || TO_CHAR(booking_record.BookingDate, 'YYYY-MM-DD')
        );
        DBMS_OUTPUT.PUT_LINE(
            'Time: ' || booking_record.StartTime ||
            ' - ' || booking_record.EndTime
        );
        DBMS_OUTPUT.PUT_LINE(
            'Booking Status: ' || booking_record.BookingStatus
        );
        DBMS_OUTPUT.PUT_LINE(
            'Payment Method: ' ||
            NVL(booking_record.PaymentMethod, 'No payment record')
        );
        DBMS_OUTPUT.PUT_LINE(
            'Payment Status: ' ||
            NVL(booking_record.PaymentStatus, 'No payment record')
        );
        DBMS_OUTPUT.PUT_LINE('----------------------------------------');
    END LOOP;

    IF booking_cursor%ROWCOUNT = 0 THEN
        DBMS_OUTPUT.PUT_LINE('No bookings found for this user.');
    END IF;

    CLOSE booking_cursor;
END;
/

---------------------- CALL PROCEDURE ----------------------
-- Run this section using F5 / Run Script.

ACCEPT p_user_id CHAR PROMPT 'Enter User ID: '

BEGIN
    Get_User_Booking_Details('&p_user_id');
END;
/

---------------------- CHECK PROCEDURE STATUS ----------------------
SELECT ObjectName,
       ObjectType,
       Status
FROM
(
    SELECT OBJECT_NAME AS ObjectName,
           OBJECT_TYPE AS ObjectType,
           STATUS AS Status
    FROM USER_OBJECTS
)
WHERE ObjectName = 'GET_USER_BOOKING_DETAILS';
