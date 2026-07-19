-- Create customer_strikes table to track detailed reason and trip causes
CREATE TABLE public.customer_strikes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    trip_instance_id uuid REFERENCES public.trip_instances(id) ON DELETE SET NULL,
    reason text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for lookup performance
CREATE INDEX idx_customer_strikes_customer_id ON public.customer_strikes(customer_id);

-- Enable RLS
ALTER TABLE public.customer_strikes ENABLE ROW LEVEL SECURITY;

-- Policy: Admin can do anything
CREATE POLICY admin_customer_strikes ON public.customer_strikes
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin_users WHERE id = auth.uid()
        )
    );

-- Policy: Customers can view their own strikes
CREATE POLICY customer_view_own_strikes ON public.customer_strikes
    FOR SELECT
    TO authenticated
    USING (auth.uid() = customer_id);

-- Sync function and trigger to keep customers.strike_count updated automatically
CREATE OR REPLACE FUNCTION public.sync_customer_strike_count()
RETURNS TRIGGER AS $$
DECLARE
    v_strike_count integer;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.customers
        SET strike_count = strike_count + 1
        WHERE id = NEW.customer_id
        RETURNING strike_count INTO v_strike_count;
        
        -- Automatically flag customer if strikes reach 3
        IF (v_strike_count >= 3) THEN
            UPDATE public.customers
            SET flagged = true
            WHERE id = NEW.customer_id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.customers
        SET strike_count = GREATEST(0, strike_count - 1)
        WHERE id = OLD.customer_id
        RETURNING strike_count INTO v_strike_count;
        
        -- Automatically unflag customer if strikes fall below 3
        IF (v_strike_count < 3) THEN
            UPDATE public.customers
            SET flagged = false
            WHERE id = OLD.customer_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_sync_customer_strike_count
AFTER INSERT OR DELETE ON public.customer_strikes
FOR EACH ROW EXECUTE FUNCTION public.sync_customer_strike_count();
