import type { SupabaseClient } from '@supabase/supabase-js';
import { getStripePayouts, type StripePayoutItem } from './stripe';

export type DatePreset =
	| 'today'
	| 'yesterday'
	| 'this_week'
	| 'last_week'
	| 'this_month'
	| 'last_month'
	| 'this_year'
	| 'last_year'
	| 'custom';

export interface DateRangeBounds {
	preset: DatePreset;
	startDate: Date;
	endDate: Date;
	startIso: string;
	endIso: string;
	label: string;
}

/**
 * Calculates start and end Date objects for preset time ranges.
 */
export function getDateRangeBounds(
	presetInput?: string | null,
	customStart?: string | null,
	customEnd?: string | null
): DateRangeBounds {
	const preset = (presetInput || 'this_month') as DatePreset;
	const now = new Date();

	let startDate = new Date();
	let endDate = new Date();

	switch (preset) {
		case 'today': {
			startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
			endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
			break;
		}
		case 'yesterday': {
			const y = new Date(now);
			y.setDate(now.getDate() - 1);
			startDate = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0, 0);
			endDate = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999);
			break;
		}
		case 'this_week': {
			const dayOfWeek = now.getDay(); // 0 = Sunday
			const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
			const monday = new Date(now);
			monday.setDate(now.getDate() - diffToMonday);
			startDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate(), 0, 0, 0, 0);
			endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
			break;
		}
		case 'last_week': {
			const dayOfWeek = now.getDay();
			const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
			const thisMonday = new Date(now);
			thisMonday.setDate(now.getDate() - diffToMonday);
			const lastMonday = new Date(thisMonday);
			lastMonday.setDate(thisMonday.getDate() - 7);
			const lastSunday = new Date(lastMonday);
			lastSunday.setDate(lastMonday.getDate() + 6);
			startDate = new Date(lastMonday.getFullYear(), lastMonday.getMonth(), lastMonday.getDate(), 0, 0, 0, 0);
			endDate = new Date(lastSunday.getFullYear(), lastSunday.getMonth(), lastSunday.getDate(), 23, 59, 59, 999);
			break;
		}
		case 'this_month': {
			startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
			endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
			break;
		}
		case 'last_month': {
			startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
			endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
			break;
		}
		case 'this_year': {
			startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
			endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
			break;
		}
		case 'last_year': {
			startDate = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
			endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
			break;
		}
		case 'custom': {
			if (customStart) {
				const s = new Date(customStart + 'T00:00:00');
				if (!isNaN(s.getTime())) startDate = s;
			} else {
				startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
			}

			if (customEnd) {
				const e = new Date(customEnd + 'T23:59:59.999');
				if (!isNaN(e.getTime())) endDate = e;
			} else {
				endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
			}
			break;
		}
		default: {
			startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
			endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
		}
	}

	const labelMap: Record<DatePreset, string> = {
		today: 'Today',
		yesterday: 'Yesterday',
		this_week: 'This Week',
		last_week: 'Last Week',
		this_month: 'This Month',
		last_month: 'Last Month',
		this_year: 'This Year',
		last_year: 'Last Year',
		custom: `Custom (${startDate.toISOString().slice(0, 10)} to ${endDate.toISOString().slice(0, 10)})`
	};

	return {
		preset,
		startDate,
		endDate,
		startIso: startDate.toISOString(),
		endIso: endDate.toISOString(),
		label: labelMap[preset] || 'Date Range'
	};
}

/**
 * Performance Reports: Sales, Sales by trip type, and Confirmed trips
 */
