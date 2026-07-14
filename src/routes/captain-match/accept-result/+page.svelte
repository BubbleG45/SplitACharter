<script lang="ts">
	let { data } = $props();

	function formatDate(dateStr: string) {
		const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
		return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', options);
	}
</script>

<svelte:head>
	<title>Charter Match Claim Result — SplitACharter</title>
</svelte:head>

<div class="result-wrapper">
	<div class="bg-blur bg-blur-1"></div>
	<div class="bg-blur bg-blur-2"></div>

	<div class="result-container">
		{#if data.status === 'success'}
			{@const captain = data.captain as any}
			{@const trip = data.trip as any}
			{@const template = (Array.isArray(trip?.listing_templates) ? trip.listing_templates[0] : trip?.listing_templates) as any}
			
			<div class="card glass success-glow">
				<div class="badge success-badge">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					Charter Secured
				</div>
				
				<h1>Welcome Aboard, Captain {captain.name}!</h1>
				<p class="subtitle">You have successfully claimed and locked in this charter. We have dispatched confirmations to the passengers.</p>

				<div class="divider"></div>

				<div class="details-list">
					<div class="detail-row">
						<span class="label">Charter Type</span>
						<span class="value">{template.trip_type}</span>
					</div>
					<div class="detail-row">
						<span class="label">Departure Date</span>
						<span class="value date-val">{formatDate(trip.date)}</span>
					</div>
					<div class="detail-row">
						<span class="label">Location</span>
						<span class="value">{template.location}</span>
					</div>
					<div class="detail-row">
						<span class="label">Meeting Slip / Area</span>
						<span class="value highlight">{template.meeting_area}</span>
					</div>
					<div class="detail-row">
						<span class="label">Passenger Capacity</span>
						<span class="value">{data.totalPassengers} Passengers (2 Matched Groups)</span>
					</div>
				</div>

				<div class="divider"></div>

				<div class="info-alert info-success glass">
					<p><strong>Next Steps:</strong> The passengers will pay you directly on the day of the trip. Please prepare your craft and slips. Their contact info has been sent to your phone via SMS, and yours has been sent to theirs.</p>
				</div>
			</div>
		{:else}
			<div class="card glass claimed-glow">
				<div class="badge claimed-badge">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376C1.83 19.13 3.321 21 5.122 21h13.756c1.8 0 3.292-1.87 2.53-3.376L14.383 4.307c-.9-1.78-3.46-1.78-4.36 0L3.106 17.624zM12 17.25h.007v.008H12v-.008z" />
					</svg>
					Charter Already Claimed
				</div>

				<h1>Charter Already Secured</h1>
				<p class="subtitle">This slot was claimed by another captain. We operate on a simultaneous first-acceptance model to keep things fast for our customers.</p>

				<div class="divider"></div>

				<p class="explanation">
					To ensure passengers can secure their date instantly, matches are awarded to the first eligible skipper to accept. 
					We have logged your interest and will alert you the moment another matching slot opens up in your region!
				</p>

				<div class="divider"></div>

				<div class="info-alert info-warning glass">
					<p>No action is needed on your part. Thank you for your availability, and clear skies!</p>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.result-wrapper {
		min-height: 100vh;
		position: relative;
		overflow: hidden;
		background: #060913;
		padding: 6rem 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
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

	.result-container {
		max-width: 600px;
		width: 100%;
		z-index: 2;
		position: relative;
	}

	.card {
		padding: 3rem;
		border: 1px solid var(--border-light);
		display: flex;
		flex-direction: column;
	}

	.badge {
		align-self: flex-start;
		font-size: 0.8rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		padding: 6px 12px;
		border-radius: 20px;
		margin-bottom: 1.5rem;
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.success-badge {
		background: rgba(16, 185, 129, 0.12);
		color: var(--success);
		border: 1px solid rgba(16, 185, 129, 0.25);
	}
	.claimed-badge {
		background: rgba(245, 158, 11, 0.12);
		color: var(--accent);
		border: 1px solid rgba(245, 158, 11, 0.25);
	}

	.card h1 {
		font-size: 2.2rem;
		font-weight: 800;
		letter-spacing: -0.6px;
		margin-bottom: 0.75rem;
		line-height: 1.25;
	}
	.subtitle {
		font-size: 1rem;
		color: var(--text-secondary);
		line-height: 1.5;
		margin-bottom: 2rem;
	}

	.divider {
		height: 1px;
		background: var(--border-light);
		margin: 1.5rem 0;
	}

	/* Details List */
	.details-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.detail-row {
		display: flex;
		justify-content: space-between;
		font-size: 0.95rem;
		align-items: center;
	}
	.detail-row .label {
		color: var(--text-secondary);
	}
	.detail-row .value {
		font-weight: 600;
		color: var(--text-primary);
		text-align: right;
	}
	.date-val {
		color: var(--primary) !important;
	}
	.highlight {
		color: var(--secondary) !important;
	}

	.explanation {
		font-size: 0.92rem;
		color: var(--text-secondary);
		line-height: 1.6;
	}

	/* Info alerts */
	.info-alert {
		padding: 1.25rem;
		border-radius: 8px;
		font-size: 0.85rem;
		line-height: 1.5;
	}
	.info-success {
		border: 1px solid rgba(16, 185, 129, 0.2);
		background: rgba(16, 185, 129, 0.02);
		color: #a7f3d0;
	}
	.info-warning {
		border: 1px solid rgba(245, 158, 11, 0.2);
		background: rgba(245, 158, 11, 0.02);
		color: #fde68a;
	}

	.success-glow { box-shadow: 0 0 30px 0 rgba(16, 185, 129, 0.1); }
	.claimed-glow { box-shadow: 0 0 30px 0 rgba(245, 158, 11, 0.1); }

	@media (max-width: 576px) {
		.result-wrapper {
			padding: 4rem 1rem;
		}
		.card {
			padding: 2rem 1.5rem;
		}
		.card h1 {
			font-size: 1.75rem;
		}
	}
</style>
