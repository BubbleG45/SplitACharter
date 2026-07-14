-- Create custom enums
CREATE TYPE public.trip_instance_status AS ENUM (
    'open',
    'half-booked',
    'pending-reconfirm',
    'confirmed',
    'completed',
    'canceled'
);

CREATE TYPE public.booking_status AS ENUM (
    'pending-payment',
    'paid',
    'awaiting-reconfirm',
    'reconfirmed',
    'forfeited',
    'held',
    'canceled'
);

-- Reusable updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. admin_users
CREATE TABLE public.admin_users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 2. customers
CREATE TABLE public.customers (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    email text NOT NULL UNIQUE,
    phone text NOT NULL,
    sms_opt_in boolean NOT NULL DEFAULT false,
    how_heard text NOT NULL,
    city text,
    state text,
    experience text,
    geolocation jsonb,
    strike_count integer NOT NULL DEFAULT 0,
    flagged boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TRIGGER update_customers_modtime
    BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. listing_templates
CREATE TABLE public.listing_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_type text NOT NULL,
    location text NOT NULL,
    duration interval NOT NULL,
    low_price numeric(10,2) NOT NULL,
    high_price numeric(10,2) NOT NULL,
    max_passengers integer NOT NULL,
    description text NOT NULL,
    whats_included text[] NOT NULL DEFAULT '{}',
    what_to_bring text[] NOT NULL DEFAULT '{}',
    meeting_area text NOT NULL,
    active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT chk_price_range CHECK (low_price <= high_price),
    CONSTRAINT chk_max_passengers CHECK (max_passengers > 0)
);

CREATE TRIGGER update_listing_templates_modtime
    BEFORE UPDATE ON public.listing_templates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. captains
CREATE TABLE public.captains (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    trip_types text[] NOT NULL DEFAULT '{}',
    locations text[] NOT NULL DEFAULT '{}',
    minimum_notice interval NOT NULL,
    max_passengers integer NOT NULL,
    small_craft_advisory_flag boolean NOT NULL DEFAULT false,
    referral_promo_code text NOT NULL UNIQUE,
    admin_notes text,
    active boolean NOT NULL DEFAULT true,
    login_placeholder text,
    availability_calendar jsonb,
    booking_platform_name text,
    booking_platform_id text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT chk_captain_max_passengers CHECK (max_passengers > 0)
);

CREATE TRIGGER update_captains_modtime
    BEFORE UPDATE ON public.captains
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. trip_instances
CREATE TABLE public.trip_instances (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_template_id uuid NOT NULL REFERENCES public.listing_templates(id) ON DELETE RESTRICT,
    date date NOT NULL,
    status public.trip_instance_status NOT NULL DEFAULT 'open',
    captain_id uuid REFERENCES public.captains(id) ON DELETE SET NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TRIGGER update_trip_instances_modtime
    BEFORE UPDATE ON public.trip_instances
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. bookings
CREATE TABLE public.bookings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_instance_id uuid NOT NULL REFERENCES public.trip_instances(id) ON DELETE RESTRICT,
    customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    group_size integer NOT NULL,
    status public.booking_status NOT NULL DEFAULT 'pending-payment',
    reconfirmation_timestamp timestamp with time zone,
    certification_fields jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT chk_group_size CHECK (group_size > 0)
);

CREATE TRIGGER update_bookings_modtime
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. payment_records
CREATE TABLE public.payment_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
    stripe_payment_intent_id text NOT NULL UNIQUE,
    amount numeric(10,2) NOT NULL,
    status text NOT NULL,
    refund_history jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT chk_amount CHECK (amount >= 0)
);

CREATE TRIGGER update_payment_records_modtime
    BEFORE UPDATE ON public.payment_records
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. notification_logs
CREATE TABLE public.notification_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient text NOT NULL,
    channel text NOT NULL,
    template text NOT NULL,
    content text NOT NULL,
    status text NOT NULL,
    timestamp timestamp with time zone NOT NULL DEFAULT now()
);

-- 9. admin_notification_settings
CREATE TABLE public.admin_notification_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    trigger_name text NOT NULL UNIQUE,
    email_enabled boolean NOT NULL DEFAULT true,
    sms_enabled boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TRIGGER update_admin_notification_settings_modtime
    BEFORE UPDATE ON public.admin_notification_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--------------------------------------------------------------------------
