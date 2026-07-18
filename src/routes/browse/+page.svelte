<script lang="ts">
	let { data } = $props();

	let searchQuery = $state('');
	let filterDuration = $state('all'); // 'all', 'half-day', 'full-day'
	let filterPax = $state('all'); // 'all', 'small', 'medium', 'large'
	let filterTripType = $state('all');

	// Client-side filtering
	let filteredListings = $derived(
		data.listings.filter((listing) => {
			const matchesSearch =
				listing.trip_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
				listing.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
				listing.description.toLowerCase().includes(searchQuery.toLowerCase());
			
			// Duration category
			let isHalfDay = false;
			let isFullDay = false;
			if (listing.duration && typeof listing.duration === 'string') {
				const parts = listing.duration.split(':');
				const hours = parseInt(parts[0], 10);
				isHalfDay = hours <= 4;
				isFullDay = hours > 4;
			} else if (listing.duration && typeof listing.duration === 'object') {
				const hours = listing.duration.hours || 0;
				isHalfDay = hours <= 4;
				isFullDay = hours > 4;
			}
			const matchesDuration =
				filterDuration === 'all' ||
				(filterDuration === 'half-day' && isHalfDay) ||
				(filterDuration === 'full-day' && isFullDay);

			// Passenger size category
			const pax = listing.max_passengers;
			let matchesPax = true;
			if (filterPax === 'small') matchesPax = pax <= 4;
			else if (filterPax === 'medium') matchesPax = pax > 4 && pax <= 8;
			else if (filterPax === 'large') matchesPax = pax > 8;

			// Trip Type filter
			const matchesTripType = filterTripType === 'all' || listing.trip_type === filterTripType;

			return matchesSearch && matchesDuration && matchesPax && matchesTripType;
		})
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
	<title>Browse Charters — SplitACharter</title>
</svelte:head>

<div class="browse-wrapper">
	<div class="bg-blur bg-blur-1"></div>
	<div class="bg-blur bg-blur-2"></div>

	<div class="browse-container">
		<header class="browse-header">
			<a href="/" class="back-link">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
				</svg>
				<span>Back to Home</span>
			</a>
			<h1>Available Charters</h1>
			<p class="subtitle">Pick a charter type, join an existing group, or open a new date to share costs.</p>
		</header>

		<!-- Filters Controls -->
		<div class="controls-card glass">
			<div class="search-box">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="search-icon">
					<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
				</svg>
				<input
					type="text"
					placeholder="Search by location, trip type..."
					bind:value={searchQuery}
					class="search-input"
				/>
			</div>

			<div class="filters-group">
				<div class="select-wrapper">
					<label for="duration">Duration</label>
					<select id="duration" bind:value={filterDuration}>
						<option value="all">Any Duration</option>
						<option value="half-day">Half Day (≤ 4 hrs)</option>
						<option value="full-day">Full Day (> 4 hrs)</option>
					</select>
				</div>

				<div class="select-wrapper">
					<label for="capacity">Capacity</label>
					<select id="capacity" bind:value={filterPax}>
						<option value="all">Any Capacity</option>
						<option value="small">Small Group (1–4 pax)</option>
						<option value="medium">Medium Group (5–8 pax)</option>
						<option value="large">Large Group (9+ pax)</option>
					</select>
				</div>

				<div class="select-wrapper">
					<label for="trip-type">Trip Type</label>
					<select id="trip-type" bind:value={filterTripType}>
						<option value="all">Any Trip Type</option>
						{#each data.tripTypes as type}
							<option value={type.name}>{type.name}</option>
						{/each}
					</select>
				</div>
			</div>
		</div>

		<!-- Listing Cards Grid -->
		{#if filteredListings.length === 0}
			<div class="empty-state glass">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-12 h-12 empty-icon">
					<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.008 1.24l.885 1.77a2.25 2.25 0 002.007 1.24h1.98a2.25 2.25 0 002.007-1.24l.885-1.77a2.25 2.25 0 012.007-1.24h3.86m-18 0h18a2.25 2.25 0 012.25 2.25v4.25a2.25 2.25 0 01-2.25 2.25H2.25A2.25 2.25 0 010 20v-4.25a2.25 2.25 0 012.25-2.25z" />
				</svg>
				<h3>No Charters Match Your Search</h3>
				<p>Try resetting the filters or modifying your search query.</p>
			</div>
		{:else}
			<div class="cards-grid">
				{#each filteredListings as listing (listing.id)}
					<div class="listing-card glass glass-interactive">
						<div class="card-header">
							<span class="location-badge">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
									<path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
									<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
								</svg>
								{listing.location}
							</span>
							<span class="pax-badge">{listing.max_passengers} Max Pax</span>
						</div>

						<div class="card-body">
							<h3>{listing.trip_type}</h3>
							<p class="description">{listing.description}</p>

							<div class="meta-row">
								<div class="meta-item">
									<span class="meta-label">Duration</span>
									<span class="meta-value">{formatDuration(listing.duration)}</span>
								</div>
								<div class="meta-item">
									<span class="meta-label">Meeting Area</span>
									<span class="meta-value" title={listing.meeting_area}>{listing.meeting_area}</span>
								</div>
							</div>
						</div>

						<div class="card-footer">
							<div class="price-info">
								<span class="price-split">${Math.round(listing.low_price / 2)} – ${Math.round(listing.high_price / 2)} <span class="per-group">/ group</span></span>
								<span class="price-total">Total: ${Math.round(listing.low_price)}–${Math.round(listing.high_price)}</span>
							</div>
							<a href="/browse/{listing.id}" class="btn btn-primary">Book Charter</a>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.browse-wrapper {
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
		width: 450px;
		height: 450px;
		top: -5%;
		right: 10%;
	}
	.bg-blur-2 {
		background: var(--secondary);
		width: 450px;
		height: 450px;
		bottom: -5%;
		left: 10%;
	}

	.browse-container {
		max-width: 1200px;
		margin: 0 auto;
		width: 100%;
		z-index: 2;
		position: relative;
	}

	.browse-header {
		margin-bottom: 2.5rem;
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
	.browse-header h1 {
		font-size: 2.5rem;
		font-weight: 800;
		letter-spacing: -0.7px;
	}
	.subtitle {
		font-size: 1.05rem;
		color: var(--text-secondary);
		margin-top: 0.5rem;
		max-width: 600px;
		line-height: 1.5;
	}

	/* Controls Card */
	.controls-card {
		display: flex;
		gap: 2rem;
		padding: 1.5rem;
		margin-bottom: 3rem;
		align-items: flex-end;
		border: 1px solid var(--border-light);
	}
	.search-box {
		flex: 2;
		position: relative;
		display: flex;
		align-items: center;
	}
	.search-icon {
		position: absolute;
		left: 14px;
		width: 18px;
		height: 18px;
		color: var(--text-muted);
	}
	.search-input {
		width: 100%;
		padding-left: 42px;
	}
	.filters-group {
		flex: 3;
		display: flex;
		gap: 1.5rem;
	}
	.select-wrapper {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.select-wrapper label {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	.select-wrapper select {
		width: 100%;
	}

	/* Grid and Cards */
	.cards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
		gap: 2rem;
	}
	.listing-card {
		padding: 1.75rem;
		display: flex;
		flex-direction: column;
		border: 1px solid var(--border-light);
		min-height: 420px;
	}
	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.25rem;
	}
	.location-badge {
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid var(--border-light);
		padding: 4px 10px;
		border-radius: 6px;
		font-size: 0.8rem;
		color: var(--text-secondary);
		font-weight: 500;
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	.pax-badge {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--primary);
	}

	.card-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		margin-bottom: 1.75rem;
	}
	.card-body h3 {
		font-size: 1.35rem;
		font-weight: 700;
		margin-bottom: 0.75rem;
		letter-spacing: -0.2px;
	}
	.description {
		font-size: 0.9rem;
		color: var(--text-secondary);
		line-height: 1.5;
		margin-bottom: 1.5rem;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.meta-row {
		display: flex;
		gap: 1.5rem;
		border-top: 1px solid var(--border-light);
		padding-top: 1rem;
		margin-top: auto;
	}
	.meta-item {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.meta-label {
		font-size: 0.75rem;
		color: var(--text-muted);
		text-transform: uppercase;
		font-weight: 600;
		letter-spacing: 0.5px;
	}
	.meta-value {
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--text-primary);
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
	}

	.card-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-top: 1px solid var(--border-light);
		padding-top: 1.25rem;
	}
	.price-info {
		display: flex;
		flex-direction: column;
	}
	.price-split {
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: 1.2rem;
		color: var(--text-primary);
	}
	.per-group {
		font-size: 0.75rem;
		color: var(--text-muted);
		font-weight: 400;
		font-family: var(--font-body);
	}
	.price-total {
		font-size: 0.75rem;
		color: var(--text-muted);
		margin-top: 2px;
	}

	.empty-state {
		padding: 5rem 2rem;
		text-align: center;
		border: 1px solid var(--border-light);
	}
	.empty-icon {
		color: var(--text-muted);
		margin-bottom: 1.5rem;
		display: inline-block;
	}
	.empty-state h3 {
		font-size: 1.35rem;
		margin-bottom: 0.5rem;
	}
	.empty-state p {
		color: var(--text-secondary);
		max-width: 400px;
		margin: 0 auto;
	}

	@media (max-width: 992px) {
		.controls-card {
			flex-direction: column;
			align-items: stretch;
			gap: 1rem;
		}
		.filters-group {
			width: 100%;
		}
	}
	@media (max-width: 576px) {
		.browse-wrapper {
			padding: 2rem 1rem;
		}
		.cards-grid {
			grid-template-columns: 1fr;
		}
		.filters-group {
			flex-direction: column;
			gap: 1rem;
		}
	}
</style>
