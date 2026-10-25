// src/lib/server/routing.ts
// Real road routing & drive-time calculation service
// Uses Mapbox Matrix and Directions API with graceful road-network physics fallback.

import { env } from '$env/dynamic/private';

export interface Coordinate {
	lat: number;
	lng: number;
}

export interface MarinaTarget {
	id: string;
	name: string;
	address: string;
	lat: number;
	lng: number;
}

export interface DriveTimeRangeResult {
	minMinutes: number;
	maxMinutes: number;
	text: string;
	isEstimate: boolean;
	marinaTimes: Array<{
		marinaId: string;
		marinaName: string;
		minutes: number;
		miles: number;
	}>;
}

export interface ExactDriveTimeResult {
	minutes: number;
	miles: number;
	text: string;
	isEstimate: boolean;
}

/**
 * Fallback road distance & time calculator (Great Circle + South Florida coastal road winding coefficient)
 */
function calculateFallbackRoadDriveTime(
	origin: Coordinate,
	dest: Coordinate
): { minutes: number; miles: number } {
	const R = 3958.8; // Earth radius in miles
	const dLat = ((dest.lat - origin.lat) * Math.PI) / 180;
	const dLng = ((dest.lng - origin.lng) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((origin.lat * Math.PI) / 180) *
			Math.cos((dest.lat * Math.PI) / 180) *
			Math.sin(dLng / 2) *
			Math.sin(dLng / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	const straightMiles = R * c;

	// Road winding factor (US-1 / Overseas Highway & coastal peninsulas require ~1.30x straight line)
	const roadMiles = Math.round(straightMiles * 1.3 * 10) / 10;

	// Realistic average speed in Keys & coastal roads: ~40 mph (accounting for island speed limits & lights)
	const hours = roadMiles / 40.0;
	const minutes = Math.max(1, Math.round(hours * 60));

	return { minutes, miles: roadMiles };
}

/**
 * Calculate drive time range from customer location to all active marinas in a destination area.
 */
export async function calculateAreaDriveTimeRange(
	origin: Coordinate,
	marinas: MarinaTarget[],
	areaCenter?: Coordinate
): Promise<DriveTimeRangeResult> {
	if (!origin || isNaN(origin.lat) || isNaN(origin.lng)) {
		return {
			minMinutes: 0,
			maxMinutes: 0,
			text: '',
			isEstimate: true,
			marinaTimes: []
		};
	}

	const token = env.MAPBOX_ACCESS_TOKEN || env.PUBLIC_MAPBOX_TOKEN || '';

	// If no marinas are assigned to this area yet, estimate to the area's central coordinates
	if (!marinas || marinas.length === 0) {
		const target = areaCenter || origin;
		const fallback = calculateFallbackRoadDriveTime(origin, target);
		return {
			minMinutes: fallback.minutes,
			maxMinutes: fallback.minutes,
			text: `About ${fallback.minutes} min drive to central area`,
			isEstimate: true,
			marinaTimes: []
		};
	}

	// Try Mapbox Matrix API if token is configured
	if (token) {
		try {
			// Format: {origin_lng,origin_lat};{dest1_lng,dest1_lat};...
			const coords = [
				`${origin.lng},${origin.lat}`,
				...marinas.map((m) => `${m.lng},${m.lat}`)
			].join(';');

			const url = `https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${coords}?sources=0&annotations=duration,distance&access_token=${token}`;
			const response = await fetch(url, { headers: { Accept: 'application/json' } });

			if (response.ok) {
				const data = await response.json();
				if (data.durations && data.durations[0]) {
					const durationsRow = data.durations[0].slice(1); // skip source 0
					const distancesRow = data.distances ? data.distances[0].slice(1) : [];

					const marinaTimes = marinas.map((m, idx) => {
						const seconds = durationsRow[idx] || 0;
						const meters = distancesRow[idx] || 0;
						const minutes = Math.max(1, Math.round(seconds / 60));
						const miles = Math.round((meters / 1609.34) * 10) / 10;
						return {
							marinaId: m.id,
							marinaName: m.name,
							minutes,
							miles
						};
					});

					const minMinutes = Math.min(...marinaTimes.map((t) => t.minutes));
					const maxMinutes = Math.max(...marinaTimes.map((t) => t.minutes));

					const text =
						minMinutes === maxMinutes
							? `About ${minMinutes} min drive`
							: `About ${minMinutes}–${maxMinutes} min drive (depending on departure marina)`;

					return {
						minMinutes,
						maxMinutes,
						text,
						isEstimate: false,
						marinaTimes
					};
				}
			}
		} catch (err) {
			console.warn('[Routing] Mapbox matrix query failed, falling back to road physics model:', err);
		}
	}

	// Fallback road physics model
	const marinaTimes = marinas.map((m) => {
		const res = calculateFallbackRoadDriveTime(origin, { lat: m.lat, lng: m.lng });
		return {
			marinaId: m.id,
			marinaName: m.name,
			minutes: res.minutes,
			miles: res.miles
		};
	});

	const minMinutes = Math.min(...marinaTimes.map((t) => t.minutes));
	const maxMinutes = Math.max(...marinaTimes.map((t) => t.minutes));

	const text =
		minMinutes === maxMinutes
			? `About ${minMinutes} min drive`
			: `About ${minMinutes}–${maxMinutes} min drive (depending on departure marina)`;

	return {
		minMinutes,
		maxMinutes,
		text,
		isEstimate: true,
		marinaTimes
	};
}

/**
 * Calculate exact road drive time to a specific confirmed marina once claimed.
 */
export async function calculateExactMarinaDriveTime(
	origin: Coordinate,
	marina: MarinaTarget
): Promise<ExactDriveTimeResult> {
	if (!origin || !marina || isNaN(origin.lat) || isNaN(origin.lng)) {
		return {
			minutes: 0,
			miles: 0,
			text: '',
			isEstimate: true
		};
	}

	const token = env.MAPBOX_ACCESS_TOKEN || env.PUBLIC_MAPBOX_TOKEN || '';

	if (token) {
		try {
			const coords = `${origin.lng},${origin.lat};${marina.lng},${marina.lat}`;
			const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?access_token=${token}`;
			const response = await fetch(url);
			if (response.ok) {
				const data = await response.json();
				if (data.routes && data.routes[0]) {
					const route = data.routes[0];
					const minutes = Math.max(1, Math.round(route.duration / 60));
					const miles = Math.round((route.distance / 1609.34) * 10) / 10;
					return {
						minutes,
						miles,
						text: `About ${minutes} min drive (${miles} mi) to ${marina.name}`,
						isEstimate: false
					};
				}
			}
		} catch (err) {
			console.warn('[Routing] Mapbox directions query failed, falling back:', err);
		}
	}

	const fallback = calculateFallbackRoadDriveTime(origin, { lat: marina.lat, lng: marina.lng });
	return {
		minutes: fallback.minutes,
		miles: fallback.miles,
		text: `About ${fallback.minutes} min drive (${fallback.miles} mi) to ${marina.name}`,
		isEstimate: true
	};
}
