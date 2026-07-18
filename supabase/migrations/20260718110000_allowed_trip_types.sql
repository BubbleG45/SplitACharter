-- Create public.trip_types table
CREATE TABLE IF NOT EXISTS public.trip_types (
    name text PRIMARY KEY,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trip_types ENABLE ROW LEVEL SECURITY;

-- Select policy: public read access
CREATE POLICY select_trip_types ON public.trip_types
    FOR SELECT TO public
    USING (true);

-- Write policy: admin only
CREATE POLICY write_trip_types ON public.trip_types
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Insert initial allowed trip types
INSERT INTO public.trip_types (name) VALUES
('Reef Fishing'),
('Deep Sea'),
('Backcountry'),
('Sandbar'),
('Snorkeling'),
('Scuba Diving'),
('Freedive Spearfishing'),
('Scuba Spearfishing'),
('Lobstering'),
('Eco Tour'),
('Sunset Cruise'),
('Fly Fishing')
ON CONFLICT (name) DO NOTHING;

-- Map existing invalid listing templates to valid trip types
UPDATE public.listing_templates SET trip_type = 'Deep Sea' WHERE trip_type = 'Test Fishing';
UPDATE public.listing_templates SET trip_type = 'Scuba Diving' WHERE trip_type = 'Test Scuba';

-- Ensure all other listing templates have a valid trip type (fallback to 'Deep Sea' if invalid)
UPDATE public.listing_templates lt
SET trip_type = 'Deep Sea'
WHERE NOT EXISTS (
    SELECT 1 FROM public.trip_types tt WHERE tt.name = lt.trip_type
);

-- Add foreign key constraint to public.listing_templates
ALTER TABLE public.listing_templates
    ADD CONSTRAINT fk_listing_template_trip_type
    FOREIGN KEY (trip_type) REFERENCES public.trip_types(name)
    ON UPDATE CASCADE;

-- Map existing captains' trip_types arrays to valid trip types
UPDATE public.captains
SET trip_types = ARRAY(
    SELECT DISTINCT CASE 
        WHEN val = 'Inshore Fishing' THEN 'Fly Fishing'
        WHEN val = 'Offshore Fishing' THEN 'Deep Sea'
        WHEN val = 'Sandbar Excursion' THEN 'Sandbar'
        WHEN val = 'Snorkeling Trip' THEN 'Snorkeling'
        ELSE val
    END
    FROM unnest(trip_types) AS val
    WHERE val IN (
        'Inshore Fishing', 'Offshore Fishing', 'Reef Fishing', 'Sunset Cruise', 
        'Sandbar Excursion', 'Snorkeling Trip', 'Deep Sea', 'Backcountry', 
        'Snorkeling', 'Scuba Diving', 'Freedive Spearfishing', 'Scuba Spearfishing', 
        'Lobstering', 'Eco Tour', 'Fly Fishing'
    )
);

-- Cleanup captains who might have array elements that aren't in the allowed table
-- filter trip_types array elements to only match allowed names
UPDATE public.captains c
SET trip_types = ARRAY(
    SELECT val FROM unnest(c.trip_types) AS val
    WHERE EXISTS (
        SELECT 1 FROM public.trip_types tt WHERE tt.name = val
    )
);
