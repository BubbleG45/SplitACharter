-- Create landing_reviews table for storing guest and captain reviews displayed on the landing page
CREATE TABLE IF NOT EXISTS public.landing_reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    location text NOT NULL,
    trip text NOT NULL,
    stars integer NOT NULL DEFAULT 5 CHECK (stars >= 1 AND stars <= 5),
    avatar text NOT NULL,
    quote text NOT NULL,
    display_order integer NOT NULL DEFAULT 0,
    active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Reusable updated_at trigger
CREATE TRIGGER update_landing_reviews_updated_at
    BEFORE UPDATE ON public.landing_reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.landing_reviews ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active reviews
CREATE POLICY "Allow public read access for reviews"
    ON public.landing_reviews
    FOR SELECT
    USING (true);

-- Allow full access for admin users
CREATE POLICY "Allow full access for admins on landing_reviews"
    ON public.landing_reviews
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE id = auth.uid()
        )
    );

-- Seed initial 10 reviews
INSERT INTO public.landing_reviews (name, location, trip, stars, avatar, quote, display_order, active)
VALUES
    ('Dave & Sarah M.', 'Miami, FL', 'Islamorada Reef Snorkeling', 5, 'DS', 'Booking a private charter used to be out of our budget for just two people. Splitting it with another couple saved us 50% and we had an incredible day swimming with sea turtles!', 1, true),
    ('Capt. Marcus Vance', 'Key West, FL', 'Deep Sea Mahi Mahi Charter', 5, 'MV', 'As a local captain, SplitACharter fills my schedule without the headache of managing partial bookings. The passengers matched are always great people.', 2, true),
    ('Elena R.', 'Tampa, FL', 'Sunset Catamaran Cruise', 5, 'ER', 'We wanted a quiet sunset trip without 40 strangers on a party boat. Matched with another couple celebrating an anniversary — match made in heaven!', 3, true),
    ('Greg & Jason T.', 'Orlando, FL', 'Key Largo Wreck Diving', 5, 'GJ', 'Got paired with two awesome divers for the Spiegel Grove wreck. Easy booking, quick SMS reconfirmations, and unbelievable value.', 4, true),
    ('Hannah & Chris L.', 'Atlanta, GA', 'Marathon Offshore Fishing', 5, 'HC', 'Saved over $600 splitting a 6-hour offshore charter. Captain Tony put us right on the tuna. Will definitely use SplitACharter every Keys trip!', 5, true),
    ('Brian K.', 'Chicago, IL', 'Sandbar & Eco Tour', 5, 'BK', 'Super smooth experience from payment to texting with the captain. No hidden fees or surprises. Best way to get on the water in South Florida.', 6, true),
    ('Jessica P.', 'Austin, TX', 'Tavernier Spearfishing', 5, 'JP', 'I was worried about splitting with strangers, but SplitACharter''s group cap makes it feel like your own private crew. Had a total blast!', 7, true),
    ('Michael & Sam B.', 'Denver, CO', 'Key West Offshore Charter', 5, 'MS', 'We landed 4 blackfin tuna and split the boat 50/50. You get full VIP treatment at half the price of a private charter.', 8, true),
    ('Rachel W.', 'Nashville, TN', 'Islamorada Sunset Cruise', 5, 'RW', 'The automated text notifications kept us updated every step of the way. Zero friction, total transparency, and memories for a lifetime.', 9, true),
    ('Derek & Tom N.', 'Fort Lauderdale, FL', 'Bahia Honda Reef Dive', 5, 'DT', 'Found a spot on short notice. Reconfirmed right from my phone and met incredible dive buddies. Highly recommend SplitACharter!', 10, true)
ON CONFLICT DO NOTHING;
