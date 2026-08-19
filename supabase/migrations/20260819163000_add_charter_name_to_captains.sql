-- Migration: Add charter_name to captains table
-- Allows captains to register their boat / charter business name and use it for custom referral promo codes.

ALTER TABLE public.captains
ADD COLUMN IF NOT EXISTS charter_name text;

COMMENT ON COLUMN public.captains.charter_name IS 'Boat or charter business name used to derive vanity referral promo codes';
