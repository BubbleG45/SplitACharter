-- Migration to make admin access 100% database-managed without relying on environment variables

-- 1. Trigger function when an email is inserted or updated in public.admin_emails
CREATE OR REPLACE FUNCTION public.handle_admin_email_added()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
    IF NEW.email IS NOT NULL THEN
        INSERT INTO public.admin_users (id)
        SELECT id FROM auth.users
        WHERE lower(email) = lower(NEW.email)
        ON CONFLICT (id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_admin_email_added ON public.admin_emails;
CREATE TRIGGER on_admin_email_added
    AFTER INSERT OR UPDATE ON public.admin_emails
    FOR EACH ROW EXECUTE FUNCTION public.handle_admin_email_added();

-- 2. Trigger function when an email is deleted from public.admin_emails
CREATE OR REPLACE FUNCTION public.handle_admin_email_removed()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
    IF OLD.email IS NOT NULL THEN
        DELETE FROM public.admin_users
        WHERE id IN (
            SELECT id FROM auth.users WHERE lower(email) = lower(OLD.email)
        );
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_admin_email_removed ON public.admin_emails;
CREATE TRIGGER on_admin_email_removed
    AFTER DELETE ON public.admin_emails
    FOR EACH ROW EXECUTE FUNCTION public.handle_admin_email_removed();

-- 3. Backfill existing users in auth.users whose email is already in admin_emails
INSERT INTO public.admin_users (id)
SELECT u.id 
FROM auth.users u
JOIN public.admin_emails ae ON lower(u.email) = lower(ae.email)
ON CONFLICT (id) DO NOTHING;