-- STATE MACHINE AND CAPACITY CONSTRAINTS (TRIGGERS)
--------------------------------------------------------------------------

-- TripInstance Status Transitions Trigger
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
       (OLD.status = 'pending-reconfirm' AND NEW.status IN ('confirmed', 'open', 'canceled')) OR
       (OLD.status = 'confirmed' AND NEW.status IN ('completed', 'canceled')) OR
       -- Allow updates to terminal states to self (handled by first IF, but listed for clarity)
       (OLD.status = 'completed' AND NEW.status = 'completed') OR
       (OLD.status = 'canceled' AND NEW.status = 'canceled') THEN
        RETURN NEW;
    ELSE
        RAISE EXCEPTION 'Invalid trip instance status transition from % to %', OLD.status, NEW.status;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_trip_instance_transition_trigger
    BEFORE UPDATE OF status ON public.trip_instances
    FOR EACH ROW EXECUTE FUNCTION public.check_trip_instance_transition();


-- Booking Status Transitions Trigger
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
       (OLD.status = 'paid' AND NEW.status IN ('awaiting-reconfirm', 'canceled')) OR
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

CREATE TRIGGER check_booking_transition_trigger
    BEFORE UPDATE OF status ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.check_booking_transition();


-- Trip Capacity and Group Count Constraint Trigger
CREATE OR REPLACE FUNCTION public.check_trip_capacity()
RETURNS TRIGGER 
SET search_path = public, pg_catalog
AS $$
DECLARE
    booking_count integer;
    max_passengers_limit integer;
    current_passengers integer;
BEGIN
    -- Check total number of bookings (groups) on this trip instance
    SELECT COUNT(*) INTO booking_count
    FROM public.bookings
    WHERE trip_instance_id = NEW.trip_instance_id
      AND status NOT IN ('canceled', 'forfeited');

    -- Check if inserting a new active booking and we already have 2
    IF TG_OP = 'INSERT' AND booking_count >= 2 THEN
        RAISE EXCEPTION 'Trip instance % already has the maximum of 2 groups booked.', NEW.trip_instance_id;
    END IF;

    -- Get max passengers for this trip
    SELECT lt.max_passengers INTO max_passengers_limit
    FROM public.trip_instances ti
    JOIN public.listing_templates lt ON ti.listing_template_id = lt.id
    WHERE ti.id = NEW.trip_instance_id;

    -- Sum up other active bookings (excluding current one if updating)
    SELECT COALESCE(SUM(group_size), 0) INTO current_passengers
    FROM public.bookings
    WHERE trip_instance_id = NEW.trip_instance_id
      AND status NOT IN ('canceled', 'forfeited')
      AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    -- Enforce passenger limit
    IF (current_passengers + NEW.group_size) > max_passengers_limit THEN
        RAISE EXCEPTION 'Booking group size % exceeds the remaining available passenger capacity of % (max: %, currently booked: %).',
            NEW.group_size, (max_passengers_limit - current_passengers), max_passengers_limit, current_passengers;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_trip_capacity_trigger
    BEFORE INSERT OR UPDATE OF group_size, status ON public.bookings
    FOR EACH ROW
    WHEN (NEW.status NOT IN ('canceled', 'forfeited'))
    EXECUTE FUNCTION public.check_trip_capacity();


--------------------------------------------------------------------------
-- AUTHENTICATION AND CUSTOMER ONBOARDING TRIGGERS
--------------------------------------------------------------------------

-- Helper function to check if authenticated user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
    -- Check if user is in admin_users table
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql;

-- Trigger to create customer profile automatically upon auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
    INSERT INTO public.customers (id, name, email, phone, sms_opt_in, how_heard, strike_count, flagged)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'name', ''),
        COALESCE(new.email, ''),
        COALESCE(new.phone, ''),
        false,
        '',
        0,
        false
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


--------------------------------------------------------------------------
-- INDEX OPTIMIZATIONS
--------------------------------------------------------------------------

