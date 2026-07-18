<script lang="ts">
	let { data } = $props();

	/* svelte-ignore state_referenced_locally */
	let selectedDate = $state(data.preselectedDate || '');
	let minDate = $state('');

	// Set minimum date to today
	import { onMount } from 'svelte';
	onMount(() => {
		const today = new Date();
		const yyyy = today.getFullYear();
		const mm = String(today.getMonth() + 1).padStart(2, '0');
		const dd = String(today.getDate()).padStart(2, '0');
		minDate = `${yyyy}-${mm}-${dd}`;
	});

	// Find if there is an existing trip instance on the selected date
	let matchedInstance = $derived(
		selectedDate
			? data.tripInstances.find((trip) => trip.date === selectedDate)
			: null
	);

	function formatDuration(intervalStr: string | any) {
		if (typeof intervalStr === 'string') {
			const parts = intervalStr.split(':');
			if (parts.length >= 2) {
				const hours = parseInt(parts[0], 10);
				const minutes = parseInt(parts[1], 10);
				let result = '';
				if (hours > 0) result += `${hours} hr `;
				if (minutes > 0) result += `${minutes} min`;
				return result.trim();
			}
			return intervalStr;
		}
		if (intervalStr && typeof intervalStr === 'object') {
			let result = '';
			if (intervalStr.hours) result += `${intervalStr.hours} hr `;
			if (intervalStr.minutes) result += `${intervalStr.minutes} min`;
			return result.trim() || 'N/A';
		}
		return 'N/A';
	}
</script>

<svelte:head>
	<title>{data.listing.trip_type} — Details</title>
</svelte:head>

