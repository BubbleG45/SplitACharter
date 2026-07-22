<script lang="ts">
	import { fade, slide } from 'svelte/transition';
	import { onMount } from 'svelte';

	let activeTab = $state<'groups' | 'captains'>('groups');

	// FAQ structure for Groups/Adventurers
	const groupFaqs = [
		{
			id: "cancellation-policy",
			q: "What is the cancellation and refund policy?",
			a: "If you cancel your booking BEFORE reconfirming your trip slot, you will receive a full automatic refund of your $50 reservation fee. However, if you cancel AFTER you have reconfirmed your trip, the $50 reservation fee becomes non-refundable to protect the second group's booking commitment."
		},
		{
			q: "What is the $50 reservation fee?",
			a: "It is a reservation fee to secure your group's booking and confirm your commitment to sharing the charter. If no second group matches with you before the trip date, this fee is automatically refunded in full."
		},
		{
			q: "How does cost sharing work?",
			a: "SplitACharter lets you book private charters for exactly half the price. Each group pays the $50 reservation fee to SplitACharter. On the day of the trip, each group pays exactly half of the captain's charter rate directly to the captain at the dock."
		},
		{
			q: "What is the reconfirmation window?",
			a: "Once a second group joins your trip, a notification is sent via email and SMS. Both groups must reconfirm their reservation. The window to reconfirm is 24 hours if the trip is > 72 hours away, 12 hours if it is 48–72 hours away, or up to 2 hours if it is less than 24 hours away."
		},
		{
			q: "What happens if one group fails to reconfirm?",
			a: "The group that fails to reconfirm forfeits their $50 reservation fee and receives a penalty strike. The confirming group's $50 fee is held automatically so they can easily book another date, or they can request a full refund from their dashboard."
		},
		{
			q: "What if there is bad weather?",
			a: "If the captain or administrator cancels the trip due to bad weather or safety concerns, both groups receive a full refund of their reservation fee. Weather cancellations are reviewed and handled manually by our support team."
		}
	];

	onMount(() => {
		if (typeof window !== 'undefined' && window.location.hash === '#cancellation-policy') {
			activeTab = 'groups';
			const index = groupFaqs.findIndex(f => f.id === 'cancellation-policy');
			if (index !== -1) {
				openGroupFaq = index;
			}
		}
	});

	// FAQ structure for Captains
	const captainFaqs = [
		{
			q: "How do I register as a captain on SplitACharter?",
			a: "Captains are currently registered and verified manually by our administrator team to ensure all safety credentials, licensing, and vessel requirements are met. Please contact support to initiate your onboarding process."
		},
		{
			q: "How do trip alerts work?",
			a: "When a trip is fully booked and reconfirmed by both customer groups, our system automatically sends an SMS blast to all active, eligible captains in that location. The alert contains the date, time, duration, and vessel requirements."
		},
		{
			q: "How do I claim a booking?",
			a: "Simply reply 'YES' to the SMS alert. The booking is awarded to the very first captain who replies. If another captain has already claimed it, you will receive a friendly text notification letting you know the trip is filled."
		},
		{
			q: "How do I get paid?",
			a: "You are paid directly by the customers on the day of the charter! Each group will pay you exactly 50% of your listed rate using cash or credit card at the dock. SplitACharter does not take any commission from your booking payout."
		},
		{
			q: "What is the policy for cancellation or weather issues?",
			a: "If a matched trip is cancelled by the admin or due to weather, customers are refunded. Captains should report any weather-related cancellations immediately to the admin support team to update the system."
		}
	];

	// State to track open FAQ items
	let openGroupFaq = $state<number | null>(null);
	let openCaptainFaq = $state<number | null>(null);

	function toggleGroupFaq(index: number) {
		openGroupFaq = openGroupFaq === index ? null : index;
	}

	function toggleCaptainFaq(index: number) {
		openCaptainFaq = openCaptainFaq === index ? null : index;
	}
</script>

<svelte:head>
	<title>How It Works — SplitACharter</title>
	<meta name="description" content="Learn how SplitACharter helps you split private boat charters or find jobs as a captain." />
</svelte:head>

