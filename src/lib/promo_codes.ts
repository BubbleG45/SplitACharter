/**
 * Utility functions for generating and standardizing captain referral promo codes.
 */

/**
 * Converts a raw string (such as a Charter Name or Captain Name) into a standardized,
 * clean, URL-safe, all-caps referral promo code (e.g. "Salty Dog Charters" -> "SALTY-DOG-CHARTERS").
 */
export function formatPromoCode(input: string | null | undefined): string {
	if (!input) return '';
	return input
		.trim()
		.toUpperCase()
		.replace(/[^A-Z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

/**
 * Derives a recommended referral promo code from charter name or captain name.
 */
export function deriveCaptainPromoCode(charterName?: string | null, captainName?: string | null): string {
	const fromCharter = formatPromoCode(charterName);
	if (fromCharter) return fromCharter;

	const fromCaptain = formatPromoCode(captainName);
	if (fromCaptain) {
		return fromCaptain.startsWith('CAPT') ? fromCaptain : `CAPT-${fromCaptain}`;
	}

	return '';
}
