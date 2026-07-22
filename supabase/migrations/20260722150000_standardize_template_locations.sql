-- Migration: Standardize listing_templates and captains location values to standard Keys regions

UPDATE public.listing_templates
SET location = CASE
    WHEN location ILIKE '%lower%' OR location ILIKE '%west%' OR location ILIKE '%pine%' THEN 'Lower Keys (Key West, Big Pine Key)'
    WHEN location ILIKE '%middle%' OR location ILIKE '%marathon%' OR location ILIKE '%pigeon%' THEN 'Middle Keys (Marathon, Pigeon Key)'
    ELSE 'Upper Keys (Key Largo, Islamorada)'
END;

UPDATE public.captains
SET locations = ARRAY(
    SELECT DISTINCT CASE
        WHEN val ILIKE '%lower%' OR val ILIKE '%west%' OR val ILIKE '%pine%' THEN 'Lower Keys (Key West, Big Pine Key)'
        WHEN val ILIKE '%middle%' OR val ILIKE '%marathon%' OR val ILIKE '%pigeon%' THEN 'Middle Keys (Marathon, Pigeon Key)'
        ELSE 'Upper Keys (Key Largo, Islamorada)'
    END
    FROM unnest(locations) AS val
);
