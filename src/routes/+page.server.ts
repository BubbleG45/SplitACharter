export const load = async ({ locals }: any) => {
	const supabase = locals.supabase;
	const { data: reviews, error } = await supabase
		.from('landing_reviews')
		.select('*')
		.eq('active', true)
		.order('display_order', { ascending: true })
		.order('created_at', { ascending: true });

	if (error) {
		console.warn('Could not fetch landing_reviews table, using defaults:', error.message);
		return { reviews: [] };
	}

	return {
		reviews: reviews || []
	};
};
