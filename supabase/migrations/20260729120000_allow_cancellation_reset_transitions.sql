-- Migration: Allow resetting trip status to half-booked and booking status to paid on group cancellation/forfeiture

CREATE OR REPLACE FUNCTION public.check_trip_instance_transition()
RETURNS TRIGGER 
SET search_path = public, pg_catalog
AS $$
BEGIN
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    -- Valid transitions
    IF (OLD.status = 'open' AND NEW.status IN ('half-booked', 'canceled')) OR
       (OLD.status = 'half-booked' AND NEW.status IN ('pending-reconfirm', 'open', 'canceled')) OR
       (OLD.status = 'pending-reconfirm' AND NEW.status IN ('confirmed', 'half-booked', 'open', 'canceled')) OR
       (OLD.status = 'confirmed' AND NEW.status IN ('completed', 'half-booked', 'canceled')) OR
       -- Terminal states self-transition
       (OLD.status = 'completed' AND NEW.status = 'completed') OR
       (OLD.status = 'canceled' AND NEW.status = 'canceled') THEN
        RETURN NEW;
    ELSE
        RAISE EXCEPTION 'Invalid trip instance status transition from % to %', OLD.status, NEW.status;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.check_booking_transition()
RETURNS TRIGGER 
SET search_path = public, pg_catalog
AS $$
BEGIN
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    -- Valid transitions
    IF (OLD.status = 'pending-payment' AND NEW.status IN ('paid', 'canceled')) OR
       (OLD.status = 'paid' AND NEW.status IN ('awaiting-reconfirm', 'reconfirmed', 'canceled')) OR
       (OLD.status = 'awaiting-reconfirm' AND NEW.status IN ('paid', 'reconfirmed', 'forfeited', 'canceled')) OR
       (OLD.status = 'reconfirmed' AND NEW.status IN ('paid', 'held', 'canceled')) OR
       (OLD.status = 'held' AND NEW.status IN ('paid', 'awaiting-reconfirm', 'canceled')) OR
       -- Terminal states self-transition
       (OLD.status = 'forfeited' AND NEW.status = 'forfeited') OR
       (OLD.status = 'canceled' AND NEW.status = 'canceled') THEN
        RETURN NEW;
    ELSE
        RAISE EXCEPTION 'Invalid booking status transition from % to %', OLD.status, NEW.status;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Update notification template for counterpart_forfeited trigger
UPDATE public.admin_notification_settings
SET 
    email_template = 'The other group on your charter for {trip_date} cancelled or failed to reconfirm. As a result, your trip has been reset to Half-Booked so another group can join.' || chr(10) || chr(10) || 'Your reservation status has been set back to Paid. When a new group matches with your trip, you will be asked to reconfirm again.' || chr(10) || chr(10) || 'View details: {dashboard_url}',
    sms_template = 'SplitACharter: The other group on your {trip_date} charter cancelled or failed to reconfirm. Your trip is back to Half-Booked and your status is Paid. You will reconfirm when a new match is found.'
WHERE trigger_name = 'counterpart_forfeited';
