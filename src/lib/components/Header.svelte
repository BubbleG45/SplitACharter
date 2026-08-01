<script lang="ts">
	import logoWhite from '$lib/assets/logo-white.svg';
	import logoDark from '$lib/assets/logo.svg';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { page } from '$app/state';

	let { session, isAdmin } = $props<{
		session: any;
		isAdmin: boolean;
	}>();

	let currentPath = $derived(page.url.pathname);
</script>

<header class="site-header">
	<div class="header-container">
		<a href="/" class="logo-link">
			<img src={logoWhite} alt="SplitACharter Logo" class="header-logo logo-dark-theme" />
			<img src={logoDark} alt="SplitACharter Logo" class="header-logo logo-light-theme" />
		</a>
		<nav class="nav-links">
			<a href="/how-it-works" class="nav-link-custom" class:active={currentPath === '/how-it-works'}>How It Works</a>
			<a href="/browse" class="nav-link-custom" class:active={currentPath.startsWith('/browse')}>Browse Charters</a>
			{#if session}
				{#if isAdmin}
					<a href="/admin" class="nav-link-custom" class:active={currentPath.startsWith('/admin')}>Admin Dashboard</a>
				{:else}
					<a href="/dashboard" class="nav-link-custom" class:active={currentPath === '/dashboard'}>My Dashboard</a>
				{/if}
				<form action="/login?/signOut" method="POST" style="display: inline;">
					<button type="submit" class="nav-link-custom btn-signout-nav">Sign Out</button>
				</form>
			{:else}
				<a href="/login" class="nav-btn-primary">Sign In</a>
			{/if}
			<ThemeToggle />
		</nav>
	</div>
</header>

<style>
	.site-header {
		width: 100%;
		background: transparent;
		position: relative;
		z-index: 100;
	}
	.header-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 1.5rem 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
	}
	.logo-link {
		display: block;
		transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
	}
	.logo-link:hover {
		transform: scale(1.02);
	}
	.header-logo {
		height: 72px;
		display: block;
	}
	:root[data-theme="light"] .logo-dark-theme {
		display: none !important;
	}
	:root[data-theme="light"] .logo-light-theme {
		display: block !important;
	}
	:root[data-theme="dark"] .logo-dark-theme,
	:root:not([data-theme]) .logo-dark-theme {
		display: block !important;
	}
	:root[data-theme="dark"] .logo-light-theme,
	:root:not([data-theme]) .logo-light-theme {
		display: none !important;
	}
	.nav-links {
		display: flex;
		align-items: center;
		gap: 1.25rem;
	}
	.nav-link-custom {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text-secondary);
		text-decoration: none;
		padding: 8px 18px;
		border-radius: 20px;
		transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid var(--border-light);
	}
	.nav-link-custom:hover,
	.nav-link-custom.active {
		color: var(--text-primary);
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.25);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(255, 255, 255, 0.05);
	}
	.btn-signout-nav {
		cursor: pointer;
		background: none;
		border: 1px solid var(--border-light);
	}
	.btn-signout-nav:hover {
		background: rgba(239, 68, 68, 0.15) !important;
		border-color: rgba(239, 68, 68, 0.3) !important;
		color: #fca5a5 !important;
	}
	.nav-btn-primary {
		background: linear-gradient(135deg, var(--primary), var(--secondary));
		color: #ffffff !important;
		font-weight: 700;
		padding: 8px 20px;
		border-radius: 20px;
		border: none;
		box-shadow: 0 4px 15px rgba(6, 182, 212, 0.25);
		transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		text-decoration: none;
		font-size: 0.9rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}
	.nav-btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(6, 182, 212, 0.45);
	}

	@media (max-width: 768px) {
		.header-container {
			flex-direction: column;
			gap: 1.25rem;
			padding: 1.25rem 1rem;
		}
		.header-logo {
			height: 56px;
		}
		.nav-links {
			flex-wrap: wrap;
			justify-content: center;
			gap: 0.75rem;
		}
		.nav-link-custom,
		.nav-btn-primary {
			padding: 6px 14px;
			font-size: 0.85rem;
		}
	}
</style>
