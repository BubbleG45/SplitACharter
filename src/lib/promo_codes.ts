/**
 * Utility functions for generating and standardizing promo codes (both captain referral and checkout discounts).
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

/**
 * Normalizes user input for discount promo codes (e.g. " save10 " -> "SAVE10").
 */
export function normalizePromoCode(input: string | null | undefined): string {
	if (!input) return '';
	return input
		.trim()
		.toUpperCase()
		.replace(/[^A-Z0-9_-]+/g, '');
}

/**
 * Calculates discount and final payable amount given a base reservation fee and a percentage (0-100).
 */
export function calculateDiscount(
	baseAmount: number,
	discountPercent: number
): { discountAmount: number; finalAmount: number } {
	if (discountPercent <= 0) {
		return { discountAmount: 0, finalAmount: Number(baseAmount.toFixed(2)) };
	}
	if (discountPercent >= 100) {
		return { discountAmount: Number(baseAmount.toFixed(2)), finalAmount: 0 };
	}
	const discountAmount = Number(((baseAmount * discountPercent) / 100).toFixed(2));
	const finalAmount = Math.max(0, Number((baseAmount - discountAmount).toFixed(2)));
	return { discountAmount, finalAmount };
}
