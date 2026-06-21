# Court Booking System Backend

This Flask backend connects the frontend to Oracle Database 11g XE.

## Setup

Open a VS Code terminal:

```powershell
cd D:\court-booking-system\backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python app.py
```

After copying `.env.example`, open `.env` and replace the placeholder values
with your own local Oracle username and password. The `.env` file is ignored by
Git and should not be uploaded.

Open:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/health
```

## Oracle Settings

For Oracle 11g XE:

```text
Host: localhost
Port: 1521
SID: xe
Username: your_oracle_username
Password: your_oracle_password
```

If the backend cannot find Oracle client libraries, check this folder exists:

```text
C:\oraclexe\app\oracle\product\11.2.0\server\bin
```

Then keep this value in `.env`:

```text
ORACLE_CLIENT_LIB_DIR=C:\oraclexe\app\oracle\product\11.2.0\server\bin
```

## What The API Does

- Reads court types and courts from Oracle.
- Saves new Clerk users into the `USERS` table by email.
- Adds bookings by calling `ADD_NEW_BOOKING`.
- Calculates booking payment by calling `CALCULATE_BOOKING_AMOUNT`.
- Updates booking status by calling `UPDATE_BOOKING_STATUS`.
- Reads booking counts through `COUNT_USER_BOOKINGS`.
- Updates payment status in the `PAYMENT` table.
