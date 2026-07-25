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

	.hero {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		max-width: 650px;
		padding-bottom: 5rem;
		padding-top: 2rem;
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
	}

	@media (max-width: 640px) {
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