export async function getPerformanceReport(
	supabase: SupabaseClient,
	bounds: DateRangeBounds
) {
	// 1. Fetch payments in date range
	const { data: payments } = await supabase
		.from('payment_records')
		.select(`
			id,
			amount,
			status,
			created_at,
			bookings:booking_id (
				id,
				group_size,
				status,
				customers (name, email),
				trip_instances (
					id,
					date,
					listing_templates (
						trip_type,
						location
					)
				)
			)
		`)
		.gte('created_at', bounds.startIso)
		.lte('created_at', bounds.endIso)
		.order('created_at', { ascending: false });

	const validPayments = payments || [];
	const succeededPayments = validPayments.filter((p) => p.status === 'succeeded' || p.status === 'paid');
	const refundedPayments = validPayments.filter((p) => p.status === 'refunded');

	const grossSales = succeededPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
	const refundedAmount = refundedPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
	const netSales = grossSales - refundedAmount;
	const totalBookingsCount = succeededPayments.length;
	const totalPassengers = succeededPayments.reduce((sum, p: any) => {
		const groupSize = p.bookings?.group_size || 0;
		return sum + groupSize;
	}, 0);

	// 2. Sales by Trip Type
	const tripTypeMap: Record<
		string,
		{ tripType: string; count: number; passengers: number; grossSales: number; refunds: number; netSales: number }
	> = {};

	for (const p of validPayments) {
		const tripType = (p as any).bookings?.trip_instances?.listing_templates?.trip_type || 'Unassigned / Direct';
		if (!tripTypeMap[tripType]) {
			tripTypeMap[tripType] = {
				tripType,
				count: 0,
				passengers: 0,
				grossSales: 0,
				refunds: 0,
				netSales: 0
			};
		}
		const amt = Number(p.amount || 0);
		if (p.status === 'succeeded' || p.status === 'paid') {
			tripTypeMap[tripType].count += 1;
			tripTypeMap[tripType].passengers += (p as any).bookings?.group_size || 0;
			tripTypeMap[tripType].grossSales += amt;
			tripTypeMap[tripType].netSales += amt;
		} else if (p.status === 'refunded') {
			tripTypeMap[tripType].refunds += amt;
			tripTypeMap[tripType].netSales -= amt;
		}
	}

	const salesByTripType = Object.values(tripTypeMap).sort((a, b) => b.grossSales - a.grossSales);

	// 3. Confirmed Trips (within date range or scheduled within date range)
	const { data: confirmedTripsRaw } = await supabase
		.from('trip_instances')
		.select(`
			id,
			date,
			status,
			created_at,
			updated_at,
			captain_id,
			captains (name, phone, charter_name),
			listing_templates (trip_type, location, low_price, high_price, max_passengers),
			bookings (
				id,
				group_size,
				status,
				customers (name, email, phone)
			)
		`)
		.in('status', ['confirmed', 'completed'])
		.order('date', { ascending: false });

	const confirmedTrips = (confirmedTripsRaw || []).map((t: any) => {
		const template = Array.isArray(t.listing_templates) ? t.listing_templates[0] : t.listing_templates;
		const captain = Array.isArray(t.captains) ? t.captains[0] : t.captains;
		const bookings = t.bookings || [];
		const totalPassengers = bookings.reduce((sum: number, b: any) => sum + (b.group_size || 0), 0);
		const groupsCount = bookings.length;
		const depositRevenue = bookings.filter((b: any) => ['paid', 'reconfirmed'].includes(b.status)).length * 50;

		return {
			id: t.id,
			date: t.date,
			status: t.status,
			tripType: template?.trip_type || 'Unknown',
			location: template?.location || 'Unknown',
			captainName: captain?.name || 'Unassigned',
			charterName: captain?.charter_name || null,
			captainPhone: captain?.phone || null,
			totalPassengers,
			maxPassengers: template?.max_passengers || 6,
			groupsCount,
			depositRevenue,
			bookings: bookings.map((b: any) => ({
				id: b.id,
				groupSize: b.group_size,
				status: b.status,
				customerName: b.customers?.name || 'Customer',
				customerEmail: b.customers?.email || '',
				customerPhone: b.customers?.phone || ''
			}))
		};
	});

	return {
		metrics: {
			grossSales,
			refundedAmount,
			netSales,
			totalBookingsCount,
			totalPassengers,
			confirmedTripsCount: confirmedTrips.length
		},
		payments: validPayments,
		salesByTripType,
		confirmedTrips
	};
}

