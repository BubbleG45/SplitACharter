import { error, fail } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';
import type { PageServerLoad, Actions } from './$types';
import rawChangelog from '../../../../CHANGELOG.md?raw';

const defaultSeedReviews = [
	{
		name: 'Dave & Sarah M.',
		location: 'Miami, FL',
		trip: 'Islamorada Reef Snorkeling',
		stars: 5,
		avatar: 'DS',
		quote: 'Booking a private charter used to be out of our budget for just two people. Splitting it with another couple saved us 50% and we had an incredible day swimming with sea turtles!',
		display_order: 1,
		active: true
	},
	{
		name: 'Capt. Marcus Vance',
		location: 'Key West, FL',
		trip: 'Deep Sea Mahi Mahi Charter',
		stars: 5,
		avatar: 'MV',
		quote: 'As a local captain, SplitACharter fills my schedule without the headache of managing partial bookings. The passengers matched are always great people.',
		display_order: 2,
		active: true
	},
	{
		name: 'Elena R.',
		location: 'Tampa, FL',
		trip: 'Sunset Catamaran Cruise',
		stars: 5,
		avatar: 'ER',
		quote: 'We wanted a quiet sunset trip without 40 strangers on a party boat. Matched with another couple celebrating an anniversary — match made in heaven!',
		display_order: 3,
		active: true
	},
	{
		name: 'Greg & Jason T.',
		location: 'Orlando, FL',
		trip: 'Key Largo Wreck Diving',
		stars: 5,
		avatar: 'GJ',
		quote: 'Got paired with two awesome divers for the Spiegel Grove wreck. Easy booking, quick SMS reconfirmations, and unbelievable value.',
		display_order: 4,
		active: true
	},
	{
		name: 'Hannah & Chris L.',
		location: 'Atlanta, GA',
		trip: 'Marathon Offshore Fishing',
		stars: 5,
		avatar: 'HC',
		quote: 'Saved over $600 splitting a 6-hour offshore charter. Captain Tony put us right on the tuna. Will definitely use SplitACharter every Keys trip!',
		display_order: 5,
		active: true
	},
	{
		name: 'Brian K.',
		location: 'Chicago, IL',
		trip: 'Sandbar & Eco Tour',
		stars: 5,
		avatar: 'BK',
		quote: 'Super smooth experience from payment to texting with the captain. No hidden fees or surprises. Best way to get on the water in South Florida.',
		display_order: 6,
		active: true
	},
	{
		name: 'Jessica P.',
		location: 'Austin, TX',
		trip: 'Tavernier Spearfishing',
		stars: 5,
		avatar: 'JP',
		quote: "I was worried about splitting with strangers, but SplitACharter's group cap makes it feel like your own private crew. Had a total blast!",
		display_order: 7,
		active: true
	},
	{
		name: 'Michael & Sam B.',
		location: 'Denver, CO',
		trip: 'Key West Offshore Charter',
		stars: 5,
		avatar: 'MS',
		quote: 'We landed 4 blackfin tuna and split the boat 50/50. You get full VIP treatment at half the price of a private charter.',
		display_order: 8,
		active: true
	},
	{
		name: 'Rachel W.',
		location: 'Nashville, TN',
		trip: 'Islamorada Sunset Cruise',
		stars: 5,
		avatar: 'RW',
		quote: 'The automated text notifications kept us updated every step of the way. Zero friction, total transparency, and memories for a lifetime.',
		display_order: 9,
		active: true
	},
	{
		name: 'Derek & Tom N.',
		location: 'Fort Lauderdale, FL',
		trip: 'Bahia Honda Reef Dive',
		stars: 5,
		avatar: 'DT',
		quote: 'Found a spot on short notice. Reconfirmed right from my phone and met incredible dive buddies. Highly recommend SplitACharter!',
		display_order: 10,
		active: true
	}
];

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const [settingsRes, tripTypesRes, reviewsRes] = await Promise.all([
		supabase
			.from('admin_notification_settings')
			.select('*')
			.order('trigger_name', { ascending: true }),
		supabase
			.from('trip_types')
			.select('*')
			.order('name', { ascending: true }),
		supabase
			.from('landing_reviews')
			.select('*')
			.order('display_order', { ascending: true })
			.order('created_at', { ascending: true })
	]);

	if (settingsRes.error) {
		console.error('Error loading notification settings:', settingsRes.error);
		throw error(500, 'Failed to load settings');
	}

	if (tripTypesRes.error) {
		console.error('Error loading trip types:', tripTypesRes.error);
		throw error(500, 'Failed to load trip types');
	}

	let reviews = reviewsRes.data || [];

	// Auto-seed default reviews into database if table is empty or error occurs
	if (!reviewsRes.error && reviews.length === 0) {
		console.log('landing_reviews table is empty, auto-seeding example reviews...');
		const { data: insertedData, error: seedErr } = await supabase
			.from('landing_reviews')
			.insert(defaultSeedReviews)
			.select('*');

		if (!seedErr && insertedData) {
			reviews = insertedData;
		} else if (seedErr) {
			console.error('Error auto-seeding landing reviews:', seedErr);
		}
	} else if (reviewsRes.error) {
		console.warn('Could not query landing_reviews table, using static fallbacks:', reviewsRes.error.message);
		reviews = defaultSeedReviews.map((r, i) => ({ id: `default-${i+1}`, ...r }));
	}

	let changelogRaw = rawChangelog || '';
	if (!changelogRaw) {
		try {
			const changelogPath = path.resolve(process.cwd(), 'CHANGELOG.md');
			if (fs.existsSync(changelogPath)) {
				changelogRaw = fs.readFileSync(changelogPath, 'utf-8');
			}
		} catch (err) {
			console.warn('Could not read CHANGELOG.md file:', err);
		}
	}

	return {
		settings: settingsRes.data || [],
		tripTypes: tripTypesRes.data || [],
		reviews,
		changelogRaw
	};
};

