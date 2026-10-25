-- Migration: Scalable Locations, Marinas, Durations, and Captain Home-Port Matching
-- Specification: location-matching-spec.md

-- 1. Create public.areas table
CREATE TABLE IF NOT EXISTS public.areas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    slug text NOT NULL UNIQUE,
    center_lat numeric(10,7) NOT NULL,
    center_lng numeric(10,7) NOT NULL,
    active boolean NOT NULL DEFAULT true,
    display_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TRIGGER update_areas_modtime
    BEFORE UPDATE ON public.areas
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_areas ON public.areas
    FOR SELECT TO public
    USING (true);

CREATE POLICY write_areas ON public.areas
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());


-- 2. Create public.marinas table
CREATE TABLE IF NOT EXISTS public.marinas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    address text NOT NULL,
    lat numeric(10,7) NOT NULL,
    lng numeric(10,7) NOT NULL,
    phone text,
    notes text,
    active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TRIGGER update_marinas_modtime
    BEFORE UPDATE ON public.marinas
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.marinas ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_marinas ON public.marinas
    FOR SELECT TO public
    USING (true);

CREATE POLICY write_marinas ON public.marinas
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());


-- 3. Create public.marina_areas junction table
CREATE TABLE IF NOT EXISTS public.marina_areas (
    marina_id uuid NOT NULL REFERENCES public.marinas(id) ON DELETE CASCADE,
    area_id uuid NOT NULL REFERENCES public.areas(id) ON DELETE CASCADE,
    PRIMARY KEY (marina_id, area_id)
);

ALTER TABLE public.marina_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_marina_areas ON public.marina_areas
    FOR SELECT TO public
    USING (true);

CREATE POLICY write_marina_areas ON public.marina_areas
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());


-- 4. Create public.durations table
CREATE TABLE IF NOT EXISTS public.durations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    hours numeric(4,1) NOT NULL,
    label text NOT NULL,
    interval_val interval NOT NULL,
    active boolean NOT NULL DEFAULT true,
    display_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TRIGGER update_durations_modtime
    BEFORE UPDATE ON public.durations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.durations ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_durations ON public.durations
    FOR SELECT TO public
    USING (true);

CREATE POLICY write_durations ON public.durations
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());


-- 5. Extend public.trip_types
ALTER TABLE public.trip_types
    ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;


