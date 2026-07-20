<script lang="ts">
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
			<span class="logo-text">SplitACharter</span>
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
			<span class="badge">Phase 1 Release</span>
			<h1>Share a Boat Charter.<br/><span class="highlight">Pay Half the Price.</span></h1>
			<p class="hero-desc">
				SplitACharter connects small groups who want to share a private boat charter. 
				Each group pays exactly half. No login passwords, just smooth sailing.
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
	.logo-text {
		font-family: var(--font-heading);
		font-weight: 800;
		font-size: 1.5rem;
		background: linear-gradient(135deg, var(--primary), var(--secondary));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		letter-spacing: -0.5px;
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
	.badge {
		background: rgba(6, 182, 212, 0.12);
		color: var(--primary);
		border: 1px solid rgba(6, 182, 212, 0.25);
		padding: 6px 14px;
		border-radius: 20px;
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 1px;
		align-self: flex-start;
		margin-bottom: 1.5rem;
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
