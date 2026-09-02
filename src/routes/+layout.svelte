<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import { page } from '$app/state';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';


	let { data, children } = $props();

	let isAdminRoute = $derived(page.url.pathname.startsWith('/admin'));
	let origin = $derived(page.url.origin || '');

	onMount(() => {
		const {
			data: { subscription }
		} = data.supabase.auth.onAuthStateChange((event, _session) => {
			if (
				event === 'SIGNED_IN' ||
				event === 'SIGNED_OUT' ||
				event === 'USER_UPDATED' ||
				event === 'TOKEN_REFRESHED' ||
				_session?.expires_at !== data.session?.expires_at
			) {
				invalidate('supabase:auth');
			}
		});

		return () => {
			subscription.unsubscribe();
		};
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta property="og:site_name" content="SplitACharter" />
	<meta property="og:type" content="website" />
	<meta property="og:image" content="{origin}/og-banner.png" />
	<meta property="og:image:type" content="image/png" />
	<meta property="og:image:width" content="2390" />
	<meta property="og:image:height" content="1792" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:image" content="{origin}/og-banner.png" />
</svelte:head>

{#if !isAdminRoute}
	<Header session={data.session} isAdmin={data.isAdmin} />
{/if}

{@render children()}

{#if !isAdminRoute}
	<Footer />
{/if}

