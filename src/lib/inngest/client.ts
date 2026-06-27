import { Inngest } from 'inngest';
import { INNGEST_DEV } from '$env/static/private';

// Create a client to send and receive events
export const inngest = new Inngest({
	id: 'split-a-charter',
	isDev: INNGEST_DEV === '1'
});