/**
 * Operations Reports: Captains Promocode Use Report
 */
export async function getOperationsReport(supabase: SupabaseClient) {
	// Fetch all captains
	const { data: captains } = await supabase
		.from('captains')
		.select('id, name, charter_name, phone, email, referral_promo_code, active, locations, trip_types')
		.order('name', { ascending: true });

	// Fetch trip instances with referrals
	const { data: trips } = await supabase
		.from('trip_instances')
		.select(`
			id,
			date,
			status,
			referring_captain_id,
			referring_captain_ids,
			listing_templates (trip_type, location),
			bookings (
				id,
				group_size,
				status,
				created_at,
				customers (name, email)
			)
		`);

	const allCaptains = captains || [];
	const allTrips = trips || [];

	const promoUsageMap: Record<
		string,
		{
			captainId: string;
			captainName: string;
			charterName: string | null;
			promoCode: string;
			active: boolean;
			tripsReferenced: number;
			confirmedTripsCount: number;
			bookingsGenerated: number;
			totalPassengers: number;
			depositRevenue: number;
			lastUsedDate: string | null;
			referencedTrips: any[];
		}
	> = {};

	for (const cap of allCaptains) {
		const code = cap.referral_promo_code || 'N/A';
		promoUsageMap[cap.id] = {
			captainId: cap.id,
			captainName: cap.name,
			charterName: cap.charter_name || null,
			promoCode: code,
			active: cap.active,
			tripsReferenced: 0,
			confirmedTripsCount: 0,
			bookingsGenerated: 0,
			totalPassengers: 0,
			depositRevenue: 0,
			lastUsedDate: null,
			referencedTrips: []
		};
	}

	for (const trip of allTrips) {
		const refId = trip.referring_captain_id;
		const refIds: string[] = trip.referring_captain_ids || [];
		const captainsInvolved = new Set<string>();
		if (refId) captainsInvolved.add(refId);
		for (const id of refIds) captainsInvolved.add(id);

		if (captainsInvolved.size === 0) continue;

		const template = Array.isArray(trip.listing_templates) ? trip.listing_templates[0] : trip.listing_templates;
		const bookings = trip.bookings || [];
		const isConfirmed = ['confirmed', 'completed'].includes(trip.status);

		for (const capId of captainsInvolved) {
			if (!promoUsageMap[capId]) continue;
			const record = promoUsageMap[capId];
			record.tripsReferenced += 1;
			if (isConfirmed) record.confirmedTripsCount += 1;

			for (const b of bookings) {
				record.bookingsGenerated += 1;
				record.totalPassengers += b.group_size || 0;
				if (['paid', 'reconfirmed'].includes(b.status)) {
					record.depositRevenue += 50;
				}
				if (b.created_at) {
					if (!record.lastUsedDate || new Date(b.created_at) > new Date(record.lastUsedDate)) {
						record.lastUsedDate = b.created_at;
					}
				}
			}

			record.referencedTrips.push({
				tripId: trip.id,
				date: trip.date,
				status: trip.status,
				tripType: template?.trip_type || 'Unknown',
				bookingsCount: bookings.length
			});
		}
	}

	const promoReport = Object.values(promoUsageMap).sort((a, b) => {
		// Sort by bookings generated desc, then by promo code
		if (b.bookingsGenerated !== a.bookingsGenerated) {
			return b.bookingsGenerated - a.bookingsGenerated;
		}
		return a.promoCode.localeCompare(b.promoCode);
	});

	const totalPromoBookings = promoReport.reduce((sum, r) => sum + r.bookingsGenerated, 0);
	const totalPromoRevenue = promoReport.reduce((sum, r) => sum + r.depositRevenue, 0);

	return {
		promoReport,
		totalPromoBookings,
		totalPromoRevenue,
		activeCaptainsWithCodes: allCaptains.filter((c) => !!c.referral_promo_code).length
	};
}

