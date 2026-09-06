-- Add is_archived to bookings table
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;

-- Add index for efficient filtering of customer bookings by archived state
CREATE INDEX IF NOT EXISTS idx_bookings_customer_archived
ON public.bookings (customer_id, is_archived);
