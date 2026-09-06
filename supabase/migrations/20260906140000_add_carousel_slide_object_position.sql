-- Add object_position column to landing_carousel_slides for focal point / alignment control
ALTER TABLE public.landing_carousel_slides
ADD COLUMN IF NOT EXISTS object_position text NOT NULL DEFAULT 'center';
