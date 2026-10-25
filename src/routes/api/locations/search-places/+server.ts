// src/routes/api/locations/search-places/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

// Curated top Florida Keys hotels and resorts fallback
const POPULAR_KEYS_PLACES = [
	{ name: 'Cheeca Lodge & Spa (Islamorada)', address: '81801 Overseas Hwy, Islamorada, FL 33036', lat: 24.9192, lng: -80.6301 },
	{ name: 'Islander Resort (Islamorada)', address: '82100 Overseas Hwy, Islamorada, FL 33036', lat: 24.9221, lng: -80.6272 },
	{ name: 'Playa Largo Resort & Spa (Key Largo)', address: '97450 Overseas Hwy, Key Largo, FL 33037', lat: 25.0682, lng: -80.4578 },
	{ name: 'Bakers Cay Resort (Key Largo)', address: '97000 Overseas Hwy, Key Largo, FL 33037', lat: 25.0601, lng: -80.4632 },
	{ name: 'Hawks Cay Resort (Duck Key / Marathon)', address: '61 Hawks Cay Blvd, Duck Key, FL 33050', lat: 24.7645, lng: -80.9103 },
	{ name: 'Isla Bella Beach Resort (Marathon)', address: '1 Knights Key Blvd, Marathon, FL 33050', lat: 24.7071, lng: -81.1273 },
	{ name: 'Courtyard by Marriott Marathon', address: '2146 Overseas Hwy, Marathon, FL 33050', lat: 24.7214, lng: -81.0911 },
	{ name: 'Hyatt Centric Key West Resort & Spa', address: '601 Front St, Key West, FL 33040', lat: 24.5601, lng: -81.8052 },
	{ name: 'Ocean Key Resort & Spa (Key West)', address: '0 Duval St, Key West, FL 33040', lat: 24.5603, lng: -81.8066 },
	{ name: 'Casa Marina Key West, Curio Collection', address: '1500 Reynolds St, Key West, FL 33040', lat: 24.5471, lng: -81.7915 },
	{ name: 'The Perry Hotel & Marina (Stock Island)', address: '7001 Shrimp Rd, Key West, FL 33040', lat: 24.5683, lng: -81.7412 },
	{ name: 'Little Palm Island Resort & Spa (Little Torch Key)', address: '28500 Overseas Hwy, Little Torch Key, FL 33042', lat: 24.6465, lng: -81.3854 }
];

export const GET: RequestHandler = async ({ url }) => {
	const query = (url.searchParams.get('q') || '').trim();

	if (!query || query.length < 2) {
		return json({ places: [] });
	}

	const token = env.MAPBOX_ACCESS_TOKEN || env.PUBLIC_MAPBOX_TOKEN || '';

	if (token) {
		try {
			// Center search proximity around Florida Keys / South Florida (lat: 24.8, lng: -80.9)
			const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
				query
			)}.json?proximity=-80.9,24.8&country=US&types=poi,address,place&limit=6&access_token=${token}`;

			const res = await fetch(endpoint);
			if (res.ok) {
				const data = await res.json();
				if (data.features && data.features.length > 0) {
					const places = data.features.map((f: any) => ({
						name: f.text || f.place_name,
						address: f.place_name,
						lng: f.center[0],
						lat: f.center[1]
					}));
					return json({ places });
				}
			}
		} catch (err) {
			console.warn('[SearchPlaces API] Mapbox geocoding error:', err);
		}
	}

	// Fallback to local curated places matching search query
	const qLower = query.toLowerCase();
	const matches = POPULAR_KEYS_PLACES.filter(
		(p) => p.name.toLowerCase().includes(qLower) || p.address.toLowerCase().includes(qLower)
	).slice(0, 5);

	return json({ places: matches });
};
