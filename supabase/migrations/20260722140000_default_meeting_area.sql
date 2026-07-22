-- Migration: Set default value for meeting_area column in public.listing_templates
ALTER TABLE public.listing_templates
ALTER COLUMN meeting_area SET DEFAULT 'Provided by captain';

-- Update existing rows where meeting_area is null or empty
UPDATE public.listing_templates
SET meeting_area = 'Provided by captain'
WHERE meeting_area IS NULL OR trim(meeting_area) = '';