CREATE INDEX idx_trip_instances_template_date ON public.trip_instances(listing_template_id, date);
CREATE INDEX idx_trip_instances_status ON public.trip_instances(status);
CREATE INDEX idx_trip_instances_captain ON public.trip_instances(captain_id) WHERE captain_id IS NOT NULL;

CREATE INDEX idx_bookings_trip_instance ON public.bookings(trip_instance_id);
CREATE INDEX idx_bookings_customer ON public.bookings(customer_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);

CREATE INDEX idx_customers_email ON public.customers(email);
CREATE INDEX idx_customers_phone ON public.customers(phone);

CREATE INDEX idx_captains_referral_promo ON public.captains(referral_promo_code);
CREATE INDEX idx_captains_active ON public.captains(active);

CREATE INDEX idx_payment_records_booking ON public.payment_records(booking_id);
CREATE INDEX idx_payment_records_stripe_id ON public.payment_records(stripe_payment_intent_id);

CREATE INDEX idx_notification_logs_recipient_timestamp ON public.notification_logs(recipient, timestamp DESC);


--------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
--------------------------------------------------------------------------

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.captains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notification_settings ENABLE ROW LEVEL SECURITY;

-- 1. admin_users policies
CREATE POLICY admin_users_admin_policy ON public.admin_users
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 2. customers policies
CREATE POLICY select_customers ON public.customers
    FOR SELECT TO authenticated
    USING (id = auth.uid() OR public.is_admin());

CREATE POLICY insert_customers ON public.customers
    FOR INSERT TO authenticated
    WITH CHECK (id = auth.uid() OR public.is_admin());

CREATE POLICY update_customers ON public.customers
    FOR UPDATE TO authenticated
    USING (id = auth.uid() OR public.is_admin())
    WITH CHECK (id = auth.uid() OR public.is_admin());

CREATE POLICY delete_customers ON public.customers
    FOR DELETE TO authenticated
    USING (public.is_admin());

-- 3. listing_templates policies
CREATE POLICY select_listing_templates ON public.listing_templates
    FOR SELECT TO public
    USING (active = true OR public.is_admin());

CREATE POLICY write_listing_templates ON public.listing_templates
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 4. captains policies
CREATE POLICY admin_captains ON public.captains
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 5. trip_instances policies
CREATE POLICY select_trip_instances ON public.trip_instances
    FOR SELECT TO public
    USING (true);

CREATE POLICY write_trip_instances ON public.trip_instances
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 6. bookings policies
CREATE POLICY select_bookings ON public.bookings
    FOR SELECT TO authenticated
    USING (customer_id = auth.uid() OR public.is_admin());

CREATE POLICY insert_bookings ON public.bookings
    FOR INSERT TO authenticated
    WITH CHECK (
        ((customer_id = auth.uid() AND NOT EXISTS (
            SELECT 1 FROM public.customers 
            WHERE id = auth.uid() AND flagged = true
        ))) OR public.is_admin()
    );

CREATE POLICY update_bookings ON public.bookings
    FOR UPDATE TO authenticated
    USING (
        ((customer_id = auth.uid() AND NOT EXISTS (
            SELECT 1 FROM public.customers 
            WHERE id = auth.uid() AND flagged = true
        ))) OR public.is_admin()
    )
    WITH CHECK (
        ((customer_id = auth.uid() AND NOT EXISTS (
            SELECT 1 FROM public.customers 
            WHERE id = auth.uid() AND flagged = true
        ))) OR public.is_admin()
    );

CREATE POLICY delete_bookings ON public.bookings
    FOR DELETE TO authenticated
    USING (public.is_admin());

-- 7. payment_records policies
CREATE POLICY select_payment_records ON public.payment_records
    FOR SELECT TO authenticated
    USING (
        public.is_admin() OR 
        EXISTS (
            SELECT 1 FROM public.bookings 
            WHERE bookings.id = booking_id AND bookings.customer_id = auth.uid()
        )
    );

CREATE POLICY write_payment_records ON public.payment_records
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 8. notification_logs policies
CREATE POLICY admin_notification_logs ON public.notification_logs
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 9. admin_notification_settings policies
CREATE POLICY admin_notification_settings_policy ON public.admin_notification_settings
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
