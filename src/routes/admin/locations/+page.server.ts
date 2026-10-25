import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { releasePendingNeedsCaptainTrips } from '$lib/server/trips';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

	const [areasRes, marinasRes, marinaAreasRes, durationsRes, tripTypesRes] = await Promise.all([
		supabase.from('areas').select('*').order('name', { ascending: true }),
		supabase.from('marinas').select('*').order('name', { ascending: true }),
		supabase.from('marina_areas').select('marina_id, area_id'),
		supabase.from('durations').select('*').order('hours', { ascending: true }),
		supabase.from('trip_types').select('*').order('name', { ascending: true })
	]);

	if (areasRes.error) {
		console.error('Error loading areas:', areasRes.error);
	}
	if (marinasRes.error) {
		console.error('Error loading marinas:', marinasRes.error);
	}

	// Map marina areas
	const marinaAreasMap: Record<string, string[]> = {};
	(marinaAreasRes.data || []).forEach((ma: any) => {
		if (!marinaAreasMap[ma.marina_id]) {
			marinaAreasMap[ma.marina_id] = [];
		}
		marinaAreasMap[ma.marina_id].push(ma.area_id);
	});

	const enrichedMarinas = (marinasRes.data || []).map((m: any) => ({
		...m,
		area_ids: marinaAreasMap[m.id] || []
	}));

	return {
		areas: areasRes.data || [],
		marinas: enrichedMarinas,
		durations: durationsRes.data || [],
		tripTypes: tripTypesRes.data || []
	};
};

export const actions: Actions = {
	createArea: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const name = (formData.get('name') as string)?.trim();
		let slug = (formData.get('slug') as string)?.trim().toLowerCase();
		const description = (formData.get('description') as string)?.trim() || null;
		const mapboxRegion = (formData.get('mapbox_region') as string)?.trim() || null;
		const centerLat = parseFloat(formData.get('center_lat') as string) || null;
		const centerLng = parseFloat(formData.get('center_lng') as string) || null;
		const active = formData.get('active') !== 'false';

		if (!name) {
			return fail(400, { message: 'Area name is required' });
		}
		if (!slug) {
			slug = name
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-|-$/g, '');
		}

		const { error: insertErr } = await supabase.from('areas').insert({
			name,
			slug,
			center_lat: centerLat,
			center_lng: centerLng,
			active
		});

		if (insertErr) {
			console.error('Error inserting area:', insertErr);
			return fail(500, { message: insertErr.message || 'Failed to create area' });
		}

		// Automatically generate missing listing templates for this new area
		try {
			await supabase.rpc('generate_missing_listing_templates');
		} catch (rpcErr) {
			console.warn('RPC generate_missing_listing_templates notice:', rpcErr);
		}

		return { success: true, message: `Area "${name}" created and listing templates generated.` };
	},

	updateArea: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const name = (formData.get('name') as string)?.trim();
		const slug = (formData.get('slug') as string)?.trim().toLowerCase();
		const description = (formData.get('description') as string)?.trim() || null;
		const mapboxRegion = (formData.get('mapbox_region') as string)?.trim() || null;
		const centerLat = parseFloat(formData.get('center_lat') as string) || null;
		const centerLng = parseFloat(formData.get('center_lng') as string) || null;
		const active = formData.get('active') === 'true';

		if (!id || !name || !slug) {
			return fail(400, { message: 'ID, name, and slug are required' });
		}

		const { error } = await supabase
			.from('areas')
			.update({
				name,
				slug,
					center_lat: centerLat,
				center_lng: centerLng,
				active
			})
			.eq('id', id);

		if (error) {
			return fail(500, { message: error.message || 'Failed to update area' });
		}

		return { success: true };
	},

	createMarina: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const name = (formData.get('name') as string)?.trim();
		const address = (formData.get('address') as string)?.trim();
		const lat = parseFloat(formData.get('lat') as string);
		const lng = parseFloat(formData.get('lng') as string);
		const phone = (formData.get('phone') as string)?.trim() || null;
		const notes = (formData.get('notes') as string)?.trim() || null;
		const active = formData.get('active') !== 'false';
		const areaIds = formData.getAll('area_ids') as string[];

		if (!name || !address || isNaN(lat) || isNaN(lng)) {
			return fail(400, { message: 'Name, address, latitude, and longitude are required' });
		}

		const { data: newMarina, error: marinaErr } = await supabase
			.from('marinas')
			.insert({ name, address, lat, lng, phone, notes, active })
			.select('id')
			.single();

		if (marinaErr || !newMarina) {
			return fail(500, { message: marinaErr?.message || 'Failed to create marina' });
		}

		// Insert marina_areas links
		if (areaIds && areaIds.length > 0) {
			const links = areaIds.map((aId) => ({
				marina_id: newMarina.id,
				area_id: aId
			}));
			await supabase.from('marina_areas').insert(links);
		}

		// Release any upcoming needs_captain trips if coverage is added
		try {
			await releasePendingNeedsCaptainTrips();
		} catch (err) {
			console.error('Error releasing pending trips on marina creation:', err);
		}

		return { success: true, message: `Marina "${name}" created successfully.` };
	},

	updateMarina: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const name = (formData.get('name') as string)?.trim();
		const address = (formData.get('address') as string)?.trim();
		const lat = parseFloat(formData.get('lat') as string);
		const lng = parseFloat(formData.get('lng') as string);
		const phone = (formData.get('phone') as string)?.trim() || null;
		const notes = (formData.get('notes') as string)?.trim() || null;
		const active = formData.get('active') === 'true';
		const areaIds = formData.getAll('area_ids') as string[];

		if (!id || !name || !address || isNaN(lat) || isNaN(lng)) {
			return fail(400, { message: 'ID, name, address, latitude, and longitude are required' });
		}

		const { error: updateErr } = await supabase
			.from('marinas')
			.update({ name, address, lat, lng, phone, notes, active })
			.eq('id', id);

		if (updateErr) {
			return fail(500, { message: updateErr.message || 'Failed to update marina' });
		}

		// Re-sync marina_areas links
		await supabase.from('marina_areas').delete().eq('marina_id', id);
		if (areaIds && areaIds.length > 0) {
			const links = areaIds.map((aId) => ({
				marina_id: id,
				area_id: aId
			}));
			await supabase.from('marina_areas').insert(links);
		}

		// Release pending needs_captain trips if coverage is now satisfied
		try {
			await releasePendingNeedsCaptainTrips();
		} catch (err) {
			console.error('Error releasing pending trips on marina update:', err);
		}

		return { success: true };
	},

	generateListings: async ({ locals: { supabase } }) => {
		try {
			const { error } = await supabase.rpc('generate_missing_listing_templates');
			if (error) {
				return fail(500, { message: error.message || 'Failed to execute generate function' });
			}
			return { success: true, message: 'Missing listing templates generated successfully!' };
		} catch (err: any) {
			return fail(500, { message: err?.message || 'Server error' });
		}
	}
};
