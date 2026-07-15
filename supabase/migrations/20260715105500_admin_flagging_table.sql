-- Create admin_emails table
CREATE TABLE IF NOT EXISTS public.admin_emails (
    email text PRIMARY KEY,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

-- Policy for admin_emails
CREATE POLICY admin_emails_admin_policy ON public.admin_emails
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Update handle_new_user() trigger function to automatically flag/insert admins on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
    -- First insert the customer record
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

    -- If the new user's email is in the admin_emails table, insert into admin_users
    IF new.email IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.admin_emails
        WHERE lower(email) = lower(new.email)
    ) THEN
        INSERT INTO public.admin_users (id)
        VALUES (new.id)
        ON CONFLICT (id) DO NOTHING;
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql;
