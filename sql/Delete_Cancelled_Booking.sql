---------------------- DELETE CANCELLED BOOKING PROCEDURE ----------------------
-- This procedure allows users to delete only cancelled bookings.
-- PAYMENT is deleted first because it has a foreign key to BOOKING.

SET SERVEROUTPUT ON;

CREATE OR REPLACE PROCEDURE Delete_Cancelled_Booking
(
    p_BookingID IN BOOKING.BookingID%TYPE
)
AS
    v_BookingID BOOKING.BookingID%TYPE;
    v_Status    BOOKING.BookingStatus%TYPE;
    v_Count     NUMBER;
BEGIN
    v_BookingID := UPPER(TRIM(p_BookingID));

    -- Check whether booking exists.
    SELECT COUNT(*)
    INTO v_Count
    FROM BOOKING
    WHERE BookingID = v_BookingID;

    IF v_Count = 0 THEN
        RAISE_APPLICATION_ERROR(
            -20013,
            'Booking ID does not exist.'
        );
    END IF;

    -- Get booking status.
    SELECT BookingStatus
    INTO v_Status
    FROM BOOKING
    WHERE BookingID = v_BookingID;

    -- Only cancelled bookings can be deleted.
    IF v_Status != 'Cancelled' THEN
        RAISE_APPLICATION_ERROR(
            -20014,
            'Only cancelled bookings can be deleted.'
        );
    END IF;

    DELETE FROM PAYMENT
    WHERE BookingID = v_BookingID;

    DELETE FROM BOOKING
    WHERE BookingID = v_BookingID;

    DBMS_OUTPUT.PUT_LINE(
        'Cancelled booking ' || v_BookingID || ' was deleted successfully.'
    );
END;
/

---------------------- CALL PROCEDURE ----------------------
-- Run this section using F5 / Run Script.

ACCEPT p_booking_id CHAR PROMPT 'Enter cancelled Booking ID to delete: '

BEGIN
    Delete_Cancelled_Booking('&p_booking_id');
END;
/

COMMIT;

---------------------- CHECK RESULT ----------------------
SELECT *
FROM BOOKING
WHERE BookingID = UPPER(TRIM('&p_booking_id'));

SELECT *
FROM PAYMENT
WHERE BookingID = UPPER(TRIM('&p_booking_id'));

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
WHERE ObjectName = 'DELETE_CANCELLED_BOOKING';
