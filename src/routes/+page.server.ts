const defaultSeedReviews = [
	{ name: 'Dave & Sarah M.', location: 'Miami, FL', trip: 'Islamorada Reef Snorkeling', stars: 5, avatar: 'DS', quote: 'Booking a private charter used to be out of our budget for just two people. Splitting it with another couple saved us 50% and we had an incredible day swimming with sea turtles!', display_order: 1, active: true },
	{ name: 'Capt. Marcus Vance', location: 'Key West, FL', trip: 'Deep Sea Mahi Mahi Charter', stars: 5, avatar: 'MV', quote: 'As a local captain, SplitACharter fills my schedule without the headache of managing partial bookings. The passengers matched are always great people.', display_order: 2, active: true },
	{ name: 'Elena R.', location: 'Tampa, FL', trip: 'Sunset Catamaran Cruise', stars: 5, avatar: 'ER', quote: 'We wanted a quiet sunset trip without 40 strangers on a party boat. Matched with another couple celebrating an anniversary — match made in heaven!', display_order: 3, active: true },
	{ name: 'Greg & Jason T.', location: 'Orlando, FL', trip: 'Key Largo Wreck Diving', stars: 5, avatar: 'GJ', quote: 'Got paired with two awesome divers for the Spiegel Grove wreck. Easy booking, quick SMS reconfirmations, and unbelievable value.', display_order: 4, active: true },
	{ name: 'Hannah & Chris L.', location: 'Atlanta, GA', trip: 'Marathon Offshore Fishing', stars: 5, avatar: 'HC', quote: 'Saved over $600 splitting a 6-hour offshore charter. Captain Tony put us right on the tuna. Will definitely use SplitACharter every Keys trip!', display_order: 5, active: true },
	{ name: 'Brian K.', location: 'Chicago, IL', trip: 'Sandbar & Eco Tour', stars: 5, avatar: 'BK', quote: 'Super smooth experience from payment to texting with the captain. No hidden fees or surprises. Best way to get on the water in South Florida.', display_order: 6, active: true },
	{ name: 'Jessica P.', location: 'Austin, TX', trip: 'Tavernier Spearfishing', stars: 5, avatar: 'JP', quote: "I was worried about splitting with strangers, but SplitACharter's group cap makes it feel like your own private crew. Had a total blast!", display_order: 7, active: true },
	{ name: 'Michael & Sam B.', location: 'Denver, CO', trip: 'Key West Offshore Charter', stars: 5, avatar: 'MS', quote: 'We landed 4 blackfin tuna and split the boat 50/50. You get full VIP treatment at half the price of a private charter.', display_order: 8, active: true },
	{ name: 'Rachel W.', location: 'Nashville, TN', trip: 'Islamorada Sunset Cruise', stars: 5, avatar: 'RW', quote: 'The automated text notifications kept us updated every step of the way. Zero friction, total transparency, and memories for a lifetime.', display_order: 9, active: true },
	{ name: 'Derek & Tom N.', location: 'Fort Lauderdale, FL', trip: 'Bahia Honda Reef Dive', stars: 5, avatar: 'DT', quote: 'Found a spot on short notice. Reconfirmed right from my phone and met incredible dive buddies. Highly recommend SplitACharter!', display_order: 10, active: true }
];

export const load = async ({ locals }: any) => {
	const supabase = locals.supabase;
	const { data: reviews, error } = await supabase
		.from('landing_reviews')
		.select('*')
		.eq('active', true)
		.order('display_order', { ascending: true })
		.order('created_at', { ascending: true });

	if (error || !reviews || reviews.length === 0) {
		console.warn('landing_reviews empty or errored, returning default examples:', error?.message);
		return { reviews: defaultSeedReviews };
	}

	return {
		reviews: reviews || []
	};
};
