<script lang="ts">
	import logoWhite from '$lib/assets/logo-white.svg';
	let { data } = $props();
</script>

<svelte:head>
	<title>SplitACharter — Shared Private Boat Charters</title>
</svelte:head>

<div class="landing-wrapper">
	<!-- Background Blur Elements -->
	<div class="bg-blur bg-blur-1"></div>
	<div class="bg-blur bg-blur-2"></div>

	<main class="landing-main">
		<header class="landing-header">
			<a href="/" class="logo-link">
				<img src={logoWhite} alt="SplitACharter Logo" class="header-logo" />
			</a>
			<nav class="nav-links">
				<a href="/how-it-works" class="nav-link-custom">How It Works</a>
				<a href="/browse" class="nav-link-custom">Browse Charters</a>
				{#if data.session}
					{#if data.isAdmin}
						<a href="/admin" class="nav-link-custom">Admin Dashboard</a>
					{:else}
						<a href="/dashboard" class="nav-link-custom">My Dashboard</a>
					{/if}
					<form action="/login?/signOut" method="POST" style="display: inline;">
						<button type="submit" class="nav-link-custom" style="cursor: pointer; background: none; border: 1px solid var(--border-light);">Sign Out</button>
					</form>
				{:else}
					<a href="/login" class="nav-btn-primary">Sign In</a>
				{/if}
			</nav>
		</header>

		<section class="hero">
			<h1>You came all the way to the Keys.<br/><span class="highlight">Get on the water.</span></h1>
			<p class="hero-desc">
				SplitACharter matches two small groups on the same private charter. Each pays half. No party boats. No crowds. Just you, one other group, and open water.
			</p>
			<div class="hero-actions">
				{#if data.session}
					{#if data.isAdmin}
						<a href="/admin" class="btn btn-primary btn-large">Go to Operations Admin</a>
						<a href="/browse" class="btn btn-secondary btn-large">Browse Charters</a>
					{:else}
						<a href="/browse" class="btn btn-primary btn-large">Browse Charters</a>
						<a href="/dashboard" class="btn btn-secondary btn-large">My Dashboard</a>
					{/if}
				{:else}
					<a href="/login" class="btn btn-primary btn-large font-bold">Sign In to Platform</a>
					<a href="/browse" class="btn btn-secondary btn-large">Browse Charters</a>
				{/if}
			</div>
		</section>
	</main>
</div>

<style>
	.landing-wrapper {
		display: flex;
		flex-direction: column;
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
		width: 500px;
		height: 500px;
		top: -10%;
		right: 5%;
	}
	.bg-blur-2 {
		background: var(--secondary);
		width: 500px;
		height: 500px;
		bottom: -10%;
		left: 5%;
	}

	.landing-main {
		flex: 1;
		display: flex;
		flex-direction: column;
		max-width: 1200px;
		margin: 0 auto;
		width: 100%;
		padding: 2rem;
		z-index: 2;
	}

	.landing-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 5rem;
	}
	.logo-link {
		display: block;
		transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
	}
	.logo-link:hover {
		transform: scale(1.02);
	}
	.header-logo {
		height: 96px;
		display: block;
	}
	.nav-links {
		display: flex;
		align-items: center;
		gap: 1.5rem;
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
	.nav-link-custom:hover {
		color: var(--text-primary);
		background: rgba(255, 255, 255, 0.06);
		border-color: rgba(255, 255, 255, 0.2);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(255, 255, 255, 0.05);
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

	.hero {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		max-width: 650px;
		padding-bottom: 5rem;
	}
	.hero h1 {
		font-size: 3.5rem;
		font-weight: 850;
		line-height: 1.15;
		letter-spacing: -1.5px;
		margin-bottom: 1.5rem;
	}
	.highlight {
		background: linear-gradient(135deg, var(--primary), var(--secondary));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}
	.hero-desc {
		font-size: 1.15rem;
		color: var(--text-secondary);
		line-height: 1.6;
		margin-bottom: 2.5rem;
	}
	.hero-actions {
		display: flex;
		gap: 1rem;
		align-items: center;
	}
	.btn-large {
		padding: 14px 28px;
		font-size: 1rem;
	}
	.font-bold {
		font-weight: 700;
	}

	@media (max-width: 768px) {
		.hero h1 {
			font-size: 2.5rem;
		}
		.landing-header {
			margin-bottom: 3rem;
		}
	}

	@media (max-width: 640px) {
		.landing-header {
			flex-direction: column;
			gap: 1rem;
			margin-bottom: 2.5rem;
			align-items: center;
		}
		.header-logo {
			height: 56px;
		}
		.nav-links {
			flex-wrap: wrap;
			justify-content: center;
			gap: 0.75rem;
		}
		.nav-link-custom {
			padding: 6px 12px;
			font-size: 0.85rem;
		}
		.nav-btn-primary {
			padding: 6px 14px;
			font-size: 0.85rem;
		}
		.hero-actions {
			flex-direction: column;
			align-items: stretch;
			width: 100%;
		}
		.btn-large {
			text-align: center;
		}
	}
</style>
