import { serve } from 'inngest/sveltekit';
import { inngest } from '$lib/inngest/client';
import { functions } from '$lib/inngest/functions';

// Create SvelteKit serve handler for Inngest background functions
const handler = serve({
	client: inngest,
	functions
});

export const GET = handler;
export const POST = handler;
export const PUT = handler;
