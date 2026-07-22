<script lang="ts">
	let { data } = $props();

	let filterLocation = $state('all');
	let filterDuration = $state('all'); // 'all', 'half-day', 'full-day'
	let filterPax = $state('all'); // 'all', 'small', 'medium', 'large'
	let filterTripType = $state('all');
	let searchDate = $state('');
	let minDate = $state('');

	import { onMount } from 'svelte';
	import CustomSelect from '$lib/components/CustomSelect.svelte';
	onMount(() => {
		const today = new Date();
		const yyyy = today.getFullYear();
		const mm = String(today.getMonth() + 1).padStart(2, '0');
		const dd = String(today.getDate()).padStart(2, '0');
		minDate = `${yyyy}-${mm}-${dd}`;
	});

	function matchesLocationFilter(locString: string, filterVal: string) {
		if (filterVal === 'all') return true;
		const loc = (locString || '').toLowerCase();
		if (filterVal === 'lower-keys') {
			return loc.includes('lower key') || loc.includes('key west') || loc.includes('big pine');
		}
		if (filterVal === 'middle-keys') {
			return loc.includes('middle key') || loc.includes('marathon') || loc.includes('pigeon key');
		}
		if (filterVal === 'upper-keys') {
			return loc.includes('upper key') || loc.includes('key largo') || loc.includes('islamorada');
		}
		return true;
	}

	function parseLocation(locString: string): { main: string; details: string | null } {
		if (!locString) return { main: '', details: null };
		const match = locString.match(/^(.*?)\s*\((.*?)\)$/);
		if (match) {
			return { main: match[1].trim(), details: `(${match[2].trim()})` };
		}
		return { main: locString, details: null };
	}

	function matchesFilters(template: any) {
		const matchesLocation = matchesLocationFilter(template.location, filterLocation);
		
		let isHalfDay = false;
		let isFullDay = false;
		if (template.duration && typeof template.duration === 'string') {
			const parts = template.duration.split(':');
			const hours = parseInt(parts[0], 10);
			isHalfDay = hours <= 4;
			isFullDay = hours > 4;
		} else if (template.duration && typeof template.duration === 'object') {
			const hours = template.duration.hours || 0;
			isHalfDay = hours <= 4;
			isFullDay = hours > 4;
		}
		const matchesDuration =
			filterDuration === 'all' ||
			(filterDuration === 'half-day' && isHalfDay) ||
			(filterDuration === 'full-day' && isFullDay);

		const pax = template.max_passengers;
		let matchesPax = true;
		if (filterPax === 'small') matchesPax = pax <= 4;
		else if (filterPax === 'medium') matchesPax = pax > 4 && pax <= 8;
		else if (filterPax === 'large') matchesPax = pax > 8;

		const matchesTripType = filterTripType === 'all' || template.trip_type === filterTripType;

		return matchesLocation && matchesDuration && matchesPax && matchesTripType;
	}

	// Client-side filtering
	let filteredListings = $derived.by(() => {
		if (!searchDate) {
			// Mode A: NO Date Selected -> Only display active half-booked trip instances
			return data.halfBookedTrips
				.filter((trip) => {
					if (trip.date < minDate) return false;
					const template = data.listings.find((l) => l.id === trip.listing_template_id);
					if (!template) return false;
					return matchesFilters(template);
				})
				.map((trip) => {
					const template = data.listings.find((l) => l.id === trip.listing_template_id)!;
					return {
						...template,
						matchedInstance: trip
					};
				});
		} else {
			// Mode B: Date IS Selected -> Display 1 instance per template (Location + Trip Type + Duration combo)
			// Show half-filled trip instance if available on searchDate, otherwise show blank open listing template
			return data.listings
				.filter((template) => matchesFilters(template))
				.map((template) => {
					const matchedInstance = data.halfBookedTrips.find(
						(trip) => trip.listing_template_id === template.id && trip.date === searchDate
					) || null;

					return {
						...template,
						matchedInstance
					};
				});
		}
	});

	// Suggestions derived list (Only when a date IS selected)
	let suggestedTrips = $derived.by(() => {
		if (!searchDate) return [];

		return data.halfBookedTrips.filter((trip) => {
			const template = data.listings.find((l) => l.id === trip.listing_template_id);
			if (!template) return false;
			if (!matchesFilters(template)) return false;

			const sDate = new Date(searchDate + 'T00:00:00');
			const tDate = new Date(trip.date + 'T00:00:00');
			const diffTime = Math.abs(tDate.getTime() - sDate.getTime());
			const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

			return diffDays <= 3 && trip.date !== searchDate && trip.date >= minDate;
		});
	});

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
	}

	function formatDateDisplay(dateStr: string) {
		if (!dateStr) return '';
		const parts = dateStr.split('-');
		if (parts.length === 3) {
			return `${parts[1]}/${parts[2]}/${parts[0]}`;
		}
		return dateStr;
	}

	const locationOptions = [
		{ value: 'all', label: 'All Locations' },
		{ value: 'lower-keys', label: 'Lower Keys (Key West, Big Pine Key)' },
		{ value: 'middle-keys', label: 'Middle Keys (Marathon, Pigeon Key)' },
		{ value: 'upper-keys', label: 'Upper Keys (Key Largo, Islamorada)' }
	];
	const durationOptions = [
		{ value: 'all', label: 'Any Duration' },
		{ value: 'half-day', label: 'Half Day (≤ 4 hrs)' },
		{ value: 'full-day', label: 'Full Day (> 4 hrs)' }
	];
	const capacityOptions = [
		{ value: 'all', label: 'Any Capacity' },
		{ value: 'small', label: 'Small Group (1–4 pax)' },
		{ value: 'medium', label: 'Medium Group (5–8 pax)' },
		{ value: 'large', label: 'Large Group (9+ pax)' }
	];
	const tripTypeOptions = $derived([
		{ value: 'all', label: 'Any Trip Type' },
		...data.tripTypes.map((t) => ({ value: t.name, label: t.name }))
	]);

	function resetAllFilters() {
		searchDate = '';
		filterLocation = 'all';
		filterDuration = 'all';
		filterPax = 'all';
		filterTripType = 'all';
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
			<div class="controls-card-header">
				<div class="controls-title-group">
					<span class="controls-title">Filter Charters</span>
				</div>
				{#if searchDate || filterLocation !== 'all' || filterDuration !== 'all' || filterPax !== 'all' || filterTripType !== 'all'}
					<button type="button" class="btn-clear-all" onclick={resetAllFilters}>
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
							<path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
						</svg>
						<span>Clear Filters</span>
					</button>
				{/if}
			</div>
			<div class="filters-group">
				<div class="select-wrapper">
					<div class="label-row">
						<label for="search-date">Trip Date</label>
						{#if searchDate}
							<button type="button" class="clear-date-btn" onclick={() => searchDate = ''}>Clear Date</button>
						{/if}
					</div>
					<input
						type="date"
						id="search-date"
						bind:value={searchDate}
						min={minDate}
						class="date-input-field"
					/>
				</div>

				<CustomSelect
					id="location"
					label="Location"
					bind:value={filterLocation}
					options={locationOptions}
				/>

				<CustomSelect
					id="duration"
					label="Duration"
					bind:value={filterDuration}
					options={durationOptions}
				/>

				<CustomSelect
					id="capacity"
					label="Capacity"
					bind:value={filterPax}
					options={capacityOptions}
				/>

				<CustomSelect
					id="trip-type"
					label="Trip Type"
					bind:value={filterTripType}
					options={tripTypeOptions}
				/>
			</div>
		</div>

		<!-- Encouraging Banner when no date selected -->
		{#if !searchDate}
			<div class="encouragement-banner glass">
				<div class="banner-content">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="banner-icon">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
					</svg>
					<div>
						<h3>Showing Active Shared Charters Looking for a Group</h3>
						<p>Want to open a new trip or see all charter options? <strong>Select a Trip Date</strong> in the filters above to unlock all available charters for your date!</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Suggestions Section -->
		{#if suggestedTrips.length > 0}
			<div class="suggestions-panel glass glow-secondary">
				<div class="suggestions-header">
					<span class="pulse-dot"></span>
					<div>
						<h2>Suggested Trips to Join</h2>
						<p>These active charters are scheduled within 3 days of your searched date. Join one of them to complete the booking!</p>
					</div>
				</div>

				<div class="suggestions-grid">
					{#each suggestedTrips as trip (trip.id)}
						{@const template = data.listings.find(l => l.id === trip.listing_template_id)}
						{#if template}
							<div class="suggestion-card glass">
								<div class="suggestion-info">
									<div class="suggestion-meta">
										<span class="suggestion-badge">Active Group</span>
										<span class="suggestion-date">{formatDateDisplay(trip.date)}</span>
									</div>
									<h4>{template.trip_type}</h4>
									<p class="suggestion-loc">{template.location} — {template.meeting_area}</p>
									<p class="suggestion-price">${Math.round(template.low_price / 2)} – ${Math.round(template.high_price / 2)} <span class="price-lbl">/ group</span></p>
								</div>
								<a href="/browse/{template.id}?date={trip.date}" class="btn btn-join">
									Join Group
								</a>
							</div>
						{/if}
					{/each}
				</div>
			</div>
		{/if}

		<!-- Listing Cards Grid -->
		{#if filteredListings.length === 0}
			<div class="empty-state glass">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-12 h-12 empty-icon">
					<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.008 1.24l.885 1.77a2.25 2.25 0 002.007 1.24h1.98a2.25 2.25 0 002.007-1.24l.885-1.77a2.25 2.25 0 012.007-1.24h3.86m-18 0h18a2.25 2.25 0 012.25 2.25v4.25a2.25 2.25 0 01-2.25 2.25H2.25A2.25 2.25 0 010 20v-4.25a2.25 2.25 0 012.25-2.25z" />
				</svg>
				{#if !searchDate}
					<h3>No Active Shared Charters Found</h3>
					<p>There are currently no half-filled charters matching these filters. Select a <strong>Trip Date</strong> in the filters above to explore all charter templates and open a new booking!</p>
				{:else}
					<h3>No Charters Match Your Search</h3>
					<p>Try resetting the filters or selecting a different date.</p>
				{/if}
			</div>
		{:else}
			<div class="cards-grid">
				{#each filteredListings as listing (listing.id)}
					{@const locParts = parseLocation(listing.location)}
					<div class="listing-card glass glass-interactive" class:matched-card={listing.matchedInstance}>
						<div class="card-header">
							<span class="location-badge">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 location-icon">
									<path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
									<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
								</svg>
								<div class="location-text-group">
									<span class="location-main">{locParts.main}</span>
									{#if locParts.details}
										<span class="location-details">{locParts.details}</span>
									{/if}
								</div>
							</span>
							{#if listing.matchedInstance}
								<span class="active-badge">1 spot left</span>
							{:else}
								<span class="pax-badge">{listing.max_passengers} Max Pax</span>
							{/if}
						</div>

						<div class="card-body">
							<div class="title-row">
								<h3>{listing.trip_type}</h3>
								{#if listing.matchedInstance}
									<span class="date-badge">{formatDateDisplay(listing.matchedInstance.date)}</span>
								{:else if searchDate}
									<span class="date-badge">{formatDateDisplay(searchDate)}</span>
								{/if}
							</div>
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
							<a href="/browse/{listing.id}{listing.matchedInstance ? `?date=${listing.matchedInstance.date}` : (searchDate ? `?date=${searchDate}` : '')}" class="btn {listing.matchedInstance ? 'btn-join' : 'btn-book'}">
								{listing.matchedInstance ? 'Join Group' : 'Book Charter'}
							</a>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.controls-card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--border-light);
	}
	.controls-title {
		font-size: 0.85rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--text-secondary);
	}
	.btn-clear-all {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: rgba(6, 182, 212, 0.08);
		border: 1px solid rgba(6, 182, 212, 0.25);
		color: var(--primary);
		padding: 5px 12px;
		border-radius: 6px;
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}
	.btn-clear-all:hover {
		background: rgba(6, 182, 212, 0.2);
		border-color: var(--primary);
		transform: translateY(-1px);
	}

	/* Date picker input styling */
	.date-input-field {
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid var(--border-light);
		border-radius: 8px;
		color: var(--text-primary);
		font-family: var(--font-body);
		font-size: 0.95rem;
		padding: 9px 14px;
		width: 100%;
		outline: none;
		transition: border-color 0.2s;
	}
	.date-input-field:focus {
		border-color: var(--primary);
	}

	/* Encouragement Banner */
	.encouragement-banner {
		padding: 1.25rem 1.75rem;
		margin-bottom: 2.5rem;
		border-radius: 12px;
		background: linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(99, 102, 241, 0.08));
		border: 1px solid var(--border-glow);
	}
	.banner-content {
		display: flex;
		align-items: center;
		gap: 1.25rem;
	}
	.banner-icon {
		width: 32px;
		height: 32px;
		color: var(--primary);
		flex-shrink: 0;
	}
	.banner-content h3 {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 2px;
	}
	.banner-content p {
		font-size: 0.9rem;
		color: var(--text-secondary);
	}
	.banner-content strong {
		color: var(--primary);
	}

	/* Suggestions Panel */
	.suggestions-panel {
		border: 1px solid rgba(99, 102, 241, 0.2);
		padding: 1.25rem;
		margin-bottom: 2rem;
		border-radius: 12px;
		background: rgba(99, 102, 241, 0.02);
	}
	.suggestions-header {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		margin-bottom: 1rem;
	}
	.suggestions-header h2 {
		font-size: 1.35rem;
		font-weight: 800;
		color: var(--text-primary);
	}
	.suggestions-header p {
		font-size: 0.85rem;
		color: var(--text-secondary);
		margin-top: 2px;
	}
	.pulse-dot {
		width: 10px;
		height: 10px;
		background: var(--secondary);
		border-radius: 50%;
		flex-shrink: 0;
		margin-top: 6px;
		animation: pulse 2s infinite;
		box-shadow: 0 0 10px var(--secondary);
	}
	@keyframes pulse {
		0% {
			transform: scale(0.95);
			box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7);
		}
		70% {
			transform: scale(1);
			box-shadow: 0 0 0 8px rgba(99, 102, 241, 0);
		}
		100% {
			transform: scale(0.95);
			box-shadow: 0 0 0 0 rgba(99, 102, 241, 0);
		}
	}
	.suggestions-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1rem;
	}
	.suggestion-card {
		border: 1px solid var(--border-light);
		padding: 1rem;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 1rem;
		transition: border-color 0.2s;
		max-width: 380px;
	}
	.suggestion-card:hover {
		border-color: rgba(99, 102, 241, 0.4);
	}
	.suggestion-info h4 {
		font-size: 1.15rem;
		font-weight: 700;
		margin-bottom: 6px;
	}
	.suggestion-loc {
		font-size: 0.85rem;
		color: var(--text-secondary);
		margin-bottom: 12px;
	}
	.suggestion-price {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--primary);
	}
	.suggestion-price .price-lbl {
		font-size: 0.8rem;
		color: var(--text-muted);
		font-weight: 400;
	}
	.suggestion-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10px;
	}
	.suggestion-badge {
		background: rgba(99, 102, 241, 0.15);
		color: #818cf8;
		border: 1px solid rgba(99, 102, 241, 0.3);
		padding: 2px 8px;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	.suggestion-date {
		font-size: 0.95rem;
		color: var(--text-secondary);
		font-weight: 700;
	}



	/* Card Badge customizations */
	.active-badge {
		background: rgba(99, 102, 241, 0.12);
		color: #a5b4fc;
		border: 1px solid rgba(99, 102, 241, 0.3);
		padding: 2px 8px;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	.date-badge {
		background: rgba(6, 182, 212, 0.12);
		border: 1px solid rgba(6, 182, 212, 0.3);
		color: var(--primary);
		padding: 2px 8px;
		border-radius: 6px;
		font-size: 0.78rem;
		font-weight: 600;
		white-space: nowrap;
	}
	.title-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 12px;
		margin-bottom: 8px;
	}
	.title-row h3 {
		margin-bottom: 0 !important;
	}
	.matched-card {
		border-color: rgba(99, 102, 241, 0.3) !important;
		background: rgba(99, 102, 241, 0.01) !important;
	}
	.matched-card:hover {
		border-color: var(--secondary) !important;
		box-shadow: 0 12px 40px 0 rgba(99, 102, 241, 0.15) !important;
	}

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
		flex-direction: column;
		gap: 1.25rem;
		padding: 1.5rem;
		margin-bottom: 3rem;
		border: 1px solid var(--border-light);
		position: relative;
		z-index: 50;
	}
	.controls-card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--border-light);
	}
	.controls-title-group {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.controls-title {
		font-size: 0.85rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 1px;
		color: var(--primary);
	}
	.btn-clear-all {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid var(--border-light);
		color: var(--text-secondary);
		padding: 6px 12px;
		border-radius: 6px;
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}
	.btn-clear-all:hover {
		background: rgba(239, 68, 68, 0.12);
		border-color: rgba(239, 68, 68, 0.3);
		color: var(--danger);
	}
	.filters-group {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
		gap: 1.25rem;
		width: 100%;
		align-items: flex-end;
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

	/* Grid and Cards */
	.cards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.25rem;
	}
	.listing-card {
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		border: 1px solid var(--border-light);
		min-height: 320px;
	}
	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}
	.location-badge {
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid var(--border-light);
		padding: 5px 10px;
		border-radius: 8px;
		display: inline-flex;
		align-items: center;
		gap: 8px;
	}
	.location-icon {
		flex-shrink: 0;
		color: var(--primary);
	}
	.location-text-group {
		display: flex;
		flex-direction: column;
		line-height: 1.2;
	}
	.location-main {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--text-primary);
	}
	.location-details {
		font-size: 0.72rem;
		color: var(--text-muted);
		font-weight: 400;
	}
	.label-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.clear-date-btn {
		background: none;
		border: none;
		color: var(--primary);
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		padding: 0;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	.clear-date-btn:hover {
		text-decoration: underline;
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
		margin-bottom: 1rem;
	}
	.card-body h3 {
		font-size: 1.2rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
		letter-spacing: -0.2px;
	}
	.description {
		font-size: 0.85rem;
		color: var(--text-secondary);
		line-height: 1.4;
		margin-bottom: 0.75rem;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.meta-row {
		display: flex;
		gap: 1.25rem;
		border-top: 1px solid var(--border-light);
		padding-top: 0.75rem;
		margin-top: auto;
	}
	.meta-item {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.meta-label {
		font-size: 0.7rem;
		color: var(--text-muted);
		text-transform: uppercase;
		font-weight: 600;
		letter-spacing: 0.5px;
	}
	.meta-value {
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--text-primary);
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
	}

	.card-footer {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.75rem;
		border-top: 1px solid var(--border-light);
		padding-top: 1rem;
	}
	.price-info {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		text-align: left;
	}
	.price-split {
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: 1.15rem;
		color: var(--text-primary);
	}
	.per-group {
		font-size: 0.7rem;
		color: var(--text-muted);
		font-weight: 400;
		font-family: var(--font-body);
	}
	.price-total {
		font-size: 0.7rem;
		color: var(--text-muted);
		margin-top: 1px;
	}

	/* Centered custom pill buttons */
	.btn-join {
		background: linear-gradient(135deg, #818cf8, var(--secondary));
		color: #ffffff !important;
		font-weight: 700;
		text-transform: uppercase;
		font-size: 0.85rem;
		letter-spacing: 0.8px;
		padding: 10px 20px;
		border-radius: 30px;
		min-width: 130px;
		text-align: center;
		border: 1px solid rgba(255, 255, 255, 0.15);
		box-shadow: 0 0 15px rgba(99, 102, 241, 0.4);
		transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		align-self: center;
	}
	.btn-join:hover {
		transform: translateY(-2px) scale(1.03);
		box-shadow: 0 0 25px rgba(99, 102, 241, 0.65);
	}

	.btn-book {
		background: linear-gradient(135deg, var(--primary), var(--primary-hover));
		color: #060913 !important;
		font-weight: 800;
		text-transform: uppercase;
		font-size: 0.85rem;
		letter-spacing: 0.8px;
		padding: 10px 20px;
		border-radius: 30px;
		min-width: 130px;
		text-align: center;
		box-shadow: 0 4px 15px rgba(6, 182, 212, 0.25);
		transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		align-self: center;
	}
	.btn-book:hover {
		transform: translateY(-2px) scale(1.03);
		box-shadow: 0 6px 20px rgba(6, 182, 212, 0.45);
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
			padding: 1.5rem 0.75rem;
		}
		.cards-grid {
			grid-template-columns: 1fr;
			gap: 1rem;
		}
		.listing-card {
			padding: 1rem;
		}
		.card-footer {
			gap: 0.5rem;
		}
		.filters-group {
			flex-direction: column;
			gap: 1rem;
		}
	}
</style>