-- 6. Extend public.listing_templates
ALTER TABLE public.listing_templates
    ADD COLUMN IF NOT EXISTS area_id uuid REFERENCES public.areas(id) ON DELETE RESTRICT,
    ADD COLUMN IF NOT EXISTS duration_id uuid REFERENCES public.durations(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_listing_templates_area_id ON public.listing_templates(area_id);
CREATE INDEX IF NOT EXISTS idx_listing_templates_duration_id ON public.listing_templates(duration_id);


-- 7. Extend public.captains
ALTER TABLE public.captains
    ADD COLUMN IF NOT EXISTS home_marina_id uuid REFERENCES public.marinas(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS durations text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_captains_home_marina_id ON public.captains(home_marina_id);


-- 8. Extend public.trip_instances
ALTER TABLE public.trip_instances
    ADD COLUMN IF NOT EXISTS marina_id uuid REFERENCES public.marinas(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS needs_captain boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS needs_captain_flagged_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_trip_instances_needs_captain ON public.trip_instances(needs_captain);
CREATE INDEX IF NOT EXISTS idx_trip_instances_marina_id ON public.trip_instances(marina_id);


-- 9. Extend public.bookings (Drive Time and Participant Location)
ALTER TABLE public.bookings
    ADD COLUMN IF NOT EXISTS staying_address text,
    ADD COLUMN IF NOT EXISTS staying_lat numeric(10,7),
    ADD COLUMN IF NOT EXISTS staying_lng numeric(10,7),
    ADD COLUMN IF NOT EXISTS drive_time_text text,
    ADD COLUMN IF NOT EXISTS drive_time_minutes integer;


-- 10. Seed Initial Areas
INSERT INTO public.areas (name, slug, center_lat, center_lng, active, display_order)
VALUES
    ('Lower Keys (Key West, Big Pine Key)', 'lower-keys', 24.5551, -81.7800, true, 1),
    ('Middle Keys (Marathon, Pigeon Key)', 'middle-keys', 24.7136, -81.0904, true, 2),
    ('Upper Keys (Key Largo, Islamorada)', 'upper-keys', 24.9342, -80.6077, true, 3)
ON CONFLICT (name) DO UPDATE SET
    slug = EXCLUDED.slug,
    center_lat = EXCLUDED.center_lat,
    center_lng = EXCLUDED.center_lng;


-- 11. Seed Initial Marinas
INSERT INTO public.marinas (id, name, address, lat, lng, active)
VALUES
    ('11111111-1111-1111-1111-111111111101', 'Key West Historic Seaport / Bight Marina', '201 William St, Key West, FL 33040', 24.5615, -81.8016, true),
    ('11111111-1111-1111-1111-111111111102', 'Oceanside Marina', '5950 Peninsular Ave, Key West, FL 33040', 24.5694, -81.7408, true),
    ('22222222-2222-2222-2222-222222222201', 'Safe Harbor Marathon / Boot Key Harbor', '800 35th St Ocean, Marathon, FL 33050', 24.7118, -81.0827, true),
    ('22222222-2222-2222-2222-222222222202', 'Faro Blanco Marina', '1996 Overseas Hwy, Marathon, FL 33050', 24.7176, -81.0963, true),
    ('33333333-3333-3333-3333-333333333301', 'Postcard Inn Marina / Holiday Isle', '84001 Overseas Hwy, Islamorada, FL 33036', 24.9458, -80.5979, true),
    ('33333333-3333-3333-3333-333333333302', 'Marina Del Mar Key Largo', '527 Caribbean Dr, Key Largo, FL 33037', 25.0886, -80.4397, true)
ON CONFLICT (id) DO NOTHING;


-- 12. Link Seed Marinas to Areas in public.marina_areas
INSERT INTO public.marina_areas (marina_id, area_id)
SELECT m.id, a.id
FROM public.marinas m
CROSS JOIN public.areas a
WHERE
    (m.name LIKE '%Key West%' AND a.slug = 'lower-keys')
    OR (m.name LIKE '%Oceanside%' AND a.slug = 'lower-keys')
    OR (m.name LIKE '%Marathon%' AND a.slug = 'middle-keys')
    OR (m.name LIKE '%Faro Blanco%' AND a.slug = 'middle-keys')
    OR (m.name LIKE '%Postcard Inn%' AND a.slug = 'upper-keys')
    OR (m.name LIKE '%Marina Del Mar%' AND a.slug = 'upper-keys')
ON CONFLICT (marina_id, area_id) DO NOTHING;


-- 13. Seed Initial Durations
INSERT INTO public.durations (id, name, hours, label, interval_val, active, display_order)
VALUES
    ('44444444-4444-4444-4444-444444444401', 'Half Day', 4.0, 'Half Day (≤ 4 hrs)', '04:00:00'::interval, true, 1),
    ('44444444-4444-4444-4444-444444444402', 'Full Day', 8.0, 'Full Day (> 4 hrs)', '08:00:00'::interval, true, 2),
    ('44444444-4444-4444-4444-444444444403', 'Sunset / Express', 2.0, 'Express / Sunset (2 hrs)', '02:00:00'::interval, true, 3)
ON CONFLICT (id) DO NOTHING;


-- 14. Backfill existing listing_templates with area_id and duration_id
UPDATE public.listing_templates lt
SET area_id = a.id
FROM public.areas a
WHERE lt.area_id IS NULL
  AND lt.location = a.name;

UPDATE public.listing_templates lt
SET duration_id = d.id
FROM public.durations d
WHERE lt.duration_id IS NULL
  AND lt.duration = d.interval_val;

-- Fallback for any listing_templates whose duration didn't match exactly
UPDATE public.listing_templates lt
SET duration_id = CASE
    WHEN EXTRACT(EPOCH FROM lt.duration) <= 14400 THEN '44444444-4444-4444-4444-444444444401'::uuid
    ELSE '44444444-4444-4444-4444-444444444402'::uuid
END
WHERE lt.duration_id IS NULL;


-- 15. Backfill existing captains with home_marina_id and durations
UPDATE public.captains
SET durations = ARRAY['Half Day', 'Full Day', 'Sunset / Express']
WHERE durations IS NULL OR durations = '{}';

UPDATE public.captains
SET home_marina_id = CASE
    WHEN 'Lower Keys (Key West, Big Pine Key)' = ANY(locations) THEN '11111111-1111-1111-1111-111111111101'::uuid
    WHEN 'Middle Keys (Marathon, Pigeon Key)' = ANY(locations) THEN '22222222-2222-2222-2222-222222222201'::uuid
    ELSE '33333333-3333-3333-3333-333333333301'::uuid
END
WHERE home_marina_id IS NULL;


-- 16. Stored function to auto-generate missing listing templates for active permutations
CREATE OR REPLACE FUNCTION public.generate_missing_listing_templates()
RETURNS integer AS $$
DECLARE
    rec RECORD;
    created_count integer := 0;
    source_tpl RECORD;
BEGIN
    FOR rec IN
        SELECT
            a.id AS area_id,
            a.name AS area_name,
            tt.name AS trip_type,
            d.id AS duration_id,
            d.name AS duration_name,
            d.interval_val AS duration_interval
        FROM public.areas a
        CROSS JOIN public.trip_types tt
        CROSS JOIN public.durations d
        WHERE a.active = true
          AND tt.active = true
          AND d.active = true
          AND NOT EXISTS (
              SELECT 1 FROM public.listing_templates lt
              WHERE lt.area_id = a.id
                AND lt.trip_type = tt.name
                AND lt.duration_id = d.id
          )
    LOOP
        -- Look for an existing template for this trip_type to borrow reasonable pricing & descriptions
        SELECT * INTO source_tpl
        FROM public.listing_templates
        WHERE trip_type = rec.trip_type
        ORDER BY created_at ASC
        LIMIT 1;

        INSERT INTO public.listing_templates (
            trip_type,
            location,
            duration,
            low_price,
            high_price,
            max_passengers,
            description,
            whats_included,
            what_to_bring,
            meeting_area,
            active,
            area_id,
            duration_id
        ) VALUES (
            rec.trip_type,
            rec.area_name,
            rec.duration_interval,
            COALESCE(source_tpl.low_price, 750.00),
            COALESCE(source_tpl.high_price, 950.00),
            COALESCE(source_tpl.max_passengers, 6),
            COALESCE(source_tpl.description, 'Private split charter experience for ' || rec.trip_type || ' in ' || rec.area_name || '.'),
            COALESCE(source_tpl.whats_included, ARRAY['Licensed Captain & Fuel', 'All Safety Equipment', 'Ice & Bottled Water']),
            COALESCE(source_tpl.what_to_bring, ARRAY['Sunscreen & Sunglasses', 'Hat & Light Jacket', 'Personal Snacks & Drinks']),
            'Marina slip details provided upon captain confirmation',
            true,
            rec.area_id,
            rec.duration_id
        );

        created_count := created_count + 1;
    END LOOP;

    RETURN created_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
