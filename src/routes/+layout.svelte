<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';

	let { data, children } = $props();

	onMount(() => {
		const {
			data: { subscription }
		} = data.supabase.auth.onAuthStateChange((event, _session) => {
			if (_session?.expires_at !== data.session?.expires_at) {
				invalidate('supabase:auth');
			}
		});

		// Developer Console SMS logger
		const printedLogs = new Set<string>();
		let initialFetch = true;
		let intervalId: any;

		async function pollSmsLogs() {
			try {
				const response = await fetch('/api/debug/mock-sms-logs');
				if (response.ok) {
					const { logs } = await response.json();
					if (logs && Array.isArray(logs)) {
						for (const log of logs) {
							if (!printedLogs.has(log.id)) {
								printedLogs.add(log.id);
								if (!initialFetch) {
									console.log(`%c[MOCK SMS BLAST] To: ${log.recipient}\nText: ${log.content}`, 'color: #06b6d4; font-weight: bold; font-size: 11px; padding: 4px; border: 1px dashed #06b6d4; border-radius: 4px; background: rgba(6, 182, 212, 0.05);');
								}
							}
						}
						initialFetch = false;
					}
				}
			} catch (e) {
				// Suppress polling errors in background
			}
		}

		// Run immediately, then poll
		pollSmsLogs().then(() => {
			intervalId = setInterval(pollSmsLogs, 2000);
		});

		return () => {
			subscription.unsubscribe();
			if (intervalId) clearInterval(intervalId);
		};
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
