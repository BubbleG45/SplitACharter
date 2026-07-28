-- Migration: Update check_booking_transition function to allow paid -> reconfirmed transition for 2nd group auto-reconfirmation
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
       (OLD.status = 'awaiting-reconfirm' AND NEW.status IN ('reconfirmed', 'forfeited', 'canceled')) OR
       (OLD.status = 'reconfirmed' AND NEW.status IN ('held', 'canceled')) OR
       (OLD.status = 'held' AND NEW.status IN ('awaiting-reconfirm', 'canceled')) OR
       -- Terminal states self-transition
       (OLD.status = 'forfeited' AND NEW.status = 'forfeited') OR
       (OLD.status = 'canceled' AND NEW.status = 'canceled') THEN
        RETURN NEW;
    ELSE
        RAISE EXCEPTION 'Invalid booking status transition from % to %', OLD.status, NEW.status;
    END IF;
END;
$$ LANGUAGE plpgsql;
