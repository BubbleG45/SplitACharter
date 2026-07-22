-- Migration: Rename "Deep Sea" to "Offshore Fishing" in public.trip_types and related tables

-- 1. Insert 'Offshore Fishing' into public.trip_types if it doesn't already exist
INSERT INTO public.trip_types (name)
VALUES ('Offshore Fishing')
ON CONFLICT (name) DO NOTHING;

-- 2. Update listing_templates to point to 'Offshore Fishing'
UPDATE public.listing_templates
SET trip_type = 'Offshore Fishing'
WHERE trip_type = 'Deep Sea';

-- 3. Update captains trip_types array
UPDATE public.captains
SET trip_types = array_replace(trip_types, 'Deep Sea', 'Offshore Fishing')
WHERE 'Deep Sea' = ANY(trip_types);

-- 4. Delete 'Deep Sea' from public.trip_types if no foreign keys reference it
DELETE FROM public.trip_types
WHERE name = 'Deep Sea';
