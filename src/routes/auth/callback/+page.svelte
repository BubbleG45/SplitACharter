<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let { data } = $props();

	onMount(() => {
		// Listen for session and handle client-side redirect once logged in
		const {
			data: { subscription }
		} = data.supabase.auth.onAuthStateChange(async (event, session) => {
			if (session) {
				const next = page.url.searchParams.get('next') ?? '/';
				// Wait a brief moment to allow cookies to settle, then redirect
				setTimeout(() => {
					goto(next, { replaceState: true });
				}, 150);
			} else {
				// If there's no session and no access token in the hash, redirect to login
				if (!window.location.hash.includes('access_token')) {
					goto('/login?error=auth-failed', { replaceState: true });
				}
			}
		});

		// Timeout as a fallback to redirect to login if session isn't resolved in 10 seconds
		const fallbackTimeout = setTimeout(() => {
			if (!data.session) {
				goto('/login?error=timeout', { replaceState: true });
			}
		}, 10000);

		return () => {
			subscription.unsubscribe();
			clearTimeout(fallbackTimeout);
		};
	});
</script>

<div class="min-h-screen bg-[#060913] flex flex-col items-center justify-center text-slate-300">
	<div class="flex flex-col items-center space-y-4">
		<!-- Dynamic, sleek modern spinner matching the SplitACharter style -->
		<div class="relative w-16 h-16">
			<div class="absolute inset-0 rounded-full border-4 border-slate-800"></div>
			<div class="absolute inset-0 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin"></div>
		</div>
		<div class="text-center space-y-1">
			<h2 class="text-xl font-semibold tracking-wide text-white">Completing Sign In</h2>
			<p class="text-sm text-slate-400">Verifying your secure session...</p>
		</div>
	</div>
</div>
