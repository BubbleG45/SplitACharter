-- Create landing_carousel_slides table for storing photo carousel slides on the home page
CREATE TABLE IF NOT EXISTS public.landing_carousel_slides (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    caption text NOT NULL,
    image_url text NOT NULL,
    link_url text,
    link_text text,
    display_order integer NOT NULL DEFAULT 0,
    active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Reusable updated_at trigger
CREATE TRIGGER update_landing_carousel_slides_updated_at
    BEFORE UPDATE ON public.landing_carousel_slides
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.landing_carousel_slides ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active slides
CREATE POLICY "Allow public read access for active carousel slides"
    ON public.landing_carousel_slides
    FOR SELECT
    USING (active = true);

-- Allow full access for admin users
CREATE POLICY "Allow full access for admins on landing_carousel_slides"
    ON public.landing_carousel_slides
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE id = auth.uid()
        )
    );

-- Create carousel-images storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('carousel-images', 'carousel-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for carousel-images bucket
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Public Read Access for Carousel Images'
    ) THEN
        CREATE POLICY "Public Read Access for Carousel Images"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'carousel-images');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Admin Upload Carousel Images'
    ) THEN
        CREATE POLICY "Admin Upload Carousel Images"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (
            bucket_id = 'carousel-images' AND
            EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Admin Delete Carousel Images'
    ) THEN
        CREATE POLICY "Admin Delete Carousel Images"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (
            bucket_id = 'carousel-images' AND
            EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
        );
    END IF;
END $$;

-- Seed starter slides
INSERT INTO public.landing_carousel_slides (title, caption, image_url, link_url, link_text, display_order, active)
VALUES
    (
        'Sunset Catamaran Sailing',
        'Watch the legendary Key West sunset from the water without paying for an entire private yacht alone.',
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1600&q=80',
        '/browse?type=Sunset%20Cruise',
        'Explore Sunset Cruises',
        1,
        true
    ),
    (
        'Offshore Sportfishing',
        'Target mahi-mahi, sailfish, and blackfin tuna in the Gulf Stream. Split the boat 50/50 with another crew.',
        'https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?auto=format&fit=crop&w=1600&q=80',
        '/browse?type=Offshore%20Fishing',
        'Find Fishing Splits',
        2,
        true
    ),
    (
        'Sandbar & Eco Adventures',
        'Anchor in waist-deep turquoise shallows at Islamorada or Key West sandbars with friends and family.',
        'https://images.unsplash.com/photo-1510414842594-a61752afb394?auto=format&fit=crop&w=1600&q=80',
        '/browse?type=Sandbar%20Charter',
        'Browse Sandbar Trips',
        3,
        true
    ),
    (
        'Coral Reef & Wreck Diving',
        'Explore world-renowned living coral reefs and historic shipwrecks with certified local captains.',
        'https://images.unsplash.com/photo-1544551763-92ab472cad5d?auto=format&fit=crop&w=1600&q=80',
        '/browse?type=Reef%20Snorkeling',
        'View Snorkel & Dive Trips',
        4,
        true
    )
ON CONFLICT DO NOTHING;
