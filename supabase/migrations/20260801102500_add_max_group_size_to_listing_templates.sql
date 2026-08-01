-- Add max_group_size column to listing_templates table to restrict group reservation cap per trip type
ALTER TABLE public.listing_templates
ADD COLUMN IF NOT EXISTS max_group_size integer;

-- Update existing listing templates with smart default:
-- 6+ passengers => max_group_size = 4
-- < 6 passengers => GREATEST(1, FLOOR(max_passengers / 2))
UPDATE public.listing_templates
SET max_group_size = CASE
    WHEN max_passengers >= 6 THEN 4
    ELSE GREATEST(1, FLOOR(max_passengers / 2.0)::integer)
END
WHERE max_group_size IS NULL;

-- Add check constraint ensuring max_group_size is at least 1
ALTER TABLE public.listing_templates
DROP CONSTRAINT IF EXISTS check_max_group_size_positive;

ALTER TABLE public.listing_templates
ADD CONSTRAINT check_max_group_size_positive CHECK (max_group_size >= 1);
