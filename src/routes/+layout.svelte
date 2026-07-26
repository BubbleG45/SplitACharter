<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import { page } from '$app/state';
	import Header from '$lib/components/Header.svelte';
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';

	let { data, children } = $props();

	let isAdminRoute = $derived(page.url.pathname.startsWith('/admin'));

	onMount(() => {
		const {
			data: { subscription }
		} = data.supabase.auth.onAuthStateChange((event, _session) => {
			if (_session?.expires_at !== data.session?.expires_at) {
				invalidate('supabase:auth');
			}
		});

		// Developer Console SMS logger
		let printedLogs = new Set<string>();
		try {
			const stored = sessionStorage.getItem('printed_sms_logs');
			if (stored) {
				printedLogs = new Set(JSON.parse(stored));
			}
		} catch (e) {}

		let intervalId: any;

		async function pollSmsLogs() {
			try {
				const response = await fetch('/api/debug/mock-sms-logs');
				if (response.ok) {
					const { logs } = await response.json();
					if (logs && Array.isArray(logs)) {
						let updated = false;
						// Sort ascending by timestamp so they print in chronological order
						const sortedLogs = [...logs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
						for (const log of sortedLogs) {
							if (!printedLogs.has(log.id)) {
								printedLogs.add(log.id);
								updated = true;
								console.log(`%c[MOCK SMS] To: ${log.recipient}\nText: ${log.content}`, 'color: #06b6d4; font-weight: bold; font-size: 11px; padding: 6px; border: 1px dashed #06b6d4; border-radius: 4px; background: rgba(6, 182, 212, 0.05);');
							}
						}
						if (updated) {
							sessionStorage.setItem('printed_sms_logs', JSON.stringify(Array.from(printedLogs)));
						}
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
	<meta property="og:site_name" content="SplitACharter" />
	<meta property="og:type" content="website" />
	<meta property="og:image" content="{origin}/og-image.png" />
	<meta property="og:image:type" content="image/png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:image" content="{origin}/og-image.png" />
</svelte:head>

{#if !isAdminRoute}
	<Header session={data.session} isAdmin={data.isAdmin} />
{/if}

{@render children()}
