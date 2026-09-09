import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { MASTER_TEST_CATALOG } from '$lib/testCatalog';

function getAdminClient() {
	return createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

export interface AdminTestItem {
	id: string;
	category: string;
	title: string;
	description: string;
	completed: boolean;
	tested_by: string | null;
	notes: string | null;
	display_order: number;
	created_at: string;
	updated_at: string;
}

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const supabaseAdmin = getAdminClient();

	// 1. Fetch current test items from DB
	const { data: existingItems, error: fetchErr } = await supabaseAdmin
		.from('admin_test_items')
		.select('*')
		.order('display_order', { ascending: true })
		.order('created_at', { ascending: true });

	if (fetchErr) {
		console.error('Error fetching admin test items:', fetchErr);
		throw error(500, 'Failed to load test items from database.');
	}

	// 2. If table is empty, auto-seed with master catalog
	let items: AdminTestItem[] = existingItems || [];

	if (items.length === 0) {
		const seedPayload = MASTER_TEST_CATALOG.map((c) => ({
			id: c.id,
			category: c.category,
			title: c.title,
			description: c.description,
			completed: false,
			tested_by: null,
			notes: null,
			display_order: c.display_order
		}));

		const { data: seeded, error: seedErr } = await supabaseAdmin
			.from('admin_test_items')
			.insert(seedPayload)
			.select('*')
			.order('display_order', { ascending: true });

		if (seedErr) {
			console.error('Error auto-seeding admin test items:', seedErr);
		} else if (seeded) {
			items = seeded;
		}
	}

	// Collect unique categories in insertion order
	const categories = Array.from(new Set(items.map((i) => i.category)));

	return {
		items,
		categories
	};
};

export const actions: Actions = {
	toggleItem: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const completed = formData.get('completed') === 'true';
		const tester = (formData.get('tested_by') as string)?.trim() || null;

		if (!id) {
			return fail(400, { message: 'Item ID is required.' });
		}

		const supabaseAdmin = getAdminClient();
		const updateData: Record<string, any> = {
			completed,
			updated_at: new Date().toISOString()
		};

		if (completed && tester) {
			updateData.tested_by = tester;
		}

		const { error: updateErr } = await supabaseAdmin
			.from('admin_test_items')
			.update(updateData)
			.eq('id', id);

		if (updateErr) {
			console.error('Error toggling test item:', updateErr);
			return fail(500, { message: 'Failed to update item status.' });
		}

		return { success: true };
	},

	setTester: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const tester = (formData.get('tested_by') as string)?.trim() || null;

		if (!id) {
			return fail(400, { message: 'Item ID is required.' });
		}

		const supabaseAdmin = getAdminClient();
		const { error: updateErr } = await supabaseAdmin
			.from('admin_test_items')
			.update({
				tested_by: tester,
				updated_at: new Date().toISOString()
			})
			.eq('id', id);

		if (updateErr) {
			console.error('Error updating tester:', updateErr);
			return fail(500, { message: 'Failed to assign tester.' });
		}

		return { success: true };
	},

	saveNotes: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const notes = (formData.get('notes') as string)?.trim() || null;

		if (!id) {
			return fail(400, { message: 'Item ID is required.' });
		}

		const supabaseAdmin = getAdminClient();
		const { error: updateErr } = await supabaseAdmin
			.from('admin_test_items')
			.update({
				notes,
				updated_at: new Date().toISOString()
			})
			.eq('id', id);

		if (updateErr) {
			console.error('Error saving notes:', updateErr);
			return fail(500, { message: 'Failed to save notes.' });
		}

		return { success: true };
	},

	addCustomItem: async ({ request }) => {
		const formData = await request.formData();
		const category = (formData.get('category') as string)?.trim();
		const title = (formData.get('title') as string)?.trim();
		const description = (formData.get('description') as string)?.trim();

		if (!category || !title || !description) {
			return fail(400, { message: 'Category, Title, and Description are required.' });
		}

		const supabaseAdmin = getAdminClient();
		const customId = `custom-${Date.now()}`;

		// Get max display order
		const { data: latest } = await supabaseAdmin
			.from('admin_test_items')
			.select('display_order')
			.order('display_order', { ascending: false })
			.limit(1)
			.maybeSingle();

		const nextOrder = (latest?.display_order || 800) + 10;

		const { error: insertErr } = await supabaseAdmin
			.from('admin_test_items')
			.insert({
				id: customId,
				category,
				title,
				description,
				completed: false,
				tested_by: null,
				notes: null,
				display_order: nextOrder
			});

		if (insertErr) {
			console.error('Error adding custom test item:', insertErr);
			return fail(500, { message: 'Failed to add custom test item.' });
		}

		return { success: true };
	},

	deleteItem: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) {
			return fail(400, { message: 'Item ID is required.' });
		}

		const supabaseAdmin = getAdminClient();
		const { error: delErr } = await supabaseAdmin
			.from('admin_test_items')
			.delete()
			.eq('id', id);

		if (delErr) {
			console.error('Error deleting test item:', delErr);
			return fail(500, { message: 'Failed to delete test item.' });
		}

		return { success: true };
	},

	resetToDefaults: async () => {
		const supabaseAdmin = getAdminClient();

		// Delete all existing items
		const { error: delErr } = await supabaseAdmin
			.from('admin_test_items')
			.delete()
			.neq('id', 'DO_NOT_MATCH_ANYTHING');

		if (delErr) {
			console.error('Error clearing test items for reset:', delErr);
			return fail(500, { message: 'Failed to reset test items.' });
		}

		// Re-seed from master catalog
		const seedPayload = MASTER_TEST_CATALOG.map((c) => ({
			id: c.id,
			category: c.category,
			title: c.title,
			description: c.description,
			completed: false,
			tested_by: null,
			notes: null,
			display_order: c.display_order
		}));

		const { error: seedErr } = await supabaseAdmin
			.from('admin_test_items')
			.insert(seedPayload);

		if (seedErr) {
			console.error('Error re-seeding test items:', seedErr);
			return fail(500, { message: 'Failed to restore master test list.' });
		}

		return { success: true };
	},

	clearAllStatus: async () => {
		const supabaseAdmin = getAdminClient();

		const { error: updateErr } = await supabaseAdmin
			.from('admin_test_items')
			.update({
				completed: false,
				tested_by: null,
				notes: null,
				updated_at: new Date().toISOString()
			})
			.neq('id', 'DO_NOT_MATCH_ANYTHING');

		if (updateErr) {
			console.error('Error clearing test status:', updateErr);
			return fail(500, { message: 'Failed to clear test checkmarks.' });
		}

		return { success: true };
	}
};
