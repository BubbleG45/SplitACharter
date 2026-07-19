<script lang="ts">
	let { data } = $props();

	function formatDate(dateStr: string) {
		const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
		return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', options);
	}

	const trip = $derived(data.trip);
	const template = $derived((Array.isArray(trip.listing_templates) ? trip.listing_templates[0] : trip.listing_templates) as any);
	const captain = $derived(data.captain);
	const bookings = $derived(data.bookings);

	const totalPassengers = $derived(bookings.reduce((sum: number, b: any) => sum + (b.group_size || 0), 0));
</script>

<svelte:head>
	<title>Trip Passenger List — SplitACharter</title>
</svelte:head>

<div class="details-wrapper">
	<div class="bg-blur bg-blur-1"></div>
	<div class="bg-blur bg-blur-2"></div>

	<div class="details-container">
		{#if data.isAdmin}
			<div class="admin-banner">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.746 3.746 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
				</svg>
				Viewing as SplitACharter Admin
			</div>
		{/if}

		<div class="card glass main-card">
			<div class="header-section">
				<div class="badge info-badge">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
					</svg>
					Trip Roster
				</div>
				<h1>Trip Details & Passenger List</h1>
				<p class="subtitle">Secure dashboard for Captain {captain?.name || 'Matched Captain'}</p>
			</div>

			<div class="divider"></div>

			<!-- Trip metadata -->
			<div class="meta-grid">
				<div class="meta-card glass">
					<span class="meta-label">Trip Type</span>
					<span class="meta-value">{template?.trip_type || 'N/A'}</span>
				</div>
				<div class="meta-card glass">
					<span class="meta-label">Date</span>
					<span class="meta-value highlight-primary">{formatDate(trip.date)}</span>
				</div>
				<div class="meta-card glass">
					<span class="meta-label">Location</span>
					<span class="meta-value">{template?.location || 'N/A'}</span>
				</div>
				<div class="meta-card glass">
					<span class="meta-label">Total Anglers/Passengers</span>
					<span class="meta-value highlight-secondary">{totalPassengers} Passengers</span>
				</div>
			</div>

			<div class="info-alert info-meeting glass">
				<p><strong>Meeting Area / Slip:</strong> {template?.meeting_area || 'Not Specified'}</p>
			</div>

			<div class="divider"></div>

			<!-- Passenger roster list -->
			<h2>Passenger Roster</h2>
			{#if bookings.length === 0}
				<p class="empty-state">No active passengers have booked this trip yet.</p>
			{:else}
				<div class="passenger-list">
					{#each bookings as b, idx}
						{@const customer = (Array.isArray(b.customers) ? b.customers[0] : b.customers) as any}
						<div class="passenger-card glass">
							<div class="passenger-header">
								<div class="passenger-meta">
									<span class="passenger-idx">Group #{idx + 1}</span>
									<h3 class="passenger-name">{customer?.name || 'Unknown'}</h3>
								</div>
								<div class="group-size-badge">
									{b.group_size} pax
								</div>
							</div>
							
							<div class="passenger-details">
								{#if customer?.phone}
									<a href="tel:{customer.phone}" class="contact-link">
										<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
											<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.622c0-1.272.933-2.33 2.19-2.33h3c1.45 0 2.633.925 3.017 2.245l1.044 3.562c.385 1.317-.1 2.71-1.217 3.514l-3.035 2.192A13.882 13.882 0 0013.978 18.8l2.25-3.033a1.875 1.875 0 012.337-.66l3.562 1.044c1.317.385 2.245 1.567 2.245 3.017v3c0 1.258-1.012 2.29-2.29 2.29-12.117 0-21.87-9.753-21.87-21.87 0-1.28 1.033-2.29 2.29-2.29h3v3.582z" />
										</svg>
										{customer.phone}
									</a>
								{/if}
								{#if customer?.email}
									<a href="mailto:{customer.email}" class="contact-link">
										<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
											<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
										</svg>
										{customer.email}
									</a>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}

			<div class="divider"></div>

			<div class="disclaimer-text">
				<p>Please coordinate directly with each group as needed. The passengers are aware that they pay you directly at the dock. Secure token verified: Authorized access only.</p>
			</div>
		</div>
	</div>
</div>

<style>
	.details-wrapper {
		min-height: 100vh;
		position: relative;
		overflow: hidden;
		background: #060913;
		padding: 4rem 2rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.bg-blur {
		position: absolute;
		border-radius: 50%;
		filter: blur(150px);
		z-index: 1;
		pointer-events: none;
		opacity: 0.08;
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

	.details-container {
		max-width: 700px;
		width: 100%;
		z-index: 2;
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.admin-banner {
		background: rgba(99, 102, 241, 0.15);
		color: #a5b4fc;
		border: 1px solid rgba(99, 102, 241, 0.3);
		padding: 10px 16px;
		border-radius: 8px;
		font-weight: 600;
		font-size: 0.9rem;
		display: flex;
		align-items: center;
		gap: 8px;
		justify-content: center;
	}

	.card {
		padding: 3rem;
		border: 1px solid var(--border-light);
		display: flex;
		flex-direction: column;
	}

	.badge {
		align-self: flex-start;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		padding: 6px 12px;
		border-radius: 20px;
		margin-bottom: 1rem;
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.info-badge {
		background: rgba(6, 182, 212, 0.12);
		color: var(--primary);
		border: 1px solid rgba(6, 182, 212, 0.25);
	}

	.card h1 {
		font-size: 2.2rem;
		font-weight: 800;
		letter-spacing: -0.6px;
		margin-bottom: 0.5rem;
		line-height: 1.2;
		color: var(--text-primary);
	}
	.card h2 {
		font-size: 1.4rem;
		font-weight: 700;
		margin-top: 1rem;
		margin-bottom: 1.25rem;
		color: var(--text-primary);
	}
	.subtitle {
		font-size: 1rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}

	.divider {
		height: 1px;
		background: var(--border-light);
		margin: 2rem 0;
	}

	/* Meta Grid */
	.meta-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 16px;
		margin-bottom: 1.5rem;
	}
	.meta-card {
		padding: 1.25rem;
		border: 1px solid rgba(255, 255, 255, 0.04);
		border-radius: 10px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.meta-label {
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--text-secondary);
	}
	.meta-value {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--text-primary);
	}
	.highlight-primary {
		color: var(--primary);
	}
	.highlight-secondary {
		color: var(--secondary);
	}

	/* Info Alert */
	.info-alert {
		padding: 1.25rem;
		border-radius: 8px;
		font-size: 0.95rem;
		line-height: 1.5;
	}
	.info-meeting {
		border: 1px solid rgba(6, 182, 212, 0.2);
		background: rgba(6, 182, 212, 0.02);
		color: #cffafe;
	}

	/* Passenger List */
	.passenger-list {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.passenger-card {
		padding: 1.5rem;
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: 10px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.passenger-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.passenger-meta {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.passenger-idx {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--primary);
		font-weight: 600;
	}
	.passenger-name {
		font-size: 1.2rem;
		font-weight: 700;
		margin: 0;
		color: var(--text-primary);
	}
	.group-size-badge {
		background: rgba(99, 102, 241, 0.15);
		color: #c7d2fe;
		border: 1px solid rgba(99, 102, 241, 0.25);
		padding: 4px 10px;
		border-radius: 6px;
		font-size: 0.85rem;
		font-weight: 600;
	}
	.passenger-details {
		display: flex;
		flex-wrap: wrap;
		gap: 24px;
		margin-top: 4px;
	}
	.contact-link {
		display: flex;
		align-items: center;
		gap: 8px;
		color: var(--text-secondary);
		text-decoration: none;
		font-size: 0.95rem;
		transition: color 0.2s ease;
	}
	.contact-link:hover {
		color: var(--primary);
	}

	.empty-state {
		color: var(--text-secondary);
		font-style: italic;
		text-align: center;
		padding: 2rem;
	}

	.disclaimer-text {
		font-size: 0.85rem;
		color: var(--text-secondary);
		line-height: 1.5;
		text-align: center;
	}

	@media (max-width: 576px) {
		.details-wrapper {
			padding: 2rem 1rem;
		}
		.card {
			padding: 2rem 1.5rem;
		}
		.card h1 {
			font-size: 1.75rem;
		}
		.meta-grid {
			grid-template-columns: 1fr;
		}
		.passenger-details {
			flex-direction: column;
			gap: 12px;
		}
	}
</style>