/**
 * Customers Report: Contact info directory with bookings and spend
 */
export async function getCustomersReport(supabase: SupabaseClient, searchTerm?: string | null) {
	let query = supabase
		.from('customers')
		.select(`
			id,
			name,
			email,
			phone,
			sms_opt_in,
			city,
			state,
			how_heard,
			experience,
			strike_count,
			flagged,
			created_at,
			bookings (
				id,
				group_size,
				status,
				created_at,
				payment_records (
					amount,
					status
				)
			)
		`)
		.order('name', { ascending: true });

	if (searchTerm && searchTerm.trim().length > 0) {
		const term = `%${searchTerm.trim()}%`;
		query = query.or(`name.ilike.${term},email.ilike.${term},phone.ilike.${term},city.ilike.${term}`);
	}

	const { data: customers } = await query;
	const customerList = (customers || []).map((c: any) => {
		const bookings = c.bookings || [];
		let lifetimeSpend = 0;
		for (const b of bookings) {
			const payments = b.payment_records || [];
			for (const p of payments) {
				if (p.status === 'succeeded' || p.status === 'paid') {
					lifetimeSpend += Number(p.amount || 0);
				} else if (p.status === 'refunded') {
					lifetimeSpend -= Number(p.amount || 0);
				}
			}
		}

		return {
			id: c.id,
			name: c.name,
			email: c.email,
			phone: c.phone,
			smsOptIn: c.sms_opt_in,
			location: c.city && c.state ? `${c.city}, ${c.state}` : c.city || c.state || 'N/A',
			howHeard: c.how_heard || 'Direct',
			experience: c.experience || 'Not specified',
			strikeCount: c.strike_count || 0,
			flagged: c.flagged || false,
			totalBookings: bookings.length,
			lifetimeSpend: Math.max(0, lifetimeSpend),
			createdAt: c.created_at
		};
	});

	return {
		customers: customerList,
		totalCustomers: customerList.length,
		smsOptInCount: customerList.filter((c) => c.smsOptIn).length,
		flaggedCount: customerList.filter((c) => c.flagged).length
	};
}

/**
 * Accounting Reports: Payouts and Refunds, Revenue by Trip Type
 */
export async function getAccountingReport(supabase: SupabaseClient, bounds: DateRangeBounds) {
	// Query all payment records in bounds
	const { data: payments } = await supabase
		.from('payment_records')
		.select(`
			id,
			stripe_payment_intent_id,
			amount,
			status,
			created_at,
			refund_history,
			bookings:booking_id (
				id,
				group_size,
				status,
				customers (name, email, phone),
				trip_instances (
					date,
					listing_templates (trip_type, location)
				)
			)
		`)
		.gte('created_at', bounds.startIso)
		.lte('created_at', bounds.endIso)
		.order('created_at', { ascending: false });

	const validPayments = payments || [];
	const deposits = validPayments.filter((p) => p.status === 'succeeded' || p.status === 'paid');
	const refunds = validPayments.filter((p) => p.status === 'refunded');

	const totalDeposits = deposits.reduce((sum, p) => sum + Number(p.amount || 0), 0);
	const totalRefunds = refunds.reduce((sum, p) => sum + Number(p.amount || 0), 0);
	const netRetained = totalDeposits - totalRefunds;

	// Revenue by Trip Type
	const tripTypeRevenueMap: Record<
		string,
		{ tripType: string; deposits: number; refunds: number; netRevenue: number; transactionCount: number }
	> = {};

	for (const p of validPayments) {
		const tripType = (p as any).bookings?.trip_instances?.listing_templates?.trip_type || 'General / Unassigned';
		if (!tripTypeRevenueMap[tripType]) {
			tripTypeRevenueMap[tripType] = {
				tripType,
				deposits: 0,
				refunds: 0,
				netRevenue: 0,
				transactionCount: 0
			};
		}
		const amt = Number(p.amount || 0);
		if (p.status === 'succeeded' || p.status === 'paid') {
			tripTypeRevenueMap[tripType].deposits += amt;
			tripTypeRevenueMap[tripType].netRevenue += amt;
			tripTypeRevenueMap[tripType].transactionCount += 1;
		} else if (p.status === 'refunded') {
			tripTypeRevenueMap[tripType].refunds += amt;
			tripTypeRevenueMap[tripType].netRevenue -= amt;
			tripTypeRevenueMap[tripType].transactionCount += 1;
		}
	}

	const revenueByTripType = Object.values(tripTypeRevenueMap).sort((a, b) => b.netRevenue - a.netRevenue);

	// Stripe Bank Payouts list
	const stripePayoutsResult = await getStripePayouts(25);

	return {
		metrics: {
			totalDeposits,
			totalRefunds,
			netRetained,
			depositCount: deposits.length,
			refundCount: refunds.length
		},
		deposits,
		refunds,
		revenueByTripType,
		stripePayouts: stripePayoutsResult.payouts,
		isStripeMock: stripePayoutsResult.isMock,
		stripeError: stripePayoutsResult.error
	};
}

