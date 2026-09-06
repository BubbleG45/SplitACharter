import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import {
	getDateRangeBounds,
	getPerformanceReport,
	getOperationsReport,
	getCustomersReport,
	getAccountingReport,
	runAdHocQuery,
	type DatePreset
} from '$lib/server/reports';

const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export const load: PageServerLoad = async ({ url, locals }) => {
	const { session } = await locals.safeGetSession();
	if (!session) {
		throw error(401, 'Authentication required');
	}

	const tab = url.searchParams.get('tab') || 'performance';
	const preset = (url.searchParams.get('preset') || 'this_month') as DatePreset;
	const customStart = url.searchParams.get('start') || null;
	const customEnd = url.searchParams.get('end') || null;
	const search = url.searchParams.get('q') || null;

	// Ad-hoc query params
	const adhocDataset = (url.searchParams.get('dataset') || 'bookings') as any;
	const adhocStatus = url.searchParams.get('status') || 'all';
	const adhocLimit = parseInt(url.searchParams.get('limit') || '50', 10);
	const adhocFields = url.searchParams.get('fields')
		? url.searchParams.get('fields')!.split(',').filter(Boolean)
		: undefined;

	const dateBounds = getDateRangeBounds(preset, customStart, customEnd);

	try {
		let performanceData = null;
		let operationsData = null;
		let customersData = null;
		let accountingData = null;
		let adhocData = null;

		if (tab === 'performance') {
			performanceData = await getPerformanceReport(supabaseAdmin, dateBounds);
		} else if (tab === 'operations') {
			operationsData = await getOperationsReport(supabaseAdmin);
		} else if (tab === 'customers') {
			customersData = await getCustomersReport(supabaseAdmin, search);
		} else if (tab === 'accounting') {
			accountingData = await getAccountingReport(supabaseAdmin, dateBounds);
		} else if (tab === 'adhoc') {
			adhocData = await runAdHocQuery(supabaseAdmin, {
				dataset: adhocDataset,
				search: search || undefined,
				statusFilter: adhocStatus,
				selectedFields: adhocFields,
				limit: adhocLimit
			});
		}

		return {
			activeTab: tab,
			dateBounds: {
				preset: dateBounds.preset,
				label: dateBounds.label,
				startIso: dateBounds.startIso,
				endIso: dateBounds.endIso,
				startDateStr: dateBounds.startDate.toISOString().slice(0, 10),
				endDateStr: dateBounds.endDate.toISOString().slice(0, 10)
			},
			searchTerm: search || '',
			performanceData,
			operationsData,
			customersData,
			accountingData,
			adhocData,
			adhocDataset,
			adhocStatus,
			adhocLimit
		};
	} catch (err: any) {
		console.error('Error generating admin reports:', err);
		throw error(500, `Failed to generate report: ${err?.message || err}`);
	}
};
