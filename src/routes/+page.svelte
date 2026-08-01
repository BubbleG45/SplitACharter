<script lang="ts">
	let { data }: { data: any } = $props();

	const defaultReviews = [
		{
			name: 'Dave & Sarah M.',
			location: 'Miami, FL',
			trip: 'Islamorada Reef Snorkeling',
			stars: 5,
			avatar: 'DS',
			quote: 'Booking a private charter used to be out of our budget for just two people. Splitting it with another couple saved us 50% and we had an incredible day swimming with sea turtles!'
		},
		{
			name: 'Capt. Marcus Vance',
			location: 'Key West, FL',
			trip: 'Deep Sea Mahi Mahi Charter',
			stars: 5,
			avatar: 'MV',
			quote: 'As a local captain, SplitACharter fills my schedule without the headache of managing partial bookings. The passengers matched are always great people.'
		},
		{
			name: 'Elena R.',
			location: 'Tampa, FL',
			trip: 'Sunset Catamaran Cruise',
			stars: 5,
			avatar: 'ER',
			quote: 'We wanted a quiet sunset trip without 40 strangers on a party boat. Matched with another couple celebrating an anniversary — match made in heaven!'
		},
		{
			name: 'Greg & Jason T.',
			location: 'Orlando, FL',
			trip: 'Key Largo Wreck Diving',
			stars: 5,
			avatar: 'GJ',
			quote: 'Got paired with two awesome divers for the Spiegel Grove wreck. Easy booking, quick SMS reconfirmations, and unbelievable value.'
		},
		{
			name: 'Hannah & Chris L.',
			location: 'Atlanta, GA',
			trip: 'Marathon Offshore Fishing',
			stars: 5,
			avatar: 'HC',
			quote: 'Saved over $600 splitting a 6-hour offshore charter. Captain Tony put us right on the tuna. Will definitely use SplitACharter every Keys trip!'
		},
		{
			name: 'Brian K.',
			location: 'Chicago, IL',
			trip: 'Sandbar & Eco Tour',
			stars: 5,
			avatar: 'BK',
			quote: 'Super smooth experience from payment to texting with the captain. No hidden fees or surprises. Best way to get on the water in South Florida.'
		},
		{
			name: 'Jessica P.',
			location: 'Austin, TX',
			trip: 'Tavernier Spearfishing',
			stars: 5,
			avatar: 'JP',
			quote: "I was worried about splitting with strangers, but SplitACharter's group cap makes it feel like your own private crew. Had a total blast!"
		},
		{
			name: 'Michael & Sam B.',
			location: 'Denver, CO',
			trip: 'Key West Offshore Charter',
			stars: 5,
			avatar: 'MS',
			quote: 'We landed 4 blackfin tuna and split the boat 50/50. You get full VIP treatment at half the price of a private charter.'
		},
		{
			name: 'Rachel W.',
			location: 'Nashville, TN',
			trip: 'Islamorada Sunset Cruise',
			stars: 5,
			avatar: 'RW',
			quote: 'The automated text notifications kept us updated every step of the way. Zero friction, total transparency, and memories for a lifetime.'
		},
		{
			name: 'Derek & Tom N.',
			location: 'Fort Lauderdale, FL',
			trip: 'Bahia Honda Reef Dive',
			stars: 5,
			avatar: 'DT',
			quote: 'Found a spot on short notice. Reconfirmed right from my phone and met incredible dive buddies. Highly recommend SplitACharter!'
		}
	];

	const displayReviews = $derived(data.reviews && data.reviews.length > 0 ? data.reviews : defaultReviews);
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
					<a href="/login" class="btn btn-primary btn-large font-bold">Sign In</a>
					<a href="/browse" class="btn btn-secondary btn-large">Browse Charters</a>
				{/if}
			</div>
		</section>

		<!-- Reviews Marquee Section -->
		<section class="reviews-section">
			<div class="reviews-header">
				<span class="badge">Guest & Captain Stories</span>
				<h2>Loved by Adventurers Across the Keys</h2>
				<p>See why groups love splitting private charters with SplitACharter.</p>
			</div>

			<div class="marquee-container">
				<div class="marquee-track">
					{#each [...displayReviews, ...displayReviews] as r}
						<div class="review-card">
							<div class="card-top">
								<div class="author-info">
									<div class="avatar">{r.avatar}</div>
									<div>
										<div class="author-name">{r.name}</div>
										<div class="author-location">{r.location}</div>
									</div>
								</div>
								<div class="stars">
									{#each Array(r.stars) as _}
										<span class="star">★</span>
									{/each}
								</div>
							</div>
							<p class="quote">"{r.quote}"</p>
							<div class="trip-tag">
								<span class="tag-icon">⚓</span> {r.trip}
							</div>
						</div>
					{/each}
				</div>
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
		background: var(--bg-base);
		color: var(--text-primary);
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
		gap: 4rem;
	}

	.hero {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		max-width: 650px;
		padding-bottom: 2rem;
		padding-top: 2rem;
	}
	.hero h1 {
		font-size: 3.5rem;
		font-weight: 850;
		line-height: 1.15;
		letter-spacing: -1.5px;
		margin-bottom: 1.5rem;
		color: var(--text-primary);
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

	/* Reviews Marquee Section */
	.reviews-section {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		padding: 2.5rem;
		background: var(--bg-surface);
		border: 1px solid var(--border-light);
		border-top: 3px solid var(--primary);
		border-radius: 16px;
		box-shadow: var(--glass-shadow);
		margin-bottom: 3rem;
	}

	.reviews-header {
		text-align: center;
		max-width: 600px;
		margin: 0 auto;
	}
	.badge {
		display: inline-block;
		padding: 4px 12px;
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 0.5px;
		text-transform: uppercase;
		background: rgba(6, 182, 212, 0.15);
		color: var(--primary);
		border: 1px solid var(--border-glow);
		border-radius: 20px;
		margin-bottom: 0.75rem;
	}
	.reviews-header h2 {
		font-size: 2rem;
		font-weight: 800;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}
	.reviews-header p {
		color: var(--text-secondary);
		font-size: 1rem;
	}

	.marquee-container {
		width: 100%;
		overflow: hidden;
		position: relative;
		padding: 1rem 0;
		mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
		-webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
	}

	.marquee-track {
		display: flex;
		gap: 1.5rem;
		width: max-content;
		animation: marquee 45s linear infinite;
	}

	.marquee-container:hover .marquee-track {
		animation-play-state: paused;
	}

	@keyframes marquee {
		0% {
			transform: translateX(0%);
		}
		100% {
			transform: translateX(-50%);
		}
	}

	.review-card {
		width: 320px;
		flex-shrink: 0;
		background: var(--glass-bg);
		border: 1px solid var(--border-light);
		border-radius: 12px;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 1rem;
		transition: transform 0.2s ease, border-color 0.2s ease;
	}

	.review-card:hover {
		transform: translateY(-4px);
		border-color: var(--border-glow);
	}

	.card-top {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}

	.author-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--primary), var(--secondary));
		color: #ffffff;
		font-weight: 700;
		font-size: 0.85rem;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.author-name {
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--text-primary);
		line-height: 1.2;
	}

	.author-location {
		font-size: 0.8rem;
		color: var(--text-secondary);
	}

	.stars {
		display: flex;
		gap: 2px;
		color: var(--accent);
		font-size: 0.9rem;
	}

	.quote {
		font-size: 0.9rem;
		line-height: 1.5;
		color: var(--text-secondary);
		font-style: italic;
		flex: 1;
	}

	.trip-tag {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--primary);
		background: rgba(6, 182, 212, 0.1);
		padding: 6px 10px;
		border-radius: 6px;
		align-self: flex-start;
		display: flex;
		align-items: center;
		gap: 4px;
	}

	@media (max-width: 768px) {
		.hero h1 {
			font-size: 2.5rem;
		}
		.reviews-section {
			padding: 1.5rem 1rem;
		}
		.reviews-header h2 {
			font-size: 1.6rem;
		}
		.review-card {
			width: 280px;
			padding: 1.25rem;
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

