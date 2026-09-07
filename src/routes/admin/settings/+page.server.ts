import { error, fail } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import type { PageServerLoad, Actions } from './$types';
import rawChangelog from '../../../../CHANGELOG.md?raw';
import { DEFAULT_NOTIFICATION_TEMPLATES, getDefaultTemplate } from '$lib/notificationTemplates';

function getAdminClient() {
	return createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

const defaultSeedSlides = [
	{
		title: 'Sunset Catamaran Sailing',
		caption: 'Watch the legendary Key West sunset from the water without paying for an entire private yacht alone.',
		image_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1600&q=80',
		link_url: '/browse?type=Sunset%20Cruise',
		link_text: 'Explore Sunset Cruises',
		display_order: 1,
		active: true,
		object_position: 'center'
	},
	{
		title: 'Offshore Sportfishing',
		caption: 'Target mahi-mahi, sailfish, and blackfin tuna in the Gulf Stream. Split the boat 50/50 with another crew.',
		image_url: 'https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?auto=format&fit=crop&w=1600&q=80',
		link_url: '/browse?type=Offshore%20Fishing',
		link_text: 'Find Fishing Splits',
		display_order: 2,
		active: true,
		object_position: 'center'
	},
	{
		title: 'Sandbar & Eco Adventures',
		caption: 'Anchor in waist-deep turquoise shallows at Islamorada or Key West sandbars with friends and family.',
		image_url: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?auto=format&fit=crop&w=1600&q=80',
		link_url: '/browse?type=Sandbar%20Charter',
		link_text: 'Browse Sandbar Trips',
		display_order: 3,
		active: true,
		object_position: 'center'
	},
	{
		title: 'Coral Reef & Wreck Diving',
		caption: 'Explore world-renowned living coral reefs and historic shipwrecks with certified local captains.',
		image_url: 'https://images.unsplash.com/photo-1544551763-92ab472cad5d?auto=format&fit=crop&w=1600&q=80',
		link_url: '/browse?type=Reef%20Snorkeling',
		link_text: 'View Snorkel & Dive Trips',
		display_order: 4,
		active: true,
		object_position: 'center'
	}
];

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

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	const { user } = await safeGetSession();
	const supabaseAdmin = getAdminClient();

	const [settingsRes, tripTypesRes, reviewsRes, slidesRes, adminEmailsRes, customersRes, authUsersRes] = await Promise.all([
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
			.order('created_at', { ascending: true }),
		supabase
			.from('landing_carousel_slides')
			.select('*')
			.order('display_order', { ascending: true })
			.order('created_at', { ascending: true }),
		supabaseAdmin
			.from('admin_emails')
			.select('*')
			.order('created_at', { ascending: true }),
		supabaseAdmin
			.from('customers')
			.select('id, email, name, phone, created_at'),
		supabaseAdmin.auth.admin.listUsers().catch((err) => {
			console.warn('Could not list auth users in settings load:', err);
			return { data: { users: [] }, error: err };
		})
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

	let carouselSlides = slidesRes.data || [];

	// Auto-seed default slides into database if table is empty or error occurs
	if (!slidesRes.error && carouselSlides.length === 0) {
		console.log('landing_carousel_slides table is empty, auto-seeding starter slides...');
		const { data: insertedSlides, error: seedSlideErr } = await supabase
			.from('landing_carousel_slides')
			.insert(defaultSeedSlides)
			.select('*');

		if (!seedSlideErr && insertedSlides) {
			carouselSlides = insertedSlides;
		} else if (seedSlideErr) {
			console.error('Error auto-seeding carousel slides:', seedSlideErr);
		}
	} else if (slidesRes.error) {
		console.warn('Could not query landing_carousel_slides table, using static fallbacks:', slidesRes.error.message);
		carouselSlides = defaultSeedSlides.map((s, i) => ({ id: `default-slide-${i+1}`, ...s }));
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

	const adminEmailsList = adminEmailsRes.data || [];
	const customersList = customersRes.data || [];
	const authUsersList = authUsersRes?.data?.users || [];

	const adminUsers = adminEmailsList.map((ae) => {
		const emailLower = (ae.email || '').toLowerCase().trim();
		const matchedCustomer = customersList.find((c) => (c.email || '').toLowerCase().trim() === emailLower);
		const matchedAuthUser = authUsersList.find((u) => (u.email || '').toLowerCase().trim() === emailLower);
		const isCurrentUser = !!(
			(user?.email && user.email.toLowerCase().trim() === emailLower) ||
			(user?.id && (user.id === matchedCustomer?.id || user.id === matchedAuthUser?.id))
		);

		return {
			email: ae.email,
			created_at: ae.created_at,
			name: matchedCustomer?.name || matchedAuthUser?.user_metadata?.name || null,
			phone: matchedCustomer?.phone || matchedAuthUser?.phone || null,
			status: matchedAuthUser || matchedCustomer ? 'active' : 'pending',
			is_current_user: isCurrentUser,
			user_id: matchedCustomer?.id || matchedAuthUser?.id || null
		};
	});

	return {
		settings: settingsRes.data || [],
		tripTypes: tripTypesRes.data || [],
		reviews,
		carouselSlides,
		changelogRaw,
		adminUsers,
		currentUserEmail: user?.email || null
	};
};

export const actions: Actions = {
	saveTemplate: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const emailEnabled = formData.get('email_enabled') === 'true';
		const smsEnabled = formData.get('sms_enabled') === 'true';

		if (!id) {
			return fail(400, { message: 'Missing setting ID' });
		}

		const updatePayload: Record<string, any> = {
			email_enabled: emailEnabled,
			sms_enabled: smsEnabled
		};

		if (formData.has('email_template')) {
			const rawEmail = (formData.get('email_template') as string)?.trim();
			updatePayload.email_template = rawEmail || null;
		}

		if (formData.has('sms_template')) {
			const rawSms = (formData.get('sms_template') as string)?.trim();
			updatePayload.sms_template = rawSms || null;
		}

		const { error: updateErr } = await supabase
			.from('admin_notification_settings')
			.update(updatePayload)
			.eq('id', id);

		if (updateErr) {
			console.error('Error updating notification setting:', updateErr);
			return fail(500, { message: updateErr.message || 'Failed to update template' });
		}

		return { success: true };
	},
	resetTemplateToDefault: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const triggerName = formData.get('trigger_name') as string;
		const channel = formData.get('channel') as 'email' | 'sms' | 'all';

		if (!id || !triggerName) {
			return fail(400, { message: 'Missing setting ID or trigger name' });
		}

		const defaultDef = getDefaultTemplate(triggerName);
		if (!defaultDef) {
			return fail(404, { message: `No default template found for trigger: ${triggerName}` });
		}

		const updatePayload: Record<string, any> = {};
		if (channel === 'email' || channel === 'all' || !channel) {
			updatePayload.email_template = defaultDef.email_template;
		}
		if (channel === 'sms' || channel === 'all' || !channel) {
			updatePayload.sms_template = defaultDef.sms_template;
		}

		const { error: updateErr } = await supabase
			.from('admin_notification_settings')
			.update(updatePayload)
			.eq('id', id);

		if (updateErr) {
			console.error('Error resetting notification template to default:', updateErr);
			return fail(500, { message: updateErr.message || 'Failed to reset template' });
		}

		return { success: true, resetId: id };
	},
	populateAllDefaultTemplates: async ({ locals: { supabase } }) => {
		const { data: currentSettings, error: fetchErr } = await supabase
			.from('admin_notification_settings')
			.select('*');

		if (fetchErr || !currentSettings) {
			console.error('Error fetching notification settings:', fetchErr);
			return fail(500, { message: fetchErr?.message || 'Failed to fetch existing settings' });
		}

		let populatedCount = 0;

		for (const setting of currentSettings) {
			const defaultDef = getDefaultTemplate(setting.trigger_name);
			if (!defaultDef) continue;

			const updatePayload: Record<string, any> = {};
			if (!setting.email_template && defaultDef.email_template) {
				updatePayload.email_template = defaultDef.email_template;
			}
			if (!setting.sms_template && defaultDef.sms_template) {
				updatePayload.sms_template = defaultDef.sms_template;
			}

			if (Object.keys(updatePayload).length > 0) {
				await supabase
					.from('admin_notification_settings')
					.update(updatePayload)
					.eq('id', setting.id);
				populatedCount++;
			}
		}

		const existingTriggerNames = new Set(currentSettings.map((s) => s.trigger_name));
		const missingInserts = Object.values(DEFAULT_NOTIFICATION_TEMPLATES)
			.filter((def) => !existingTriggerNames.has(def.trigger_name))
			.map((def) => ({
				trigger_name: def.trigger_name,
				email_enabled: true,
				sms_enabled: true,
				email_template: def.email_template,
				sms_template: def.sms_template
			}));

		if (missingInserts.length > 0) {
			await supabase.from('admin_notification_settings').insert(missingInserts);
			populatedCount += missingInserts.length;
		}

		return { success: true, populatedCount };
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
	},
	addCarouselSlide: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const title = (formData.get('title') as string)?.trim();
		const caption = (formData.get('caption') as string)?.trim();
		const linkUrl = (formData.get('link_url') as string)?.trim() || null;
		const linkText = (formData.get('link_text') as string)?.trim() || null;
		const displayOrder = parseInt((formData.get('display_order') as string) || '0', 10);
		const active = formData.get('active') !== 'false';

		let imageUrl = (formData.get('image_url') as string)?.trim() || '';
		const imageFile = formData.get('image_file') as File | null;

		if (!title || !caption) {
			return fail(400, { carouselMessage: 'Title and caption are required.' });
		}

		if (imageFile && imageFile.size > 0) {
			const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/jpg'];
			if (!allowedTypes.includes(imageFile.type)) {
				return fail(400, { carouselMessage: 'Invalid image format. Allowed formats: JPEG, PNG, WEBP, AVIF.' });
			}

			const MAX_SIZE = 5 * 1024 * 1024;
			if (imageFile.size > MAX_SIZE) {
				return fail(400, { carouselMessage: 'Image file size exceeds the 5MB limit.' });
			}

			try {
				const supabaseAdmin = getAdminClient();
				await supabaseAdmin.storage.createBucket('carousel-images', { public: true }).catch(() => {});

				const ext = imageFile.name.split('.').pop() || 'jpg';
				const fileName = `carousel-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

				const arrayBuffer = await imageFile.arrayBuffer();
				const buffer = Buffer.from(arrayBuffer);

				const { error: uploadErr } = await supabaseAdmin.storage
					.from('carousel-images')
					.upload(fileName, buffer, {
						contentType: imageFile.type,
						upsert: true
					});

				if (uploadErr) {
					console.error('Error uploading carousel image to Supabase Storage:', uploadErr);
					return fail(500, { carouselMessage: `Storage upload failed: ${uploadErr.message}` });
				}

				const { data: publicUrlData } = supabaseAdmin.storage
					.from('carousel-images')
					.getPublicUrl(fileName);

				imageUrl = publicUrlData.publicUrl;
			} catch (err: any) {
				console.error('Upload exception:', err);
				return fail(500, { carouselMessage: `Failed to upload image: ${err.message}` });
			}
		}

		if (!imageUrl) {
			return fail(400, { carouselMessage: 'Please upload an image file or provide an image URL.' });
		}

		const objectPosition = (formData.get('object_position') as string)?.trim() || 'center';

		const { error: insertErr } = await supabase
			.from('landing_carousel_slides')
			.insert({
				title,
				caption,
				image_url: imageUrl,
				link_url: linkUrl,
				link_text: linkText,
				display_order: displayOrder,
				active,
				object_position: objectPosition
			});

		if (insertErr) {
			console.error('Error adding carousel slide:', insertErr);
			return fail(500, { carouselMessage: insertErr.message || 'Failed to create slide.' });
		}

		return { success: true };
	},
	updateCarouselSlide: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const title = (formData.get('title') as string)?.trim();
		const caption = (formData.get('caption') as string)?.trim();
		const linkUrl = (formData.get('link_url') as string)?.trim() || null;
		const linkText = (formData.get('link_text') as string)?.trim() || null;
		const displayOrder = parseInt((formData.get('display_order') as string) || '0', 10);
		const active = formData.get('active') === 'true';
		const objectPosition = (formData.get('object_position') as string)?.trim() || 'center';

		let imageUrl = (formData.get('image_url') as string)?.trim() || '';
		const imageFile = formData.get('image_file') as File | null;

		if (!id || !title || !caption) {
			return fail(400, { carouselMessage: 'Slide ID, title, and caption are required.' });
		}

		if (imageFile && imageFile.size > 0) {
			const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/jpg'];
			if (!allowedTypes.includes(imageFile.type)) {
				return fail(400, { carouselMessage: 'Invalid image format. Allowed formats: JPEG, PNG, WEBP, AVIF.' });
			}

			const MAX_SIZE = 5 * 1024 * 1024;
			if (imageFile.size > MAX_SIZE) {
				return fail(400, { carouselMessage: 'Image file size exceeds the 5MB limit.' });
			}

			try {
				const supabaseAdmin = getAdminClient();
				await supabaseAdmin.storage.createBucket('carousel-images', { public: true }).catch(() => {});

				const ext = imageFile.name.split('.').pop() || 'jpg';
				const fileName = `carousel-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

				const arrayBuffer = await imageFile.arrayBuffer();
				const buffer = Buffer.from(arrayBuffer);

				const { error: uploadErr } = await supabaseAdmin.storage
					.from('carousel-images')
					.upload(fileName, buffer, {
						contentType: imageFile.type,
						upsert: true
					});

				if (uploadErr) {
					console.error('Error uploading replacement carousel image:', uploadErr);
					return fail(500, { carouselMessage: `Storage upload failed: ${uploadErr.message}` });
				}

				const { data: publicUrlData } = supabaseAdmin.storage
					.from('carousel-images')
					.getPublicUrl(fileName);

				imageUrl = publicUrlData.publicUrl;
			} catch (err: any) {
				return fail(500, { carouselMessage: `Failed to upload image: ${err.message}` });
			}
		}

		if (!imageUrl) {
			return fail(400, { carouselMessage: 'Slide must have an image.' });
		}

		const { error: updateErr } = await supabase
			.from('landing_carousel_slides')
			.update({
				title,
				caption,
				image_url: imageUrl,
				link_url: linkUrl,
				link_text: linkText,
				display_order: displayOrder,
				active,
				object_position: objectPosition
			})
			.eq('id', id);

		if (updateErr) {
			console.error('Error updating carousel slide:', updateErr);
			return fail(500, { carouselMessage: updateErr.message || 'Failed to update slide.' });
		}

		return { success: true };
	},
	toggleCarouselActive: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const active = formData.get('active') === 'true';

		if (!id) {
			return fail(400, { carouselMessage: 'Slide ID is required.' });
		}

		const { error: updateErr } = await supabase
			.from('landing_carousel_slides')
			.update({ active })
			.eq('id', id);

		if (updateErr) {
			console.error('Error toggling carousel slide active state:', updateErr);
			return fail(500, { carouselMessage: updateErr.message || 'Failed to toggle status.' });
		}

		return { success: true };
	},
	deleteCarouselSlide: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) {
			return fail(400, { carouselMessage: 'Slide ID is required.' });
		}

		const { data: slide } = await supabase
			.from('landing_carousel_slides')
			.select('image_url')
			.eq('id', id)
			.maybeSingle();

		if (slide?.image_url && slide.image_url.includes('carousel-images/')) {
			try {
				const parts = slide.image_url.split('carousel-images/');
				const fileName = parts[parts.length - 1];
				if (fileName) {
					const supabaseAdmin = getAdminClient();
					await supabaseAdmin.storage.from('carousel-images').remove([fileName]);
				}
			} catch (cleanupErr) {
				console.warn('Could not delete storage image file:', cleanupErr);
			}
		}

		const { error: deleteErr } = await supabase
			.from('landing_carousel_slides')
			.delete()
			.eq('id', id);

		if (deleteErr) {
			console.error('Error deleting carousel slide:', deleteErr);
			return fail(500, { carouselMessage: deleteErr.message || 'Failed to delete slide.' });
		}

		return { success: true };
	},
	seedCarouselSlides: async ({ locals: { supabase } }) => {
		const { error: seedErr } = await supabase
			.from('landing_carousel_slides')
			.insert(defaultSeedSlides);

		if (seedErr) {
			console.error('Error seeding carousel slides:', seedErr);
			return fail(500, { carouselMessage: seedErr.message || 'Failed to seed default carousel slides.' });
		}

		return { success: true };
	},
	grantAdminAccess: async ({ request, locals: { safeGetSession } }) => {
		const { user, isAdmin } = await safeGetSession();
		if (!user || !isAdmin) {
			return fail(403, { adminActionError: 'Unauthorized: Only existing administrators can manage admin access.' });
		}

		const formData = await request.formData();
		const rawEmail = formData.get('email') as string;
		if (!rawEmail) {
			return fail(400, { adminActionError: 'Email address is required.' });
		}

		const email = rawEmail.trim().toLowerCase();
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return fail(400, { adminActionError: 'Please provide a valid email address.' });
		}

		const supabaseAdmin = getAdminClient();

		// Check if already in admin_emails
		const { data: existingAdminEmail } = await supabaseAdmin
			.from('admin_emails')
			.select('email')
			.ilike('email', email)
			.maybeSingle();

		if (existingAdminEmail) {
			return fail(400, { adminActionError: `"${email}" is already an authorized administrator.` });
		}

		// Insert into admin_emails
		const { error: insertErr } = await supabaseAdmin
			.from('admin_emails')
			.insert({ email });

		if (insertErr) {
			console.error('Error granting admin access:', insertErr);
			return fail(500, { adminActionError: insertErr.message || 'Failed to grant admin access.' });
		}

		// If user is already registered in auth.users, immediately link into admin_users
		try {
			const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
			const matchingUser = authData?.users?.find((u) => u.email?.toLowerCase().trim() === email);
			if (matchingUser) {
				await supabaseAdmin
					.from('admin_users')
					.upsert({ id: matchingUser.id });
			}
		} catch (err) {
			console.warn('Could not sync user to admin_users immediately:', err);
		}

		return {
			success: true,
			adminActionSuccess: `Administrator access successfully granted to ${email}.`
		};
	},
	revokeAdminAccess: async ({ request, locals: { safeGetSession } }) => {
		const { user, isAdmin } = await safeGetSession();
		if (!user || !isAdmin) {
			return fail(403, { adminActionError: 'Unauthorized: Only existing administrators can manage admin access.' });
		}

		const formData = await request.formData();
		const rawEmail = formData.get('email') as string;
		const confirmText = (formData.get('confirm_text') as string)?.trim();

		if (!rawEmail) {
			return fail(400, { adminActionError: 'Email address is required.' });
		}

		const email = rawEmail.trim().toLowerCase();

		// Double confirmation check: must match the target email or 'REVOKE'
		if (!confirmText || (confirmText.toLowerCase() !== email && confirmText.toUpperCase() !== 'REVOKE')) {
			return fail(400, {
				adminActionError: `Revocation cancelled: Confirmation phrase must match "${email}" or "REVOKE".`
			});
		}

		// Safeguard 1: Cannot revoke your own administrator privileges
		if (user.email && user.email.trim().toLowerCase() === email) {
			return fail(400, {
				adminActionError: 'Action blocked: You cannot revoke your own administrator access.'
			});
		}

		const supabaseAdmin = getAdminClient();

		// Safeguard 2: Cannot delete the last remaining administrator
		const { data: allAdminEmails, error: countErr } = await supabaseAdmin
			.from('admin_emails')
			.select('email');

		if (countErr) {
			console.error('Error counting admins:', countErr);
			return fail(500, { adminActionError: 'Failed to verify admin count.' });
		}

		if (!allAdminEmails || allAdminEmails.length <= 1) {
			return fail(400, {
				adminActionError: 'Action blocked: Cannot revoke access for the last remaining administrator.'
			});
		}

		// Execute revocation from admin_emails
		const { error: deleteErr } = await supabaseAdmin
			.from('admin_emails')
			.delete()
			.ilike('email', email);

		if (deleteErr) {
			console.error('Error deleting from admin_emails:', deleteErr);
			return fail(500, { adminActionError: deleteErr.message || 'Failed to revoke admin access.' });
		}

		// Also remove from admin_users if matching user exists
		try {
			const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
			const matchingUsers = authData?.users?.filter((u) => u.email?.toLowerCase().trim() === email) || [];
			for (const u of matchingUsers) {
				await supabaseAdmin
					.from('admin_users')
					.delete()
					.eq('id', u.id);
			}
		} catch (err) {
			console.warn('Could not remove user from admin_users:', err);
		}

		return {
			success: true,
			adminActionSuccess: `Administrator access successfully revoked for ${email}.`
		};
	}
};
