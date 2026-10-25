// src/routes/api/locations/drive-time/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { calculateAreaDriveTimeRange } from '$lib/server/routing';

export const POST: RequestHandler = async ({ request, locals: { supabase } }) => {
	try {
		const { lat, lng, areaId } = await request.json();

		if (typeof lat !== 'number' || typeof lng !== 'number' || !areaId) {
			return json({ success: false, error: 'Missing coordinates or areaId' }, { status: 400 });
		}

		// 1. Fetch Area info (including center coordinates)
		const { data: area, error: areaErr } = await supabase
			.from('areas')
			.select('id, name, center_lat, center_lng')
			.eq('id', areaId)
			.maybeSingle();

		if (areaErr || !area) {
			return json({ success: false, error: 'Area not found' }, { status: 404 });
		}

		// 2. Fetch active marinas associated with this area
		const { data: marinaLinks, error: marinaErr } = await supabase
			.from('marina_areas')
			.select('marinas(id, name, address, lat, lng, active)')
			.eq('area_id', areaId);

		if (marinaErr) {
			console.error('[DriveTime API] Error fetching marinas for area:', marinaErr);
		}

		const activeMarinas = (marinaLinks || [])
			.map((link: any) => link.marinas)
			.filter((m: any) => m && m.active);

		const result = await calculateAreaDriveTimeRange(
			{ lat, lng },
			activeMarinas,
			{ lat: Number(area.center_lat), lng: Number(area.center_lng) }
		);

		return json({
			success: true,
			areaId: area.id,
			areaName: area.name,
			...result
		});
	} catch (err: any) {
		console.error('[DriveTime API] Unexpected error:', err);
		return json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
	}
};
