import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const [listingsRes, captainsRes, marinaAreasRes, areasRes] = await Promise.all([
		supabase
			.from('listing_templates')
			.select(`
				*,
				areas (id, name, slug),
				durations (id, name, label, hours)
			`)
			.order('created_at', { ascending: false }),
		supabase
			.from('captains')
			.select('id, name, active, home_marina_id, trip_types, durations, locations')
			.eq('active', true),
		supabase
			.from('marina_areas')
			.select('area_id, marina_id, marinas(id, active)')
			.eq('marinas.active', true),
		supabase.from('areas').select('*').order('name', { ascending: true })
	]);

	if (listingsRes.error) {
		console.error('Error loading listing templates:', listingsRes.error);
	}

	const activeCaptains = captainsRes.data || [];
	const marinaAreas = marinaAreasRes.data || [];

	// Map each area to its set of active marina IDs
	const areaToMarinaIdsMap: Record<string, string[]> = {};
	marinaAreas.forEach((ma: any) => {
		if (!areaToMarinaIdsMap[ma.area_id]) {
			areaToMarinaIdsMap[ma.area_id] = [];
		}
		if (ma.marina_id) {
			areaToMarinaIdsMap[ma.area_id].push(ma.marina_id);
		}
	});

	// Enrich each listing template with its matching captain count
	const enrichedListings = (listingsRes.data || []).map((template: any) => {
		const areaId = template.area_id;
		const tripType = template.trip_type;
		const durationName = template.durations?.name;
		const validMarinaIds = areaId ? areaToMarinaIdsMap[areaId] || [] : [];

		const tripLocation = template.location;
		const matchingCaptains = activeCaptains.filter((c: any) => {
			// Trip type match
			if (!c.trip_types?.includes(tripType)) return false;

			// Duration match (if captain has durations specified, must match)
			if (c.durations && c.durations.length > 0 && durationName && !c.durations.includes(durationName)) {
				return false;
			}

			// Location match based on captain's selected locations
			return (
				tripLocation &&
				Array.isArray(c.locations) &&
				c.locations.some((loc: string) => loc.toLowerCase() === tripLocation.toLowerCase())
			);
		});

		return {
			...template,
			matchingCaptainCount: matchingCaptains.length
		};
	});

	const uncoveredCount = enrichedListings.filter((l) => l.matchingCaptainCount === 0).length;

	return {
		listings: enrichedListings,
		areas: areasRes.data || [],
		totalCount: enrichedListings.length,
		uncoveredCount
	};
};

export const actions: Actions = {
	toggleActive: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const active = formData.get('active') === 'true';

		if (!id) {
			return fail(400, { message: 'Missing listing template ID' });
		}

		const { error } = await supabase
			.from('listing_templates')
			.update({ active: !active })
			.eq('id', id);

		if (error) {
			console.error('Error toggling active status:', error);
			return fail(500, { message: 'Failed to toggle status' });
		}

		return { success: true };
	},

	generateListings: async ({ locals: { supabase } }) => {
		try {
			const { error } = await supabase.rpc('generate_missing_listing_templates');
			if (error) {
				return fail(500, { message: error.message || 'Failed to generate missing listing templates' });
			}
			return { success: true, message: 'Missing listing templates generated successfully!' };
		} catch (err: any) {
			return fail(500, { message: err?.message || 'Server error' });
		}
	},

	deleteTemplate: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const confirmText = (formData.get('confirmText') as string)?.trim();

		if (!id) {
			return fail(400, { message: 'Missing listing template ID' });
		}

		if (confirmText !== 'DELETE') {
			return fail(400, { message: 'Confirmation text must equal DELETE' });
		}

		// 1. Fetch trip instances referencing this template
		const { data: tripInstances, error: fetchErr } = await supabase
			.from('trip_instances')
			.select('id')
			.eq('listing_template_id', id);

		if (fetchErr) {
			console.error('Error fetching trip instances for template:', fetchErr);
			return fail(500, { message: 'Failed to query referenced trip instances.' });
		}

		if (tripInstances && tripInstances.length > 0) {
			const tripIds = tripInstances.map((t) => t.id);

			// 2. Delete bookings associated with these trip instances
			const { error: bookingsErr } = await supabase
				.from('bookings')
				.delete()
				.in('trip_instance_id', tripIds);

			if (bookingsErr) {
				console.error('Error deleting bookings for template:', bookingsErr);
				return fail(500, { message: 'Failed to clear associated bookings for template.' });
			}

			// 3. Delete trip instances associated with this template
			const { error: tripsErr } = await supabase
				.from('trip_instances')
				.delete()
				.eq('listing_template_id', id);

			if (tripsErr) {
				console.error('Error deleting trip instances for template:', tripsErr);
				return fail(500, { message: 'Failed to clear associated trip instances for template.' });
			}
		}

		// 4. Delete the listing template
		const { error: deleteErr } = await supabase
			.from('listing_templates')
			.delete()
			.eq('id', id);

		if (deleteErr) {
			console.error('Error deleting listing template:', deleteErr);
			return fail(500, { message: deleteErr.message || 'Failed to delete template' });
		}

		return { success: true };
	}
};