<div class="detail-wrapper">
	<div class="bg-blur bg-blur-1"></div>
	<div class="bg-blur bg-blur-2"></div>

	<div class="detail-container">
		<header class="detail-header">
			<a href="/browse" class="back-link">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
				</svg>
				<span>Back to Browse</span>
			</a>
			<h1>{data.listing.trip_type}</h1>
			<p class="location">{data.listing.location}</p>
		</header>

		<div class="detail-grid">
			<!-- Left side: Details and Description -->
			<div class="details-panel glass">
				<section class="section">
					<h2>Trip Description</h2>
					<p class="description">{data.listing.description}</p>
				</section>

				<div class="specs-grid">
					<div class="spec-item">
						<span class="spec-label">Duration</span>
						<span class="spec-value">{formatDuration(data.listing.duration)}</span>
					</div>
					<div class="spec-item">
						<span class="spec-label">Max Capacity</span>
						<span class="spec-value">{data.listing.max_passengers} Passengers</span>
					</div>
					<div class="spec-item">
						<span class="spec-label">Meeting Area</span>
						<span class="spec-value">{data.listing.meeting_area}</span>
					</div>
				</div>

				<div class="lists-section">
					<div class="list-column">
						<h3>What's Included</h3>
						{#if data.listing.whats_included?.length > 0}
							<ul>
								{#each data.listing.whats_included as item}
									<li>
										<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="list-icon-check">
											<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
										</svg>
										<span>{item}</span>
									</li>
								{/each}
							</ul>
						{:else}
							<p class="empty-list-text">No details provided.</p>
						{/if}
					</div>

					<div class="list-column">
						<h3>What to Bring</h3>
						{#if data.listing.what_to_bring?.length > 0}
							<ul>
								{#each data.listing.what_to_bring as item}
									<li>
										<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="list-icon-dot">
											<path stroke-linecap="round" stroke-linejoin="round" d="M18 12H6" />
										</svg>
										<span>{item}</span>
									</li>
								{/each}
							</ul>
						{:else}
							<p class="empty-list-text">No details provided.</p>
						{/if}
					</div>
				</div>
			</div>

			<!-- Right side: Date Selector & Booking Card -->
			<div class="booking-panel glass glow-primary">
				<h2>Select a Date</h2>
				<p class="panel-desc">Choose when you want to set sail. Shared charters require two groups to book and reconfirm.</p>

				<div class="date-selector-wrapper">
					<label for="trip-date">Departure Date</label>
					<input
						type="date"
						id="trip-date"
						min={minDate}
						bind:value={selectedDate}
						class="date-input"
					/>
				</div>

				{#if selectedDate}
					<!-- Date status info -->
					<div class="date-status-card glass">
						{#if matchedInstance}
							{#if matchedInstance.status === 'half-booked'}
								<div class="status-alert share-glow">
									<div class="status-alert-header">
										<span class="pulse-dot"></span>
										<h4>Active Group Found!</h4>
									</div>
									<p>Another group has already booked this date. Join them to split the charter cost in half!</p>
									<div class="price-box">
										<span class="price-num">${Math.round(data.listing.low_price / 2)} – ${Math.round(data.listing.high_price / 2)}</span>
										<span class="price-lbl">Your Split Share (50%)</span>
									</div>
								</div>
							{:else if matchedInstance.status === 'open'}
								<div class="status-alert open-glow">
									<h4>Charter Already Open</h4>
									<p>A charter instance is already open on this date. Book now to claim the first slot!</p>
									<div class="price-box">
										<span class="price-num">${Math.round(data.listing.low_price / 2)}</span>
										<span class="price-lbl">Reservation Deposit</span>
									</div>
								</div>
							{/if}
						{:else}
							<div class="status-alert new-glow">
								<h4>Start New Charter</h4>
								<p>No charter is open on this date yet. Book now to open a new trip instance so other groups can join you!</p>
								<div class="price-box">
									<span class="price-num">$50.00</span>
									<span class="price-lbl">Reservation Fee (per group)</span>
								</div>
							</div>
						{/if}
					</div>

					<div class="action-row">
						<a href="/checkout?templateId={data.listing.id}&date={selectedDate}" class="btn btn-primary w-full btn-large">
							Proceed to Checkout
						</a>
					</div>
				{:else}
					<div class="select-date-prompt">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.2" stroke="currentColor" width="48" height="48" class="prompt-icon">
							<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
						</svg>
						<p>Please select a date above to view availability and price details.</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.detail-wrapper {
		min-height: 100vh;
		position: relative;
		overflow: hidden;
		background: #060913;
		padding: 4rem 2rem;
	}

	.bg-blur {
		position: absolute;
		border-radius: 50%;
		filter: blur(150px);
		z-index: 1;
		pointer-events: none;
		opacity: 0.12;
	}
	.bg-blur-1 {
		background: var(--primary);
		width: 500px;
		height: 500px;
		top: -10%;
		right: 15%;
	}
	.bg-blur-2 {
		background: var(--secondary);
		width: 500px;
		height: 500px;
		bottom: -10%;
		left: 15%;
	}

	.detail-container {
		max-width: 1200px;
		margin: 0 auto;
		width: 100%;
		z-index: 2;
		position: relative;
	}

	.detail-header {
		margin-bottom: 3rem;
	}
	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		color: var(--text-secondary);
		text-decoration: none;
		font-size: 0.9rem;
		font-weight: 500;
		margin-bottom: 1.5rem;
		transition: color 0.2s ease;
	}
	.back-link:hover {
		color: var(--text-primary);
	}
	.detail-header h1 {
		font-size: 2.75rem;
		font-weight: 800;
		letter-spacing: -0.7px;
		margin-bottom: 0.5rem;
	}
	.location {
		font-size: 1.1rem;
		color: var(--primary);
		font-weight: 600;
	}

	.detail-grid {
		display: grid;
		grid-template-columns: 1.8fr 1.2fr;
		gap: 2.5rem;
		align-items: start;
	}

	/* Left side info panel */
	.details-panel {
		padding: 2.5rem;
		border: 1px solid var(--border-light);
	}
	.section {
		margin-bottom: 2rem;
	}
	.section h2 {
		font-size: 1.35rem;
		font-weight: 700;
		margin-bottom: 0.75rem;
		border-bottom: 1px solid var(--border-light);
		padding-bottom: 0.5rem;
	}
	.description {
		color: var(--text-secondary);
		line-height: 1.6;
		font-size: 0.95rem;
	}

	.specs-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.5rem;
		border-top: 1px solid var(--border-light);
		border-bottom: 1px solid var(--border-light);
		padding: 1.5rem 0;
		margin-bottom: 2.5rem;
	}
	.spec-item {
		display: flex;
		flex-direction: column;
	}
	.spec-label {
		font-size: 0.75rem;
		color: var(--text-muted);
		text-transform: uppercase;
		font-weight: 600;
		letter-spacing: 0.5px;
		margin-bottom: 4px;
	}
	.spec-value {
		font-size: 1.05rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.lists-section {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2.5rem;
	}
	.list-column h3 {
		font-size: 1.15rem;
		font-weight: 700;
		margin-bottom: 1rem;
	}
	.list-column ul {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.list-column li {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		font-size: 0.92rem;
		color: var(--text-secondary);
	}
	.list-icon-check {
		width: 16px;
		height: 16px;
		color: var(--success);
		margin-top: 2px;
		flex-shrink: 0;
	}
	.list-icon-dot {
		width: 14px;
		height: 14px;
		color: var(--secondary);
		margin-top: 4px;
		flex-shrink: 0;
	}
	.empty-list-text {
		color: var(--text-muted);
		font-size: 0.9rem;
	}

	/* Right side booking card */
	.booking-panel {
		padding: 2.5rem;
		border: 1px solid var(--border-light);
		display: flex;
		flex-direction: column;
	}
	.booking-panel h2 {
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
	}
	.panel-desc {
		font-size: 0.85rem;
		color: var(--text-secondary);
		line-height: 1.5;
		margin-bottom: 2rem;
	}
	.date-selector-wrapper {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-bottom: 2rem;
	}
	.date-selector-wrapper label {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-secondary);
	}
	.date-input {
		width: 100%;
		padding: 12px;
		font-size: 1rem;
	}

	/* Date Status Alerts */
	.date-status-card {
		padding: 1.5rem;
		margin-bottom: 2rem;
		border: 1px solid var(--border-light);
	}
	.status-alert {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.status-alert-header {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.status-alert h4 {
		font-size: 1.1rem;
		font-weight: 700;
	}
	.status-alert p {
		font-size: 0.85rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}

	.pulse-dot {
		width: 8px;
		height: 8px;
		background-color: var(--primary);
		border-radius: 50%;
		display: inline-block;
		box-shadow: 0 0 10px var(--primary);
		animation: pulse 1.5s infinite;
	}
	@keyframes pulse {
		0% { transform: scale(0.9); opacity: 0.6; }
		50% { transform: scale(1.1); opacity: 1; }
		100% { transform: scale(0.9); opacity: 0.6; }
	}

	.price-box {
		margin-top: 1rem;
		padding: 12px;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 8px;
		border: 1px solid var(--border-light);
		display: flex;
		flex-direction: column;
	}
	.price-num {
		font-family: var(--font-heading);
		font-size: 1.5rem;
		font-weight: 800;
		color: var(--text-primary);
	}
	.price-lbl {
		font-size: 0.75rem;
		color: var(--text-muted);
		margin-top: 2px;
	}

	.share-glow h4 { color: var(--primary); }
	.open-glow h4 { color: var(--secondary); }
	.new-glow h4 { color: var(--accent); }

	.select-date-prompt {
		text-align: center;
		padding: 3rem 1.5rem;
		color: var(--text-muted);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		border: 1px dashed var(--border-light);
		border-radius: 12px;
	}
	.select-date-prompt p {
		font-size: 0.85rem;
		max-width: 220px;
		line-height: 1.4;
	}
	.prompt-icon {
		width: 48px;
		height: 48px;
		color: var(--text-muted);
		opacity: 0.6;
		flex-shrink: 0;
	}

	.w-full {
		width: 100%;
	}
	.btn-large {
		padding: 14px 28px;
		font-size: 1rem;
		text-decoration: none;
	}

	@media (max-width: 992px) {
		.detail-grid {
			grid-template-columns: 1fr;
		}
	}
	@media (max-width: 576px) {
		.detail-wrapper {
			padding: 2rem 1rem;
		}
		.details-panel, .booking-panel {
			padding: 1.5rem;
		}
		.specs-grid {
			grid-template-columns: 1fr;
			gap: 1rem;
		}
		.lists-section {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}
	}
</style>
