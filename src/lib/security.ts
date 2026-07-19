import crypto from 'crypto';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

/**
 * Generates a secure HMAC-SHA256 signature for a captain to access a specific trip's details.
 */
export function generateCaptainToken(tripId: string, captainId: string): string {
	if (!SUPABASE_SERVICE_ROLE_KEY) {
		throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables');
	}
	return crypto
		.createHmac('sha256', SUPABASE_SERVICE_ROLE_KEY)
		.update(`${tripId}:${captainId}`)
		.digest('hex');
}

/**
 * Verifies if the provided token matches the generated signature for the given trip and captain.
 */
export function verifyCaptainToken(tripId: string, captainId: string, token: string): boolean {
	if (!tripId || !captainId || !token) {
		return false;
	}
	const expectedToken = generateCaptainToken(tripId, captainId);
	return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken));
}