/**
 * Ad-Hoc Data Explorer: Visual Query Runner
 */
export interface AdHocQueryParams {
	dataset: 'bookings' | 'trips' | 'customers' | 'captains' | 'payments';
	selectedFields?: string[];
	search?: string;
	statusFilter?: string;
	datePreset?: string;
	customStart?: string;
	customEnd?: string;
	limit?: number;
}

export const DATASET_FIELD_DEFINITIONS: Record<
	string,
	{ key: string; label: string; defaultSelected: boolean }[]
> = {
	bookings: [
		{ key: 'id', label: 'Booking ID', defaultSelected: false },
		{ key: 'created_at', label: 'Booked Date', defaultSelected: true },
		{ key: 'customer_name', label: 'Customer Name', defaultSelected: true },
		{ key: 'customer_email', label: 'Customer Email', defaultSelected: true },
		{ key: 'group_size', label: 'Group Size', defaultSelected: true },
		{ key: 'status', label: 'Status', defaultSelected: true },
		{ key: 'trip_date', label: 'Trip Date', defaultSelected: true },
		{ key: 'trip_type', label: 'Trip Type', defaultSelected: true },
		{ key: 'location', label: 'Location', defaultSelected: true }
	],
	trips: [
		{ key: 'id', label: 'Trip ID', defaultSelected: false },
		{ key: 'date', label: 'Scheduled Date', defaultSelected: true },
		{ key: 'status', label: 'Trip Status', defaultSelected: true },
		{ key: 'trip_type', label: 'Trip Type', defaultSelected: true },
		{ key: 'location', label: 'Location', defaultSelected: true },
		{ key: 'captain_name', label: 'Assigned Captain', defaultSelected: true },
		{ key: 'charter_name', label: 'Charter Business', defaultSelected: true },
		{ key: 'passenger_count', label: 'Total Passengers', defaultSelected: true },
		{ key: 'groups_count', label: 'Groups Count', defaultSelected: true },
		{ key: 'created_at', label: 'Created At', defaultSelected: false }
	],
	customers: [
		{ key: 'id', label: 'Customer ID', defaultSelected: false },
		{ key: 'name', label: 'Full Name', defaultSelected: true },
		{ key: 'email', label: 'Email', defaultSelected: true },
		{ key: 'phone', label: 'Phone', defaultSelected: true },
		{ key: 'sms_opt_in', label: 'SMS Opt-in', defaultSelected: true },
		{ key: 'city', label: 'City', defaultSelected: true },
		{ key: 'state', label: 'State', defaultSelected: true },
		{ key: 'how_heard', label: 'How Heard', defaultSelected: true },
		{ key: 'strike_count', label: 'Strikes', defaultSelected: true },
		{ key: 'flagged', label: 'Flagged', defaultSelected: true },
		{ key: 'created_at', label: 'Joined Date', defaultSelected: true }
	],
	captains: [
		{ key: 'id', label: 'Captain ID', defaultSelected: false },
		{ key: 'name', label: 'Captain Name', defaultSelected: true },
		{ key: 'charter_name', label: 'Charter Name', defaultSelected: true },
		{ key: 'referral_promo_code', label: 'Promo Code', defaultSelected: true },
		{ key: 'phone', label: 'Phone', defaultSelected: true },
		{ key: 'email', label: 'Email', defaultSelected: true },
		{ key: 'active', label: 'Active', defaultSelected: true },
		{ key: 'locations', label: 'Locations Covered', defaultSelected: true },
		{ key: 'trip_types', label: 'Trip Types', defaultSelected: true },
		{ key: 'max_passengers', label: 'Max Capacity', defaultSelected: true }
	],
	payments: [
		{ key: 'id', label: 'Payment Record ID', defaultSelected: false },
		{ key: 'created_at', label: 'Transaction Date', defaultSelected: true },
		{ key: 'stripe_payment_intent_id', label: 'Stripe ID', defaultSelected: true },
		{ key: 'amount', label: 'Amount ($)', defaultSelected: true },
		{ key: 'status', label: 'Payment Status', defaultSelected: true },
		{ key: 'customer_name', label: 'Customer', defaultSelected: true },
		{ key: 'trip_type', label: 'Trip Type', defaultSelected: true },
		{ key: 'trip_date', label: 'Trip Date', defaultSelected: true }
	]
};

