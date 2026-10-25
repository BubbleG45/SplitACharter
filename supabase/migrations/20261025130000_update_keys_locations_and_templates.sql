-- Migration: 12 Florida Keys Locations, 6-Hour Duration, Listing Templates & Captain Updates
-- Applied: 2026-10-25

-- 1. Ensure 6 Hours duration exists and update duration display orders
INSERT INTO public.durations (id, name, hours, label, interval_val, active, display_order)
VALUES ('44444444-4444-4444-4444-444444444404', '6 Hours', 6.0, '6 Hours', '06:00:00'::interval, true, 2)
ON CONFLICT (name) DO UPDATE SET
    hours = EXCLUDED.hours,
    label = EXCLUDED.label,
    interval_val = EXCLUDED.interval_val,
    active = true,
    display_order = 2;

UPDATE public.durations SET display_order = 1 WHERE name = 'Half Day';
UPDATE public.durations SET display_order = 2 WHERE name = '6 Hours';
UPDATE public.durations SET display_order = 3 WHERE name = 'Full Day';
UPDATE public.durations SET display_order = 4 WHERE name = 'Sunset / Express';


-- 2. Deactivate legacy 3 regional areas
UPDATE public.areas
SET active = false
WHERE slug IN ('lower-keys', 'middle-keys', 'upper-keys');


-- 3. Upsert the 12 Florida Keys areas
INSERT INTO public.areas (name, slug, center_lat, center_lng, active, display_order)
VALUES
    ('Key Largo', 'key-largo', 25.0865, -80.4473, true, 1),
    ('Tavernier', 'tavernier', 25.0129, -80.5181, true, 2),
    ('Islamorada', 'islamorada', 24.9242, -80.6278, true, 3),
    ('Long Key', 'long-key', 24.8142, -80.8228, true, 4),
    ('Duck Key', 'duck-key', 24.7735, -80.9128, true, 5),
    ('Marathon', 'marathon', 24.7136, -81.0904, true, 6),
    ('Big Pine Key', 'big-pine-key', 24.6701, -81.3537, true, 7),
    ('Summerland Key', 'summerland-key', 24.6546, -81.4428, true, 8),
    ('Cudjoe Key', 'cudjoe-key', 24.6643, -81.4883, true, 9),
    ('Sugarloaf Key', 'sugarloaf-key', 24.6565, -81.5278, true, 10),
    ('Stock Island', 'stock-island', 24.5701, -81.7412, true, 11),
    ('Key West', 'key-west', 24.5551, -81.7800, true, 12)
ON CONFLICT (name) DO UPDATE SET
    slug = EXCLUDED.slug,
    center_lat = EXCLUDED.center_lat,
    center_lng = EXCLUDED.center_lng,
    active = true,
    display_order = EXCLUDED.display_order;


-- 4. Update generate_missing_listing_templates function to respect capacity rules
CREATE OR REPLACE FUNCTION public.generate_missing_listing_templates()
RETURNS integer AS $$
DECLARE
    rec RECORD;
    created_count integer := 0;
    source_tpl RECORD;
    pax integer;
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
          -- Sunset cruise only has 2 hours
          AND (tt.name != 'Sunset Cruise' OR d.interval_val = '02:00:00'::interval)
          AND NOT EXISTS (
              SELECT 1 FROM public.listing_templates lt
              WHERE lt.area_id = a.id
                AND lt.trip_type = tt.name
                AND lt.duration_id = d.id
                AND lt.active = true
          )
    LOOP
        SELECT * INTO source_tpl
        FROM public.listing_templates
        WHERE trip_type = rec.trip_type
          AND active = true
        ORDER BY created_at ASC
        LIMIT 1;

        pax := CASE
            WHEN rec.trip_type = 'Backcountry' THEN 4
            WHEN rec.trip_type = 'Fly Fishing' THEN 2
            ELSE 6
        END;

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
            pax,
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
