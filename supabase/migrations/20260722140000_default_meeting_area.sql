-- Migration: Set default value for meeting_area column in public.listing_templates
ALTER TABLE public.listing_templates
ALTER COLUMN meeting_area SET DEFAULT 'Meeting details sent after confirmation';

-- Update existing rows where meeting_area is null or empty or defaulted to old value
UPDATE public.listing_templates
SET meeting_area = 'Meeting details sent after confirmation'
WHERE meeting_area IS NULL OR trim(meeting_area) = '' OR meeting_area = 'Provided by captain' OR meeting_area = 'Provided by Captain';
