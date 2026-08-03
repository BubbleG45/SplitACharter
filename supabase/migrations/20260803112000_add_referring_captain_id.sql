-- Add referring_captain_id to trip_instances table
ALTER TABLE public.trip_instances
ADD COLUMN IF NOT EXISTS referring_captain_id uuid REFERENCES public.captains(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_trip_instances_referring_captain ON public.trip_instances(referring_captain_id);
