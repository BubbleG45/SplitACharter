-- Migration: Discount Promo Codes & Paid Amount Tracking
-- Date: 2026-10-28

-- 1. Create promo_codes table for the 4 customizable discount slots
CREATE TABLE IF NOT EXISTS public.promo_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_number integer NOT NULL UNIQUE CHECK (slot_number BETWEEN 1 AND 4),
    code text NOT NULL UNIQUE,
    discount_percent integer NOT NULL CHECK (discount_percent >= 0 AND discount_percent <= 100),
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER update_promo_codes_modtime
    BEFORE UPDATE ON public.promo_codes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial 4 slots with default codes
INSERT INTO public.promo_codes (slot_number, code, discount_percent, active)
VALUES
    (1, 'SAVE10', 10, true),
    (2, 'SAVE20', 20, true),
    (3, 'HALF50', 50, true),
    (4, 'CHARTERFREE', 100, true)
ON CONFLICT (slot_number) DO NOTHING;

-- 2. Add discount and original amount tracking to payment_records
ALTER TABLE public.payment_records
    ADD COLUMN IF NOT EXISTS promo_code text,
    ADD COLUMN IF NOT EXISTS discount_percent integer,
    ADD COLUMN IF NOT EXISTS discount_amount numeric(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS original_amount numeric(10,2) DEFAULT 50.00;

-- 3. Add promo code tracking to bookings
ALTER TABLE public.bookings
    ADD COLUMN IF NOT EXISTS promo_code text,
    ADD COLUMN IF NOT EXISTS discount_percent integer;

-- 4. Enable RLS on promo_codes
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active promo codes (or all codes for authenticated/service role)
DROP POLICY IF EXISTS "Public can view active promo codes" ON public.promo_codes;
CREATE POLICY "Public can view active promo codes"
    ON public.promo_codes
    FOR SELECT
    USING (true);

-- Allow service role and admins full management
DROP POLICY IF EXISTS "Service role and admins can manage promo codes" ON public.promo_codes;
CREATE POLICY "Service role and admins can manage promo codes"
    ON public.promo_codes
    FOR ALL
    USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM public.admin_emails ae
            WHERE ae.email = (auth.jwt() ->> 'email')
        )
    );
