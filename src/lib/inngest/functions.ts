import { inngest } from './client';

// A simple hello world background function to verify the end-to-end integration
export const helloWorld = inngest.createFunction(
	{
		id: 'hello-world',
		name: 'Hello World',
		triggers: [{ event: 'test/hello.world' }]
	},
	async ({ event, step }) => {
		const result = await step.run('log-message', () => {
			console.log('Hello, Inngest! Event received:', event);
			return { message: `Hello World! Event '${event.name}' successfully processed.` };
		});

		return result;
	}
);

// Export all functions as an array for the serve handler
export const functions = [helloWorld];
