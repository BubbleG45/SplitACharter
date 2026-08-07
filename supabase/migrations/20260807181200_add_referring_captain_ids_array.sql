-- Add referring_captain_ids array to trip_instances table to support multiple referring captains per trip
ALTER TABLE public.trip_instances
ADD COLUMN IF NOT EXISTS referring_captain_ids uuid[] NOT NULL DEFAULT '{}';