export async function runAdHocQuery(supabase: SupabaseClient, params: AdHocQueryParams) {
	const dataset = params.dataset || 'bookings';
	const limit = Math.min(Math.max(Number(params.limit || 50), 1), 500);

	let rows: Record<string, any>[] = [];

	switch (dataset) {
		case 'bookings': {
			let q = supabase
				.from('bookings')
				.select(`
					id,
					created_at,
					group_size,
					status,
					customers (name, email),
					trip_instances (
						date,
						listing_templates (trip_type, location)
					)
				`)
				.order('created_at', { ascending: false })
				.limit(limit);

			if (params.statusFilter && params.statusFilter !== 'all') {
				q = q.eq('status', params.statusFilter);
			}

			const { data } = await q;
			rows = (data || []).map((b: any) => ({
				id: b.id,
				created_at: b.created_at ? new Date(b.created_at).toLocaleString() : '',
				customer_name: b.customers?.name || 'N/A',
				customer_email: b.customers?.email || 'N/A',
				group_size: b.group_size,
				status: b.status,
				trip_date: b.trip_instances?.date || 'N/A',
				trip_type: b.trip_instances?.listing_templates?.trip_type || 'N/A',
				location: b.trip_instances?.listing_templates?.location || 'N/A'
			}));
			break;
		}
		case 'trips': {
			let q = supabase
				.from('trip_instances')
				.select(`
					id,
					date,
					status,
					created_at,
					captains (name, charter_name),
					listing_templates (trip_type, location),
					bookings (group_size)
				`)
				.order('date', { ascending: false })
				.limit(limit);

			if (params.statusFilter && params.statusFilter !== 'all') {
				q = q.eq('status', params.statusFilter);
			}

			const { data } = await q;
			rows = (data || []).map((t: any) => {
				const bookings = t.bookings || [];
				const totalPax = bookings.reduce((sum: number, b: any) => sum + (b.group_size || 0), 0);
				return {
					id: t.id,
					date: t.date,
					status: t.status,
					trip_type: t.listing_templates?.trip_type || 'N/A',
					location: t.listing_templates?.location || 'N/A',
					captain_name: t.captains?.name || 'Unassigned',
					charter_name: t.captains?.charter_name || 'N/A',
					passenger_count: totalPax,
					groups_count: bookings.length,
					created_at: t.created_at ? new Date(t.created_at).toLocaleString() : ''
				};
			});
			break;
		}
		case 'customers': {
			let q = supabase
				.from('customers')
				.select('id, name, email, phone, sms_opt_in, city, state, how_heard, strike_count, flagged, created_at')
				.order('created_at', { ascending: false })
				.limit(limit);

			if (params.search && params.search.trim()) {
				const term = `%${params.search.trim()}%`;
				q = q.or(`name.ilike.${term},email.ilike.${term},phone.ilike.${term}`);
			}

			const { data } = await q;
			rows = (data || []).map((c: any) => ({
				id: c.id,
				name: c.name,
				email: c.email,
				phone: c.phone,
				sms_opt_in: c.sms_opt_in ? 'Yes' : 'No',
				city: c.city || '',
				state: c.state || '',
				how_heard: c.how_heard || '',
				strike_count: c.strike_count || 0,
				flagged: c.flagged ? 'Yes' : 'No',
				created_at: c.created_at ? new Date(c.created_at).toLocaleDateString() : ''
			}));
			break;
		}
		case 'captains': {
			let q = supabase
				.from('captains')
				.select('id, name, charter_name, referral_promo_code, phone, email, active, locations, trip_types, max_passengers')
				.order('name', { ascending: true })
				.limit(limit);

			if (params.statusFilter === 'active') {
				q = q.eq('active', true);
			} else if (params.statusFilter === 'inactive') {
				q = q.eq('active', false);
			}

			const { data } = await q;
			rows = (data || []).map((c: any) => ({
				id: c.id,
				name: c.name,
				charter_name: c.charter_name || 'N/A',
				referral_promo_code: c.referral_promo_code || 'N/A',
				phone: c.phone,
				email: c.email,
				active: c.active ? 'Active' : 'Inactive',
				locations: Array.isArray(c.locations) ? c.locations.join(', ') : '',
				trip_types: Array.isArray(c.trip_types) ? c.trip_types.join(', ') : '',
				max_passengers: c.max_passengers || 6
			}));
			break;
		}
		case 'payments': {
			let q = supabase
				.from('payment_records')
				.select(`
					id,
					stripe_payment_intent_id,
					amount,
					status,
					created_at,
					bookings:booking_id (
						customers (name),
						trip_instances (
							date,
							listing_templates (trip_type)
						)
					)
				`)
				.order('created_at', { ascending: false })
				.limit(limit);

			if (params.statusFilter && params.statusFilter !== 'all') {
				q = q.eq('status', params.statusFilter);
			}

			const { data } = await q;
			rows = (data || []).map((p: any) => ({
				id: p.id,
				created_at: p.created_at ? new Date(p.created_at).toLocaleString() : '',
				stripe_payment_intent_id: p.stripe_payment_intent_id,
				amount: Number(p.amount).toFixed(2),
				status: p.status,
				customer_name: p.bookings?.customers?.name || 'N/A',
				trip_type: p.bookings?.trip_instances?.listing_templates?.trip_type || 'N/A',
				trip_date: p.bookings?.trip_instances?.date || 'N/A'
			}));
			break;
		}
	}

	// Filter by search term if provided
	if (params.search && params.search.trim() && dataset !== 'customers') {
		const term = params.search.toLowerCase().trim();
		rows = rows.filter((r) =>
			Object.values(r).some((val) => String(val).toLowerCase().includes(term))
		);
	}

	const availableFields = DATASET_FIELD_DEFINITIONS[dataset] || [];
	const selectedKeys =
		params.selectedFields && params.selectedFields.length > 0
			? params.selectedFields
			: availableFields.filter((f) => f.defaultSelected).map((f) => f.key);

	return {
		dataset,
		availableFields,
		selectedKeys,
		rows,
		totalCount: rows.length
	};
}
