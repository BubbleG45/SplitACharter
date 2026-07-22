<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let { data, children } = $props();
	let sidebarOpen = $state(false);
	let isCondensed = $state(false);

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}

	function toggleCondensed() {
		isCondensed = !isCondensed;
	}

	async function handleSignOut() {
		const { error } = await data.supabase.auth.signOut();
		if (!error) {
			goto('/login');
		} else {
			console.error('Sign out error:', error);
		}
	}

	const navItems = [
		{ name: 'Dashboard', path: '/admin', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z' },
		{ name: 'Available Charters', path: '/browse', icon: 'M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
		{ name: 'Listing Templates', path: '/admin/listings', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
		{ name: 'Trips & Bookings', path: '/admin/trips', icon: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124l-.09-1.443m-1.443-4.5a2.25 2.25 0 00-2.25-2.25H4.833t-2.25 2.25m13.5 0H4.833M15 9.75a2.25 2.25 0 00-2.25-2.25H4.833' },
		{ name: 'Captains', path: '/admin/captains', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
		{ name: 'Customers', path: '/admin/customers', icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z' },
		{ name: 'Payments Ledger', path: '/admin/payments', icon: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
		{ name: 'Settings', path: '/admin/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z' }
	];
</script>

<div class="admin-wrapper">
	<!-- Background Blur Elements -->
	<div class="bg-blur bg-blur-1"></div>
	<div class="bg-blur bg-blur-2"></div>

	<!-- Mobile Header -->
	<header class="mobile-header glass">
		<button class="menu-toggle" onclick={toggleSidebar} aria-label="Toggle Navigation">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
				<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
			</svg>
		</button>
		<span class="logo">SplitACharter <span class="badge">Admin</span></span>
		<div class="user-avatar" title={data.user?.email}>
			{data.user?.email?.charAt(0).toUpperCase()}
		</div>
	</header>

	<!-- Sidebar -->
	<aside class="admin-sidebar glass {sidebarOpen ? 'sidebar-open' : ''} {isCondensed ? 'sidebar-condensed' : ''}">
		<div class="sidebar-header">
			<span class="logo">
				{#if isCondensed}
					<span class="logo-short" title="SplitACharter Admin">SAC</span>
				{:else}
					SplitACharter <span class="badge">Admin</span>
				{/if}
			</span>
			<button class="collapse-btn" onclick={toggleCondensed} title={isCondensed ? "Expand Navigation Menu" : "Collapse Navigation Menu"} aria-label="Toggle Condensed Mode">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
					<path stroke-linecap="round" stroke-linejoin="round" d={isCondensed ? "M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" : "M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5"} />
				</svg>
			</button>
			<button class="menu-close-mobile" onclick={toggleSidebar} aria-label="Close menu">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<nav class="sidebar-nav">
			{#each navItems as item}
				{@const isActive = $page.url.pathname === item.path || ($page.url.pathname.startsWith(item.path) && item.path !== '/admin')}
				<a href={item.path} class="nav-link {isActive ? 'active' : ''}" title={isCondensed ? item.name : ''} onclick={() => sidebarOpen = false}>
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="nav-icon">
						<path stroke-linecap="round" stroke-linejoin="round" d={item.icon} />
					</svg>
					{#if !isCondensed}
						<span class="nav-text">{item.name}</span>
					{/if}
				</a>
			{/each}
		</nav>

		<div class="sidebar-footer">
			<div class="user-profile">
				<div class="avatar" title={data.user?.email}>{data.user?.email?.charAt(0).toUpperCase()}</div>
				{#if !isCondensed}
					<div class="info">
						<span class="user-name">Administrator</span>
						<span class="user-email" title={data.user?.email}>{data.user?.email}</span>
					</div>
				{/if}
			</div>
			<button class="btn-signout" onclick={handleSignOut} title={isCondensed ? "Sign Out" : ""}>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
				</svg>
				{#if !isCondensed}
					<span>Sign Out</span>
				{/if}
			</button>
		</div>
	</aside>

	<!-- Main Content -->
	<main class="admin-main {isCondensed ? 'main-condensed' : ''}">
		<div class="main-content-container">
			{@render children()}
		</div>
	</main>
</div>

<style>
	.admin-wrapper {
		display: flex;
		min-height: 100vh;
		position: relative;
		overflow: hidden;
		background: #060913;
	}

	/* Glowing decorative blobs */
	.bg-blur {
		position: absolute;
		border-radius: 50%;
		filter: blur(150px);
		z-index: 1;
		pointer-events: none;
		opacity: 0.15;
	}
	.bg-blur-1 {
		background: var(--primary);
		width: 400px;
		height: 400px;
		top: -10%;
		right: 10%;
	}
	.bg-blur-2 {
		background: var(--secondary);
		width: 500px;
		height: 500px;
		bottom: -10%;
		left: -5%;
	}

	/* Mobile Header */
	.mobile-header {
		display: none;
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 60px;
		z-index: 50;
		align-items: center;
		padding: 0 1.5rem;
		justify-content: space-between;
		border-radius: 0;
		border-bottom: 1px solid var(--border-light);
	}
	.menu-toggle {
		background: transparent;
		color: var(--text-primary);
		border: none;
		padding: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.user-avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--primary), var(--secondary));
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 0.9rem;
	}

	/* Sidebar */
	.admin-sidebar {
		width: 280px;
		height: 100vh;
		display: flex;
		flex-direction: column;
		position: fixed;
		top: 0;
		left: 0;
		z-index: 100;
		border-radius: 0;
		border-right: 1px solid var(--border-light);
		border-top: none;
		border-bottom: none;
		border-left: none;
		transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
	}
	.admin-sidebar.sidebar-condensed {
		width: 80px;
	}

	.sidebar-header {
		padding: 2rem 1.5rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.sidebar-condensed .sidebar-header {
		padding: 1.5rem 0.5rem;
		flex-direction: column;
		gap: 0.75rem;
		justify-content: center;
	}
	.logo {
		font-family: var(--font-heading);
		font-weight: 800;
		font-size: 1.25rem;
		color: var(--text-primary);
		letter-spacing: -0.5px;
	}
	.logo-short {
		font-family: var(--font-heading);
		font-weight: 800;
		font-size: 1.4rem;
		color: var(--primary);
	}
	.badge {
		font-size: 0.7rem;
		padding: 2px 6px;
		border-radius: 4px;
		background: rgba(6, 182, 212, 0.15);
		color: var(--primary);
		border: 1px solid rgba(6, 182, 212, 0.25);
		font-weight: 600;
		margin-left: 4px;
		vertical-align: middle;
	}
	.collapse-btn {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid var(--border-light);
		color: var(--text-secondary);
		width: 32px;
		height: 32px;
		border-radius: 6px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
		padding: 0;
		flex-shrink: 0;
	}
	.collapse-btn:hover {
		background: rgba(6, 182, 212, 0.15);
		color: var(--primary);
		border-color: var(--primary);
	}

	.menu-close-mobile {
		display: none;
		background: transparent;
		color: var(--text-primary);
		border: none;
	}

	.sidebar-nav {
		flex: 1;
		padding: 1rem 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.nav-link {
		display: flex;
		align-items: center;
		gap: 0.85rem;
		padding: 0.85rem 1rem;
		color: var(--text-secondary);
		text-decoration: none;
		border-radius: 8px;
		font-weight: 500;
		font-size: 0.95rem;
		transition: all 0.2s ease;
	}
	.nav-link:hover {
		color: var(--text-primary);
		background: rgba(255, 255, 255, 0.04);
	}
	.nav-link.active {
		color: var(--text-primary);
		background: linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(99, 102, 241, 0.1));
		border: 1px solid rgba(6, 182, 212, 0.2);
	}
	.nav-icon {
		width: 20px;
		height: 20px;
		transition: transform 0.2s ease;
	}
	.nav-link:hover .nav-icon {
		transform: translateX(2px);
	}
	.nav-link.active .nav-icon {
		color: var(--primary);
	}

	.sidebar-footer {
		padding: 1.5rem;
		border-top: 1px solid var(--border-light);
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.user-profile {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--primary), var(--secondary));
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 1.1rem;
		border: 2px solid rgba(255, 255, 255, 0.1);
	}
	.info {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.user-name {
		font-weight: 600;
		font-size: 0.9rem;
	}
	.user-email {
		font-size: 0.75rem;
		color: var(--text-muted);
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
	}
	.btn-signout {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		background: rgba(239, 68, 68, 0.1);
		color: var(--danger);
		border: 1px solid rgba(239, 68, 68, 0.15);
		padding: 0.65rem;
		font-size: 0.9rem;
	}
	.btn-signout:hover {
		background: var(--danger);
		color: white;
		box-shadow: 0 4px 15px rgba(239, 68, 68, 0.2);
	}

	/* Main Content Area */
	.admin-main {
		flex: 1;
		margin-left: 280px !important;
		width: calc(100% - 280px) !important;
		padding: 2.5rem;
		position: relative;
		z-index: 2;
		overflow-y: auto;
		height: 100vh;
		transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}
	.admin-main.main-condensed {
		margin-left: 80px !important;
		width: calc(100% - 80px) !important;
	}
	.main-content-container {
		max-width: 1400px;
		margin: 0 auto;
		width: 100%;
		transition: max-width 0.3s ease;
	}
	.admin-main.main-condensed .main-content-container {
		max-width: 100% !important;
	}

	/* Responsive design */
	@media (max-width: 992px) {
		.mobile-header {
			display: flex;
		}
		.admin-sidebar {
			transform: translateX(-100%);
			transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		}
		.admin-sidebar.sidebar-open {
			transform: translateX(0);
		}
		.menu-close-mobile {
			display: block;
		}
		.admin-main {
			margin-left: 0;
			padding: 5.5rem 1.5rem 2rem 1.5rem;
			height: calc(100vh - 60px);
			margin-top: 60px;
		}
	}
</style>