<div class="how-it-works-wrapper">
	<!-- Background Blur Elements -->
	<div class="bg-blur bg-blur-1"></div>
	<div class="bg-blur bg-blur-2"></div>

	<main class="how-main">
		<!-- Header -->
		<header class="how-header">
			<a href="/" class="back-link">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
				</svg>
				<span>Back to Home</span>
			</a>
			<h1>How It Works</h1>
			<p class="subtitle">SplitACharter connects groups to share private charters at half the cost, and dispatches captains instantly.</p>
		</header>

		<!-- Toggle Switcher -->
		<div class="tab-container glass">
			<button 
				class="tab-btn" 
				class:active={activeTab === 'groups'} 
				onclick={() => activeTab = 'groups'}
			>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
				</svg>
				For Groups & Adventurers
			</button>
			<button 
				class="tab-btn" 
				class:active={activeTab === 'captains'} 
				onclick={() => activeTab = 'captains'}
			>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1M5.25 6h9.75m-9.75 3.25h9.75m-9.75 3.25h9.75m-9.75 3.25h9.75" />
				</svg>
				For Boat Captains
			</button>
		</div>

		<!-- Dynamic View Mode -->
		{#if activeTab === 'groups'}
			<div in:fade={{ duration: 250 }} class="flow-section">
				<!-- Step cards -->
				<div class="steps-grid">
					<div class="step-card glass">
						<span class="step-number">1</span>
						<h3>Find a Listing</h3>
						<p>Browse our verified private boat charter templates. Filter by location, activity type, or group size. Find a date that fits your calendar.</p>
					</div>

					<div class="step-card glass">
						<span class="step-number">2</span>
						<h3>Reserve Your Half</h3>
						<p>Secure your spot by paying a $50 reservation fee. You'll either be the first group on a charter for your selected date, or join another group that's already looking for a match.</p>
					</div>

					<div class="step-card glass">
						<span class="step-number">3</span>
						<h3>Match & Reconfirm</h3>
						<p>Once a second group joins, we text and email both groups to reconfirm. You must reconfirm within the designated window to avoid losing your spot.</p>
					</div>

					<div class="step-card glass">
						<span class="step-number">4</span>
						<h3>Captain Match & Go</h3>
						<p>As soon as both groups confirm, we dispatch the trip details to local captains. The first to reply YES claims the trip. You pay the captain directly at the dock!</p>
					</div>
				</div>

				<div class="cta-banner glass">
					<h2>Ready to start your adventure?</h2>
					<p>Browse active listings and find a group to split the cost today.</p>
					<a href="/browse" class="btn btn-primary btn-large">Browse Available Charters</a>
				</div>

				<!-- FAQs -->
				<section class="faq-section">
					<h2 class="section-title">Adventurer FAQs</h2>
					<div class="faq-list">
						{#each groupFaqs as faq, i}
							<div class="faq-item glass" id={faq.id || null}>
								<button class="faq-question" onclick={() => toggleGroupFaq(i)}>
									<span>{faq.q}</span>
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4 chevron" class:open={openGroupFaq === i}>
										<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
									</svg>
								</button>
								{#if openGroupFaq === i}
									<div transition:slide={{ duration: 200 }} class="faq-answer">
										<p>{faq.a}</p>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</section>
			</div>
		{:else}
			<div in:fade={{ duration: 250 }} class="flow-section">
				<!-- Step cards for Captains -->
				<div class="steps-grid">
					<div class="step-card glass">
						<span class="step-number">1</span>
						<h3>Get Registered</h3>
						<p>Captains are manually vetted and set up by our operations administrators. We save your vessel details, location, and charter rates in our database.</p>
					</div>

					<div class="step-card glass">
						<span class="step-number">2</span>
						<h3>Receive SMS Alerts</h3>
						<p>When two matching customer groups reconfirm a trip in your area, our system triggers an instant SMS blast to all eligible active captains simultaneously.</p>
					</div>

					<div class="step-card glass">
						<span class="step-number">3</span>
						<h3>Reply YES to Claim</h3>
						<p>The first captain to reply 'YES' to the SMS notification secures the booking. The system immediately confirms your match and notifies the groups.</p>
					</div>

					<div class="step-card glass">
						<span class="step-number">4</span>
						<h3>Get Paid 100% Direct</h3>
						<p>Run the trip and collect 50% of your rate from each group at the dock (cash or card). SplitACharter charges no commissions or booking fees to captains.</p>
					</div>
				</div>

				<div class="cta-banner glass">
					<h2>Want to join our captain network?</h2>
					<p>If you're a licensed commercial captain looking to fill your empty dates, get in touch with us.</p>
					<a href="mailto:info@splitacharter.com?subject=Captain Registration Inquiry" class="btn btn-primary btn-large">Contact Admin to Onboard</a>
				</div>

				<!-- FAQs for Captains -->
				<section class="faq-section">
					<h2 class="section-title">Captain FAQs</h2>
					<div class="faq-list">
						{#each captainFaqs as faq, i}
							<div class="faq-item glass">
								<button class="faq-question" onclick={() => toggleCaptainFaq(i)}>
									<span>{faq.q}</span>
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4 chevron" class:open={openCaptainFaq === i}>
										<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
									</svg>
								</button>
								{#if openCaptainFaq === i}
									<div transition:slide={{ duration: 200 }} class="faq-answer">
										<p>{faq.a}</p>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</section>
			</div>
		{/if}
	</main>
</div>

<style>
	.how-it-works-wrapper {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		position: relative;
		overflow: hidden;
		background: #060913;
		padding-bottom: 5rem;
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

	.how-main {
		flex: 1;
		display: flex;
		flex-direction: column;
		max-width: 1000px;
		margin: 0 auto;
		width: 100%;
		padding: 2rem;
		z-index: 2;
	}

	.how-header {
		margin-bottom: 3rem;
		text-align: center;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		color: var(--text-secondary);
		text-decoration: none;
		font-size: 0.9rem;
		font-weight: 600;
		margin-bottom: 2rem;
		transition: color 0.2s;
	}
	.back-link:hover {
		color: var(--primary);
	}

	.how-header h1 {
		font-size: 3rem;
		font-weight: 850;
		margin-bottom: 1rem;
		background: linear-gradient(135deg, var(--text-primary), var(--text-secondary));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.subtitle {
		color: var(--text-secondary);
		font-size: 1.15rem;
		line-height: 1.6;
		max-width: 700px;
		margin: 0 auto;
	}

	/* Tab Switcher */
	.tab-container {
		display: flex;
		padding: 6px;
		border-radius: 30px;
		max-width: 500px;
		width: 100%;
		margin: 0 auto 3.5rem auto;
		background: rgba(18, 24, 43, 0.6);
		border: 1px solid var(--border-light);
	}

	.tab-btn {
		flex: 1;
		padding: 12px 20px;
		border-radius: 24px;
		background: transparent;
		color: var(--text-secondary);
		font-size: 0.95rem;
		font-weight: 600;
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.tab-btn:hover {
		color: var(--text-primary);
		background: rgba(255, 255, 255, 0.03);
	}

	.tab-btn.active {
		background: linear-gradient(135deg, var(--primary), var(--secondary));
		color: #ffffff;
		box-shadow: 0 4px 15px rgba(6, 182, 212, 0.2);
	}

	.flow-section {
		display: flex;
		flex-direction: column;
		gap: 4rem;
	}

	/* Steps Cards Grid */
	.steps-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1.5rem;
	}

	.step-card {
		padding: 2.5rem 1.75rem;
		display: flex;
		flex-direction: column;
		position: relative;
		border-radius: 16px;
		border: 1px solid var(--border-light);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.step-card:hover {
		transform: translateY(-4px);
		border-color: rgba(6, 182, 212, 0.3);
		box-shadow: 0 12px 30px rgba(6, 182, 212, 0.1);
	}

	.step-number {
		position: absolute;
		top: 1.5rem;
		right: 1.5rem;
		font-size: 2.5rem;
		font-weight: 900;
		font-family: var(--font-heading);
		line-height: 1;
		background: linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(99, 102, 241, 0.15));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.step-card h3 {
		font-size: 1.25rem;
		font-weight: 700;
		margin-bottom: 1rem;
		color: var(--text-primary);
	}

	.step-card p {
		color: var(--text-secondary);
		font-size: 0.95rem;
		line-height: 1.6;
	}

	/* Call to Action Banner */
	.cta-banner {
		padding: 3rem;
		border-radius: 20px;
		text-align: center;
		background: linear-gradient(135deg, rgba(6, 182, 212, 0.04), rgba(99, 102, 241, 0.04));
		border: 1px solid var(--border-glow);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
	}

	.cta-banner h2 {
		font-size: 2rem;
		font-weight: 800;
	}

	.cta-banner p {
		color: var(--text-secondary);
		max-width: 600px;
		font-size: 1.05rem;
	}

	.btn-large {
		padding: 14px 32px;
		font-size: 1rem;
		font-weight: 700;
		text-decoration: none;
	}

	/* FAQ Section */
	.faq-section {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.section-title {
		font-size: 2rem;
		font-weight: 800;
		text-align: center;
		margin-bottom: 1rem;
	}

	.faq-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-width: 800px;
		width: 100%;
		margin: 0 auto;
	}

	.faq-item {
		border-radius: 12px;
		border: 1px solid var(--border-light);
		overflow: hidden;
		transition: border-color 0.2s;
	}

	.faq-item:hover {
		border-color: rgba(6, 182, 212, 0.2);
	}

	.faq-question {
		width: 100%;
		background: transparent;
		padding: 1.25rem 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		text-align: left;
		color: var(--text-primary);
		font-size: 1.1rem;
		font-weight: 600;
		font-family: var(--font-body);
		border: none;
		cursor: pointer;
		gap: 1rem;
	}

	.faq-question:hover {
		background: rgba(255, 255, 255, 0.01);
	}

	.chevron {
		color: var(--text-muted);
		transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		flex-shrink: 0;
	}

	.chevron.open {
		transform: rotate(180deg);
		color: var(--primary);
	}

	.faq-answer {
		padding: 0 1.5rem 1.5rem 1.5rem;
		color: var(--text-secondary);
		font-size: 0.95rem;
		line-height: 1.6;
		border-top: 1px solid rgba(255, 255, 255, 0.03);
		padding-top: 1rem;
	}

	@media (max-width: 768px) {
		.how-header h1 {
			font-size: 2.25rem;
		}
		.cta-banner {
			padding: 2rem 1.5rem;
		}
		.cta-banner h2 {
			font-size: 1.5rem;
		}
	}
</style>