export const actions: Actions = {
	saveTemplate: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const emailEnabled = formData.get('email_enabled') === 'true';
		const smsEnabled = formData.get('sms_enabled') === 'true';
		const emailTemplate = formData.get('email_template') as string;
		const smsTemplate = formData.get('sms_template') as string;

		if (!id) {
			return fail(400, { message: 'Missing setting ID' });
		}

		const { error: updateErr } = await supabase
			.from('admin_notification_settings')
			.update({
				email_enabled: emailEnabled,
				sms_enabled: smsEnabled,
				email_template: emailTemplate || null,
				sms_template: smsTemplate || null
			})
			.eq('id', id);

		if (updateErr) {
			console.error('Error updating notification setting:', updateErr);
			return fail(500, { message: updateErr.message || 'Failed to update template' });
		}

		return { success: true };
	},
	addTripType: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const name = (formData.get('name') as string)?.trim();

		if (!name) {
			return fail(400, { tripTypeMessage: 'Trip type name is required' });
		}

		const { error: insertErr } = await supabase
			.from('trip_types')
			.insert({ name });

		if (insertErr) {
			console.error('Error adding trip type:', insertErr);
			if (insertErr.code === '23505') {
				return fail(400, { tripTypeMessage: 'This trip type already exists' });
			}
			return fail(500, { tripTypeMessage: insertErr.message || 'Failed to add trip type' });
		}

		return { success: true };
	},
	deleteTripType: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const name = formData.get('name') as string;

		if (!name) {
			return fail(400, { tripTypeMessage: 'Trip type name is required' });
		}

		const { error: deleteErr } = await supabase
			.from('trip_types')
			.delete()
			.eq('name', name);

		if (deleteErr) {
			console.error('Error deleting trip type:', deleteErr);
			if (deleteErr.code === '23503') {
				return fail(400, { tripTypeMessage: 'This trip type is currently in use by a listing template and cannot be deleted.' });
			}
			return fail(500, { tripTypeMessage: deleteErr.message || 'Failed to delete trip type' });
		}

		return { success: true };
	},
	seedReviews: async ({ locals: { supabase } }) => {
		const { data, error: seedErr } = await supabase
			.from('landing_reviews')
			.insert(defaultSeedReviews)
			.select('*');

		if (seedErr) {
			console.error('Error seeding default reviews:', seedErr);
			return fail(500, { reviewMessage: seedErr.message || 'Failed to seed example reviews into database' });
		}

		return { success: true };
	},
	addReview: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const name = (formData.get('name') as string)?.trim();
		const location = (formData.get('location') as string)?.trim();
		const trip = (formData.get('trip') as string)?.trim();
		const stars = parseInt(formData.get('stars') as string || '5', 10);
		const avatar = (formData.get('avatar') as string)?.trim() || name?.substring(0, 2).toUpperCase();
		const quote = (formData.get('quote') as string)?.trim();
		const displayOrder = parseInt(formData.get('display_order') as string || '0', 10);

		if (!name || !location || !trip || !quote) {
			return fail(400, { reviewMessage: 'Name, location, trip type, and quote are required' });
		}

		const { error: insertErr } = await supabase
			.from('landing_reviews')
			.insert({
				name,
				location,
				trip,
				stars,
				avatar,
				quote,
				display_order: displayOrder,
				active: true
			});

		if (insertErr) {
			console.error('Error adding review:', insertErr);
			return fail(500, { reviewMessage: insertErr.message || 'Failed to add review' });
		}

		return { success: true };
	},
	updateReview: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const name = (formData.get('name') as string)?.trim();
		const location = (formData.get('location') as string)?.trim();
		const trip = (formData.get('trip') as string)?.trim();
		const stars = parseInt(formData.get('stars') as string || '5', 10);
		const avatar = (formData.get('avatar') as string)?.trim();
		const quote = (formData.get('quote') as string)?.trim();
		const displayOrder = parseInt(formData.get('display_order') as string || '0', 10);
		const active = formData.get('active') === 'true';

		if (!id || !name || !location || !trip || !quote) {
			return fail(400, { reviewMessage: 'All fields are required to update a review' });
		}

		const { error: updateErr } = await supabase
			.from('landing_reviews')
			.update({
				name,
				location,
				trip,
				stars,
				avatar,
				quote,
				display_order: displayOrder,
				active
			})
			.eq('id', id);

		if (updateErr) {
			console.error('Error updating review:', updateErr);
			return fail(500, { reviewMessage: updateErr.message || 'Failed to update review' });
		}

		return { success: true };
	},
	toggleReviewActive: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const active = formData.get('active') === 'true';

		if (!id) {
			return fail(400, { reviewMessage: 'Review ID is required' });
		}

		const { error: updateErr } = await supabase
			.from('landing_reviews')
			.update({ active })
			.eq('id', id);

		if (updateErr) {
			console.error('Error toggling review active status:', updateErr);
			return fail(500, { reviewMessage: updateErr.message || 'Failed to toggle status' });
		}

		return { success: true };
	},
	deleteReview: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) {
			return fail(400, { reviewMessage: 'Review ID is required' });
		}

		const { error: deleteErr } = await supabase
			.from('landing_reviews')
			.delete()
			.eq('id', id);

		if (deleteErr) {
			console.error('Error deleting review:', deleteErr);
			return fail(500, { reviewMessage: deleteErr.message || 'Failed to delete review' });
		}

		return { success: true };
	}
};
