<script lang="ts">
	import { deserialize, enhance } from '$app/forms';

	let { data } = $props();

	// Search & filtering state
	let searchQuery = $state('');
	let selectedStatus = $state('all');
	let selectedTripType = $state('all');
	let selectedLocation = $state('all');

	// Unique trip types & locations derived from listing templates
	let availableTripTypes = $derived(
		Array.from(new Set(data.listingTemplates.map((t: any) => t.trip_type))).sort()
	);
	let availableLocations = $derived(
		Array.from(new Set(data.listingTemplates.map((t: any) => t.location))).sort()
	);

	// Current date in YYYY-MM-DD format for past-due calculations
	const todayDateStr = new Date().toISOString().slice(0, 10);

	function isTripPastDue(trip: any): boolean {
		if (!trip?.date) return false;
		const isFinished = trip.status === 'completed' || trip.status === 'canceled';
		return !isFinished && trip.date < todayDateStr;
	}

	let hideFinished = $state(true);
	let filterNeedsAttentionOnly = $state(false);

	let attentionTripsCount = $derived(
		data.trips.filter((t: any) => isTripPastDue(t)).length
	);

	let hasActiveFilters = $derived(
		searchQuery.trim() !== '' ||
		selectedStatus !== 'all' ||
		selectedTripType !== 'all' ||
		selectedLocation !== 'all' ||
		!hideFinished ||
		filterNeedsAttentionOnly
	);

	function resetFilters() {
		searchQuery = '';
		selectedStatus = 'all';
		selectedTripType = 'all';
		selectedLocation = 'all';
		hideFinished = true;
		filterNeedsAttentionOnly = false;
	}

	// Admin Trip Cancel modal state
	let cancelingTrip = $state<any>(null);
	let cancelWithRefund = $state(true);
	let cancelReason = $state('');
	let cancelingInProgress = $state(false);
	let cancelError = $state<string | null>(null);

	// Status Explanation modal state
	let showStatusHelpModal = $state(false);

	// Expanded trip ids tracking
	let expandedTripIds = $state(new Set<string>());

	// Communication logs drawer state
	let showDrawer = $state(false);
	let selectedCustomer = $state<{ name: string; email: string; phone: string | null } | null>(null);
	let selectedTrip = $state<any>(null);
	let loadingLogs = $state(false);
	let logs = $state<any[]>([]);

	// Copy link feedback state
	let copiedTripId = $state<string | null>(null);

	function copyTripLink(trip: any) {
		if (!trip) return;
		const templateId = trip.listing_template_id || trip.listing_templates?.id;
		const date = trip.date;
		if (!templateId || !date) return;

		const url = `${window.location.origin}/browse/${templateId}?date=${date}`;

		if (navigator?.clipboard?.writeText) {
			navigator.clipboard.writeText(url).then(() => {
				copiedTripId = trip.id;
				setTimeout(() => {
					if (copiedTripId === trip.id) copiedTripId = null;
				}, 2000);
			}).catch(() => {
				fallbackCopyTextToClipboard(url, trip.id);
			});
		} else {
			fallbackCopyTextToClipboard(url, trip.id);
		}
	}

	function fallbackCopyTextToClipboard(text: string, tripId: string) {
		const textArea = document.createElement('textarea');
		textArea.value = text;
		textArea.style.position = 'fixed';
		textArea.style.left = '-999999px';
		document.body.appendChild(textArea);
		textArea.focus();
		textArea.select();
		try {
			document.execCommand('copy');
			copiedTripId = tripId;
			setTimeout(() => {
				if (copiedTripId === tripId) copiedTripId = null;
			}, 2000);
		} catch (err) {
			console.error('Fallback copy failed', err);
		}
		document.body.removeChild(textArea);
	}

	// Derived filtered trips based on status, trip type, location, hideFinished, and search query
	let filteredTrips = $derived(
		data.trips.filter((t: any) => {
			if (filterNeedsAttentionOnly) {
				if (!isTripPastDue(t)) return false;
			} else if (hideFinished) {
				if (t.status === 'completed' || t.status === 'canceled') return false;
			}

			const statusMatch = selectedStatus === 'all' || t.status === selectedStatus;
			const tripTypeMatch = selectedTripType === 'all' || t.listing_templates?.trip_type === selectedTripType;
			const locationMatch = selectedLocation === 'all' || t.listing_templates?.location === selectedLocation;

			let searchMatch = true;
			const query = searchQuery.toLowerCase().trim();
			if (query) {
				const customerMatch = t.bookings?.some((b: any) => 
					(b.id && b.id.toLowerCase().includes(query)) ||
					b.customers?.name?.toLowerCase().includes(query) ||
					b.customers?.email?.toLowerCase().includes(query) ||
					b.customers?.phone?.includes(query)
				);
				const captainMatch = t.captains?.name?.toLowerCase().includes(query);
				const queryTripTypeMatch = t.listing_templates?.trip_type?.toLowerCase().includes(query);
				const queryLocationMatch = t.listing_templates?.location?.toLowerCase().includes(query);
				searchMatch = !!(customerMatch || captainMatch || queryTripTypeMatch || queryLocationMatch || (t.id && t.id.toLowerCase().includes(query)));
			}

			return statusMatch && tripTypeMatch && locationMatch && searchMatch;
		})
		.sort((a: any, b: any) => {
			const dateCompare = (a.date || '').localeCompare(b.date || '');
			if (dateCompare !== 0) {
				return dateCompare;
			}
			const createdA = a.created_at ? new Date(a.created_at).getTime() : 0;
			const createdB = b.created_at ? new Date(b.created_at).getTime() : 0;
			return createdB - createdA;
		})
	);

	// Auto-expand matched trip rows when searching
	$effect(() => {
		const query = searchQuery.toLowerCase().trim();
		if (query && filteredTrips.length > 0) {
			const newSet = new Set<string>();
			for (const t of filteredTrips) {
				newSet.add(t.id);
			}
			expandedTripIds = newSet;
		}
	});

	function formatDate(dateStr: string) {
		if (!dateStr) return 'N/A';
		return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
			month: '2-digit',
			day: '2-digit',
			year: '2-digit'
		});
	}

	function formatDateTime(dateTimeStr: string) {
		if (!dateTimeStr) return 'N/A';
		const d = new Date(dateTimeStr);
		const date = d.toLocaleDateString('en-US', {
			month: '2-digit',
			day: '2-digit',
			year: '2-digit'
		});
		const time = d.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit'
		});
		return `${date}, ${time}`;
	}

	function toggleTrip(tripId: string) {
		if (expandedTripIds.has(tripId)) {
			expandedTripIds.delete(tripId);
		} else {
			expandedTripIds.add(tripId);
		}
		// Svelte 5 Set reactivity helper
		expandedTripIds = new Set(expandedTripIds);
	}

	function expandAll() {
		expandedTripIds = new Set(filteredTrips.map((t: any) => t.id));
	}

	function collapseAll() {
		expandedTripIds = new Set();
	}

	async function openCommunications(customer: any, trip: any) {
		selectedCustomer = customer;
		selectedTrip = trip;
		showDrawer = true;
		loadingLogs = true;
		logs = [];

		try {
			const formData = new FormData();
			if (customer.email) formData.append('email', customer.email);
			if (customer.phone) formData.append('phone', customer.phone);
			if (trip?.date) formData.append('tripDate', trip.date);
			if (trip?.id) formData.append('tripId', trip.id);

			const response = await fetch('?/getLogs', {
				method: 'POST',
				body: formData
			});
			const result = deserialize(await response.text()) as any;
			if (result.type === 'success' && result.data?.logs) {
				logs = result.data.logs;
			} else {
				console.error('Error fetching logs:', result);
			}
		} catch (err) {
			console.error(err);
		} finally {
			loadingLogs = false;
		}
	}

	let showCaptainsLogModal = $state(false);
	let loadingCaptainsLog = $state(false);
	let captainsLogData = $state<any>(null);
	let selectedCaptainsLogTrip = $state<any>(null);
	let blastingInProgress = $state(false);
	let copiedClaimUrlId = $state<string | null>(null);
	let copiedDetailsUrl = $state(false);

	function copyClaimUrl(audit: any) {
		if (!audit?.claimUrl) return;
		if (navigator?.clipboard?.writeText) {
			navigator.clipboard.writeText(audit.claimUrl).then(() => {
				copiedClaimUrlId = audit.id;
				setTimeout(() => {
					if (copiedClaimUrlId === audit.id) copiedClaimUrlId = null;
				}, 2000);
			}).catch(() => {
				fallbackCopyTextToClipboard(audit.claimUrl, audit.id);
			});
		} else {
			fallbackCopyTextToClipboard(audit.claimUrl, audit.id);
		}
	}

	async function openCaptainsLog(trip: any) {
		selectedCaptainsLogTrip = trip;
		showCaptainsLogModal = true;
		loadingCaptainsLog = true;
		captainsLogData = null;

		try {
			const formData = new FormData();
			formData.append('tripId', trip.id);

			const response = await fetch('?/getCaptainsLog', {
				method: 'POST',
				body: formData
			});
			const result = deserialize(await response.text()) as any;
			if (result.type === 'success' && result.data) {
				captainsLogData = result.data;
			} else {
				console.error('Error fetching Captain Log data:', result);
			}
		} catch (err) {
			console.error(err);
		} finally {
			loadingCaptainsLog = false;
		}
	}
</script>

<svelte:head>
	<title>Trips & Bookings — SplitACharter</title>
</svelte:head>

<div class="admin-header">
	<div>
		<span class="subtitle">Operations Overview</span>
		<h1>Trips & Bookings</h1>
	</div>
</div>

<!-- Advanced Filter Panel -->
<div class="control-row glass">
	<div class="filters-grid">
		<div class="filter-group">
			<label for="search-filter">Search:</label>
			<input
				id="search-filter"
				type="text"
				placeholder="Search booking ref #, customer, captain, location..."
				bind:value={searchQuery}
				class="search-input"
			/>
		</div>

		<div class="filter-group">
			<label for="trip-type-filter">Trip Type:</label>
			<select id="trip-type-filter" bind:value={selectedTripType}>
				<option value="all">All Trip Types</option>
				{#each availableTripTypes as type}
					<option value={type}>{type}</option>
				{/each}
			</select>
		</div>

		<div class="filter-group">
			<label for="location-filter">Location:</label>
			<select id="location-filter" bind:value={selectedLocation}>
				<option value="all">All Locations</option>
				{#each availableLocations as loc}
					<option value={loc}>{loc}</option>
				{/each}
			</select>
		</div>

		<div class="filter-group">
			<span class="filter-label">Archive View:</span>
			<label class="checkbox-toggle-label">
				<input type="checkbox" bind:checked={hideFinished} />
				<span>Hide Completed & Canceled</span>
			</label>
		</div>

		{#if attentionTripsCount > 0}
			<div class="filter-group">
				<span class="filter-label-placeholder" aria-hidden="true">&nbsp;</span>
				<button
					type="button"
					class="btn btn-attention-filter {filterNeedsAttentionOnly ? 'active' : ''}"
					onclick={() => (filterNeedsAttentionOnly = !filterNeedsAttentionOnly)}
					title="Click to toggle filtering for trips needing attention"
				>
					<svg class="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
					</svg>
					{attentionTripsCount} Trip{attentionTripsCount > 1 ? 's' : ''} Need Attention
				</button>
			</div>
		{/if}

		{#if hasActiveFilters}
			<div class="filter-group filter-actions">
				<span class="filter-label-placeholder" aria-hidden="true">&nbsp;</span>
				<button
					type="button"
					class="btn btn-secondary clear-filters-btn"
					onclick={resetFilters}
					title="Clear all active filters"
				>
					<svg class="clear-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
					Clear Filters
				</button>
			</div>
		{/if}
	</div>
</div>

<!-- Master Trips Table -->
<div class="table-container glass">
	{#if filteredTrips.length === 0}
		<div class="empty-state">
			<p>No trip instances match the filters.</p>
		</div>
	{:else}
		<table class="admin-table">
			<thead>
				<tr>
					<th style="width: 70px;">
						<div class="table-header-expand-actions">
							<button
								type="button"
								class="header-action-btn"
								onclick={expandAll}
								disabled={filteredTrips.length === 0 || expandedTripIds.size === filteredTrips.length}
								title="Expand All Rows"
								aria-label="Expand All Rows"
							>
								<svg class="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
								</svg>
							</button>
							<button
								type="button"
								class="header-action-btn"
								onclick={collapseAll}
								disabled={expandedTripIds.size === 0}
								title="Collapse All Rows"
								aria-label="Collapse All Rows"
							>
								<svg class="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
								</svg>
							</button>
						</div>
					</th>
					<th>Date</th>
					<th>Charter Specs</th>
					<th>Assigned Captain</th>
					<th>Bookings</th>
					<th>
						<div class="th-with-help">
							<span>Status</span>
							<button
								type="button"
								class="help-icon-btn"
								onclick={() => (showStatusHelpModal = true)}
								title="Click for Status definitions"
								aria-label="Status Definitions Help"
							>
								<svg class="help-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<circle cx="12" cy="12" r="10" />
									<path stroke-linecap="round" stroke-linejoin="round" d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
									<line x1="12" y1="17" x2="12.01" y2="17" stroke-width="3" stroke-linecap="round" />
								</svg>
							</button>
						</div>
					</th>
					<th style="width: 110px;">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each filteredTrips as trip (trip.id)}
					{@const template = (Array.isArray(trip.listing_templates) ? trip.listing_templates[0] : trip.listing_templates) as any}
					{@const captain = (Array.isArray(trip.captains) ? trip.captains[0] : trip.captains) as any}
					{@const activeBookingsCount = trip.bookings?.filter((b: any) => b.status !== 'canceled' && b.status !== 'forfeited')?.length || 0}
					{@const bookingsCount = trip.bookings?.length || 0}
					{@const isExpanded = expandedTripIds.has(trip.id)}
					{@const pastDue = isTripPastDue(trip)}

					<tr class="master-row {pastDue ? 'row-past-due' : ''}" onclick={() => toggleTrip(trip.id)}>
						<td>
							<button class="expand-btn" aria-label="Toggle Details">
								<svg class="chevron-icon {isExpanded ? 'rotated' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
								</svg>
							</button>
						</td>
						<td>
							<span class="date">{formatDate(trip.date)}</span>
						</td>
						<td>
							<div class="trip-info">
								<span class="type">{template?.trip_type || 'Unknown'}</span>
								<span class="loc">{template?.location || 'Unknown'}</span>
							</div>
						</td>
						<td>
							{#if captain}
								<span class="name">{captain.name}</span>
							{:else}
								<span class="no-captain">Unassigned</span>
							{/if}
						</td>
						<td>
							<span class="badge badge-count">{activeBookingsCount} / 2 Active</span>
						</td>
						<td>
							<div class="status-wrapper">
								<span class="badge status-badge trip-{trip.status}">
									{#if trip.status === 'open'}
										Open
									{:else if trip.status === 'half-booked'}
										Half-Booked
									{:else if trip.status === 'pending-reconfirm'}
										Pending Reconfirm
									{:else if trip.status === 'confirmed'}
										Confirmed
									{:else if trip.status === 'completed'}
										Completed
									{:else if trip.status === 'canceled'}
										Canceled
									{:else}
										{trip.status}
									{/if}
								</span>
								{#if pastDue}
									<span class="badge badge-attention" title="Trip date has passed without being Completed or Canceled">
										<svg class="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
											<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
										</svg>
										Needs Attention
									</span>
								{/if}
							</div>
						</td>
						<td>
							<div class="row-actions" onclick={(e) => e.stopPropagation()} role="presentation">
								<button
									type="button"
									class="btn btn-xs {copiedTripId === trip.id ? 'btn-copied' : 'btn-share-link'}"
									onclick={() => copyTripLink(trip)}
									title="Copy share link for social media"
								>
									{#if copiedTripId === trip.id}
										<svg class="icon w-3.5 h-3.5 inline mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
											<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
										</svg>
										Copied!
									{:else}
										<svg class="icon w-3.5 h-3.5 inline mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
										</svg>
										Share Link
									{/if}
								</button>
								{#if trip.status === 'confirmed' || trip.status === 'completed'}
									<button
										type="button"
										class="btn btn-xs btn-primary btn-captains-log"
										onclick={() => openCaptainsLog(trip)}
									>
										<svg class="icon w-3.5 h-3.5 inline mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
										</svg>
										Captain's Log
									</button>
								{/if}
								{#if trip.status !== 'canceled' && trip.status !== 'completed'}
									<button
										type="button"
										class="btn btn-xs btn-danger btn-cancel-trip"
										onclick={() => {
											cancelingTrip = trip;
											cancelWithRefund = true;
											cancelReason = '';
											cancelError = null;
										}}
									>
										Cancel Trip
									</button>
								{/if}
							</div>
						</td>
					</tr>

					<!-- Expandable Nested Bookings Row -->
					{#if isExpanded}
						<tr class="nested-row">
							<td colspan="7">
								<div class="nested-container glass">
									<div class="nested-title-bar">
										<h4>Customer Bookings for this Trip</h4>
										{#if trip.status === 'confirmed' || trip.status === 'completed'}
											<button
												type="button"
												class="btn btn-xs btn-primary btn-captains-log"
												onclick={() => openCaptainsLog(trip)}
											>
												<svg class="icon w-3.5 h-3.5 inline mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
													<path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
												</svg>
												Captain's Log
											</button>
										{/if}
									</div>
									{#if bookingsCount === 0}
										<p class="nested-empty">No customers have signed up for this trip instance yet.</p>
									{:else}
										<table class="nested-table">
											<thead>
												<tr>
													<th>Customer Name</th>
													<th>Contact Details</th>
													<th>Group Size</th>
													<th>Booking Status</th>
													<th>Created Date</th>
													<th>Communications</th>
												</tr>
											</thead>
											<tbody>
												{#each trip.bookings as booking (booking.id)}
													{@const customer = (Array.isArray(booking.customers) ? booking.customers[0] : booking.customers) as any}
													{@const formattedDate = formatDateTime(booking.created_at)}
													<tr>
														<td>
															<span class="nested-name">{customer?.name || 'N/A'}</span>
														</td>
														<td>
															<div class="nested-contact">
																<span>{customer?.email || 'N/A'}</span>
																<span class="phone">{customer?.phone || 'N/A'}</span>
															</div>
														</td>
														<td>
															<span class="badge badge-size">{booking.group_size} Pax</span>
														</td>
														<td>
															<span class="badge status-badge booking-{booking.status}">{booking.status}</span>
														</td>
														<td>
															<span class="created-at">{formattedDate}</span>
														</td>
														<td>
															{#if customer}
																<button 
																	class="btn btn-secondary btn-xs"
																	onclick={(e) => { e.stopPropagation(); openCommunications(customer, trip); }}
																>
																	<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
																		<path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
																	</svg>
																	View History
																</button>
															{:else}
																<span class="no-customer">N/A</span>
															{/if}
														</td>
													</tr>
												{/each}
											</tbody>
										</table>
									{/if}
								</div>
							</td>
						</tr>
					{/if}
				{/each}
			</tbody>
		</table>
	{/if}
</div>

<!-- Communications Slide-over Drawer -->
{#if showDrawer}
	<!-- Backdrop -->
	<button class="drawer-backdrop" onclick={() => showDrawer = false} aria-label="Close panel"></button>

	<!-- Slide Panel -->
	<div class="drawer glass glow-primary">
		<div class="drawer-header">
			<div>
				<span class="drawer-subtitle">Trip Communications</span>
				<h2>{selectedCustomer?.name}</h2>
				<span class="drawer-email">{selectedCustomer?.email}</span>
				{#if selectedTrip}
					{@const template = (Array.isArray(selectedTrip.listing_templates) ? selectedTrip.listing_templates[0] : selectedTrip.listing_templates) as any}
					<p class="drawer-trip-ref">Trip: <strong>{template?.trip_type || 'Charter'}</strong> ({selectedTrip.date})</p>
				{/if}
			</div>
			<button class="close-btn" onclick={() => showDrawer = false} aria-label="Close Drawer">
				<svg class="close-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<div class="drawer-body">
			{#if loadingLogs}
				<div class="spinner-container">
					<div class="spinner"></div>
					<p>Loading trip communications...</p>
				</div>
			{:else if logs.length === 0}
				<p class="empty-state">No trip-related notifications or messages found for this customer.</p>
			{:else}
				<div class="timeline">
					{#each logs as log (log.id)}
						<div class="timeline-item">
							<div class="timeline-meta">
								<span class="timeline-channel badge channel-{log.channel}">{log.channel}</span>
								<span class="timeline-time">{new Date(log.timestamp).toLocaleString()}</span>
							</div>
							<div class="timeline-details">
								<span class="timeline-template">Template: <code>{log.template}</code></span>
								<p class="timeline-content">{log.content}</p>
								<span class="timeline-status status-{log.status}">{log.status}</span>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}

<!-- Captain's Log Audit Modal -->
{#if showCaptainsLogModal}
	<button class="drawer-backdrop" onclick={() => (showCaptainsLogModal = false)} aria-label="Close Captain's Log modal"></button>
	<div class="captains-log-modal glass glow-primary" role="dialog" aria-modal="true">
		<div class="modal-header">
			<div>
				<span class="drawer-subtitle">Skipper Dispatch Audit</span>
				<h2>Captain's Log</h2>
				{#if captainsLogData?.tripInfo}
					<p class="modal-trip-meta">
						<strong>{captainsLogData.tripInfo.tripType}</strong> — {formatDate(captainsLogData.tripInfo.date)} ({captainsLogData.tripInfo.location})
					</p>
				{/if}
			</div>
			<button class="close-btn" onclick={() => (showCaptainsLogModal = false)} aria-label="Close Modal">
				<svg class="close-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<div class="modal-body">
			{#if loadingCaptainsLog}
				<div class="spinner-container">
					<div class="spinner"></div>
					<p>Loading Captain's Log dispatch data...</p>
				</div>
			{:else if captainsLogData}
				{@const info = captainsLogData.tripInfo}
				{@const audits = captainsLogData.blastAudits || []}

				<!-- Summary Header Card -->
				<div class="log-summary-card glass">
					<div class="log-summary-grid">
						<div class="summary-col">
							<span class="summary-label">Trip Status</span>
							<span class="badge status-badge trip-{info.status}">{info.status}</span>
						</div>
						<div class="summary-col">
							<span class="summary-label">Assigned Skipper</span>
							<strong class="skipper-name">{info.assignedCaptain?.name || 'Unassigned'}</strong>
							{#if info.assignedCaptain?.phone}
								<span class="skipper-phone">{info.assignedCaptain.phone}</span>
							{/if}
						</div>
						<div class="summary-col">
							<span class="summary-label">Acceptance Timestamp</span>
							{#if info.acceptedTime}
								<span class="acceptance-time">{new Date(info.acceptedTime).toLocaleString()}</span>
							{:else}
								<span class="no-time">Pending Acceptance</span>
							{/if}
						</div>
					</div>
				</div>

				<!-- Winning Captain Claim & Contact Details Notification Banner -->
				{#if info.winningMessageDetails}
					<div class="winning-notification-card glass glow-primary">
						<div class="winning-card-header">
							<div class="winning-card-title">
								<svg class="winning-header-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								<strong>Winning Skipper Claim Notification</strong>
							</div>
							{#if info.winningMessageDetails.sentAt}
								<span class="winning-time">{new Date(info.winningMessageDetails.sentAt).toLocaleString()}</span>
							{/if}
						</div>
						<div class="winning-message-box">
							<span class="winning-message-label">Sent SMS Content:</span>
							<p class="winning-message-text">{info.winningMessageDetails.content}</p>
						</div>
						<div class="winning-card-footer">
							<span class="winning-note">
								ℹ️ The SMS sent to the skipper includes a direct link granting access to full customer contact details & passenger manifest.
							</span>
							{#if info.winningMessageDetails.detailsUrl}
								<button
									type="button"
									class="btn btn-xs btn-share-link"
									onclick={() => {
										if (navigator?.clipboard?.writeText) {
											navigator.clipboard.writeText(info.winningMessageDetails.detailsUrl);
											copiedDetailsUrl = true;
											setTimeout(() => (copiedDetailsUrl = false), 2000);
										}
									}}
								>
									{copiedDetailsUrl ? 'Copied Details Link!' : 'Copy Captain Details Link'}
								</button>
							{/if}
						</div>
					</div>
				{/if}

				<div class="audits-section">
					<div class="audits-section-header">
						<h3 class="section-title">Skipper Blast Delivery & Response History ({audits.length})</h3>
						{#if info.status === 'confirmed' || info.status === 'completed'}
							<form
								method="POST"
								action="?/triggerCaptainBlast"
								use:enhance={() => {
									blastingInProgress = true;
									return async ({ update }) => {
										await update();
										blastingInProgress = false;
										if (selectedCaptainsLogTrip) {
											openCaptainsLog(selectedCaptainsLogTrip);
										}
									};
								}}
								style="display: inline-block;"
							>
								<input type="hidden" name="tripId" value={info.id} />
								<button type="submit" class="btn btn-xs btn-primary btn-dispatch-blast" disabled={blastingInProgress}>
									{blastingInProgress ? 'Dispatching...' : 'Dispatch Captain Blast'}
								</button>
							</form>
						{/if}
					</div>
					{#if audits.length === 0}
						<div class="empty-log-box glass">
							<p class="empty-state-text">No captain blast logs recorded yet for this trip instance.</p>
							<p class="empty-state-sub">If this trip confirmed without a background worker active, click <strong>Dispatch Captain Blast</strong> above to send the blast notification to eligible captains.</p>
						</div>
					{:else}
						<table class="captains-log-table">
							<thead>
								<tr>
									<th>Captain Name</th>
									<th>Recipient Contact</th>
									<th>Blast Sent Time</th>
									<th>Delivery Status</th>
									<th>Outcome</th>
								</tr>
							</thead>
							<tbody>
								{#each audits as audit}
									<tr class:winner-row={audit.isWinner}>
										<td>
											<div class="captain-name-group" style="display: flex; align-items: center; gap: 6px;">
												<span class="captain-name">{audit.captainName}</span>
												{#if audit.claimUrl}
													<button
														type="button"
														class="btn-copy-claim-icon"
														class:copied={copiedClaimUrlId === audit.id}
														title={copiedClaimUrlId === audit.id ? 'Copied URL!' : 'Copy Trip Claim URL'}
														onclick={() => copyClaimUrl(audit)}
													>
														{#if copiedClaimUrlId === audit.id}
															<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="claim-icon-svg text-success">
																<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
															</svg>
														{:else}
															<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="claim-icon-svg">
																<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-1.5a2.251 2.251 0 00-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 00-9-9z" />
															</svg>
														{/if}
													</button>
												{/if}
											</div>
										</td>
										<td>
											<span class="recipient-contact">{audit.recipient}</span>
										</td>
										<td>
											<span class="sent-time">{new Date(audit.sentAt).toLocaleString()}</span>
										</td>
										<td>
											<span class="badge status-badge log-{audit.status}">{audit.status}</span>
										</td>
										<td>
											{#if audit.isWinner}
												<span class="badge badge-winner">
													<svg class="w-3 h-3 inline mr-0.5" viewBox="0 0 20 20" fill="currentColor">
														<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
													</svg>
													Secured
												</span>
											{:else}
												<span class="badge badge-unclaimed">Blast Sent</span>
											{/if}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					{/if}
				</div>
			{/if}
		</div>

		<div class="modal-footer">
			<button type="button" class="btn btn-secondary" onclick={() => (showCaptainsLogModal = false)}>
				Close Log
			</button>
		</div>
	</div>
{/if}

<!-- Admin Double Confirmation Cancellation Modal -->
{#if cancelingTrip}
	{@const modalTemplate = (Array.isArray(cancelingTrip.listing_templates) ? cancelingTrip.listing_templates[0] : cancelingTrip.listing_templates) as any}
	{@const modalBookings = cancelingTrip.bookings || []}
	
	<button class="drawer-backdrop" onclick={() => (cancelingTrip = null)} aria-label="Close modal"></button>
	<div class="admin-cancel-modal glass glow-danger" role="dialog" aria-modal="true">
		<div class="modal-header">
			<div>
				<span class="drawer-subtitle">Operations Overrides</span>
				<h2>Cancel Trip Instance</h2>
				<p class="modal-trip-meta">{modalTemplate?.trip_type || 'Charter'} — {formatDate(cancelingTrip.date)} ({modalTemplate?.location || 'Unknown'})</p>
			</div>
			<button class="close-btn" onclick={() => (cancelingTrip = null)} aria-label="Close Modal">
				<svg class="close-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<form
			method="POST"
			action="?/cancelTrip"
			use:enhance={() => {
				cancelingInProgress = true;
				cancelError = null;
				return async ({ result, update }) => {
					if (result.type === 'failure') {
						cancelError = (result.data as any)?.message || 'Failed to cancel trip instance.';
						cancelingInProgress = false;
					} else {
						await update();
						cancelingInProgress = false;
						cancelingTrip = null;
					}
				};
			}}
			class="modal-form"
		>
			<input type="hidden" name="tripId" value={cancelingTrip.id} />
			<input type="hidden" name="withRefund" value={cancelWithRefund ? 'true' : 'false'} />

			<div class="modal-body">
				{#if cancelError}
					<div class="modal-alert-box glow-danger" style="margin-bottom: 1rem; border-color: rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.1); color: #fca5a5;">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5" style="color: var(--danger); flex-shrink: 0;">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
						</svg>
						<span>{cancelError}</span>
					</div>
				{/if}
				<div class="affected-summary-card glass">
					<p class="affected-title"><strong>Affected Customer Bookings ({modalBookings.length}):</strong></p>
					{#if modalBookings.length === 0}
						<p class="no-bookings">No customer groups currently booked on this trip instance.</p>
					{:else}
						<ul class="customer-list">
							{#each modalBookings as b}
								{@const cust = (Array.isArray(b.customers) ? b.customers[0] : b.customers) as any}
								<li>
									<span><strong>{cust?.name || 'Customer'}</strong> ({cust?.email || 'N/A'})</span>
									<span class="badge badge-size">{b.group_size} Pax — {b.status}</span>
								</li>
							{/each}
						</ul>
					{/if}
				</div>

				<!-- Refund Option Selector -->
				<div class="form-group">
					<label class="form-label">Refund Policy for this Cancellation:</label>
					<div class="radio-options-grid">
						<button
							type="button"
							class="radio-card"
							class:active={cancelWithRefund}
							onclick={() => (cancelWithRefund = true)}
						>
							<span class="radio-dot" class:selected={cancelWithRefund}></span>
							<div class="radio-content">
								<span class="radio-title">Cancel WITH Full Refund</span>
								<span class="radio-sub">Automatically records a $50.00 refund for each customer booking and notifies them via email/SMS.</span>
							</div>
						</button>

						<button
							type="button"
							class="radio-card"
							class:active={!cancelWithRefund}
							onclick={() => (cancelWithRefund = false)}
						>
							<span class="radio-dot" class:selected={!cancelWithRefund}></span>
							<div class="radio-content">
								<span class="radio-title">Cancel WITHOUT Refund</span>
								<span class="radio-sub">Cancels the trip instance without issuing refunds (fees forfeited per policy). Notifies customers.</span>
							</div>
						</button>
					</div>
				</div>

				<!-- Cancellation Reason Input -->
				<div class="form-group">
					<label for="cancel-reason" class="form-label">Reason for Cancellation (Required — Included in customer email):</label>
					<textarea
						id="cancel-reason"
						name="reason"
						bind:value={cancelReason}
						rows="3"
						placeholder="e.g. Small Craft Advisory issued due to high seas / vessel mechanical maintenance..."
						class="reason-textarea"
						required
					></textarea>
				</div>
			</div>

			<div class="modal-footer">
				<button type="button" class="btn btn-secondary" onclick={() => (cancelingTrip = null)} disabled={cancelingInProgress}>
					Keep Trip Active
				</button>
				<button type="submit" class="btn btn-danger" disabled={cancelingInProgress || !cancelReason.trim()}>
					{cancelingInProgress ? 'Processing Cancellation...' : 'Confirm & Cancel Trip'}
				</button>
			</div>
		</form>
	</div>
{/if}

<!-- Admin Delete Trip Instance Confirmation Modal -->
<!-- Trip Status Explanation Modal -->
{#if showStatusHelpModal}
	<button class="drawer-backdrop" onclick={() => (showStatusHelpModal = false)} aria-label="Close status help modal"></button>
	<div class="status-help-modal glass glow-primary" role="dialog" aria-modal="true">
		<div class="modal-header">
			<div>
				<span class="drawer-subtitle">State Machine Guide</span>
				<h2>Trip Status Definitions</h2>
				<p class="modal-subtext">Explanation of operational lifecycle states for charter trip instances.</p>
			</div>
			<button class="close-btn" onclick={() => (showStatusHelpModal = false)} aria-label="Close Modal">
				<svg class="close-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<div class="modal-body status-help-body">
			<div class="status-help-grid">
				<div class="status-help-item glass">
					<div class="status-item-header">
						<span class="badge status-badge trip-half-booked">Half-Booked</span>
						<span class="status-capacity">1 of 2 Groups</span>
					</div>
					<p class="status-desc">
						Created when the first customer group pays their $50 reservation fee. Waiting for a second group to join the charter.
					</p>
				</div>

				<div class="status-help-item glass">
					<div class="status-item-header">
						<span class="badge status-badge trip-pending-reconfirm">Pending Reconfirm</span>
						<span class="status-capacity">2 of 2 Groups Paid</span>
					</div>
					<p class="status-desc">
						Second customer group paid. Both groups are currently inside their reconfirmation window to confirm attendance before captain notification.
					</p>
				</div>

				<div class="status-help-item glass">
					<div class="status-item-header">
						<span class="badge status-badge trip-confirmed">Confirmed</span>
						<span class="status-capacity">Matched & Spawned</span>
					</div>
					<p class="status-desc">
						Both customer groups reconfirmed. Simultaneous captain text blast is initiated and a new open instance is auto-spawned.
					</p>
				</div>

				<div class="status-help-item glass">
					<div class="status-item-header">
						<span class="badge status-badge trip-completed">Completed</span>
						<span class="status-capacity">Trip Finished</span>
					</div>
					<p class="status-desc">
						A captain accepted the booking (first YES reply) and the trip charter has been successfully fulfilled.
					</p>
				</div>

				<div class="status-help-item glass">
					<div class="status-item-header">
						<span class="badge status-badge trip-canceled">Canceled</span>
						<span class="status-capacity">Refunded / Closed</span>
					</div>
					<p class="status-desc">
						Trip instance was canceled due to admin override, weather advisory, or lack of captain match by trip date.
					</p>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.th-with-help {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	.help-icon-btn {
		background: none;
		border: none;
		color: var(--text-muted);
		padding: 2px;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		transition: color 0.2s ease, transform 0.2s ease;
	}
	.help-icon-btn:hover {
		color: var(--primary);
		transform: scale(1.1);
	}
	.help-icon {
		width: 15px;
		height: 15px;
	}

	.status-help-modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 580px;
		max-width: 92vw;
		max-height: 85vh;
		background: var(--bg-surface);
		border: 1px solid var(--border-light);
		border-radius: 12px;
		z-index: 220;
		display: flex;
		flex-direction: column;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
		animation: modal-pop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
	}
	@keyframes modal-pop {
		from { opacity: 0; transform: translate(-50%, -46%) scale(0.96); }
		to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
	}
	.modal-subtext {
		font-size: 0.85rem;
		color: var(--text-muted);
		margin-top: 4px;
	}
	.status-help-body {
		padding: 1.25rem 1.5rem 1.5rem 1.5rem;
		overflow-y: auto;
	}
	.status-help-grid {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}
	.status-help-item {
		padding: 0.85rem 1.1rem;
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid var(--border-light);
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.status-item-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.status-capacity {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-muted);
	}
	.status-desc {
		font-size: 0.83rem;
		line-height: 1.45;
		color: var(--text-secondary);
		margin: 0;
	}

	.admin-header {
		margin-bottom: 2rem;
	}
	.subtitle {
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 1.5px;
		color: var(--primary);
		font-weight: 700;
	}
	.admin-header h1 {
		font-size: 2.25rem;
		font-weight: 800;
		letter-spacing: -0.5px;
		margin-top: 0.25rem;
	}

	.control-row {
		padding: 1.5rem;
		border: 1px solid var(--border-light);
		margin-bottom: 1.5rem;
	}
	.filters-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.25rem;
		align-items: center;
	}
	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.filter-label {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-secondary);
	}
	.checkbox-toggle-label {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.85rem;
		color: var(--text-primary);
		cursor: pointer;
		user-select: none;
		padding: 6px 0;
	}
	.checkbox-toggle-label input[type="checkbox"] {
		width: 16px;
		height: 16px;
		accent-color: var(--primary);
		cursor: pointer;
	}

	.btn-attention-filter {
		background: rgba(245, 158, 11, 0.12);
		color: var(--accent);
		border: 1px solid rgba(245, 158, 11, 0.3);
		font-size: 0.82rem;
		font-weight: 600;
		padding: 6px 12px;
		height: 37px;
		border-radius: 8px;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		transition: all 0.2s ease;
		cursor: pointer;
		white-space: nowrap;
	}
	.btn-attention-filter:hover, .btn-attention-filter.active {
		background: rgba(245, 158, 11, 0.25);
		border-color: var(--accent);
		color: #ffffff;
		box-shadow: 0 0 12px rgba(245, 158, 11, 0.2);
	}

	.status-wrapper {
		display: flex;
		flex-direction: column;
		gap: 6px;
		align-items: flex-start;
	}

	.badge-attention {
		background: rgba(239, 68, 68, 0.15);
		color: #fca5a5;
		border: 1px solid rgba(239, 68, 68, 0.35);
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 0.72rem;
		font-weight: 700;
		animation: pulse-border 2s infinite;
	}

	@keyframes pulse-border {
		0%, 100% { border-color: rgba(239, 68, 68, 0.35); }
		50% { border-color: var(--danger); box-shadow: 0 0 8px rgba(239, 68, 68, 0.3); }
	}

	.alert-icon {
		width: 13px;
		height: 13px;
		flex-shrink: 0;
	}

	.master-row.row-past-due {
		background: rgba(239, 68, 68, 0.03);
		border-left: 3px solid var(--danger);
	}
	.master-row.row-past-due:hover {
		background: rgba(239, 68, 68, 0.07);
	}
	.filter-group select, .search-input {
		width: 100%;
		padding: 8px 12px;
		font-size: 0.9rem;
	}
	.filter-label-placeholder {
		font-size: 0.8rem;
		user-select: none;
	}
	.clear-filters-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		height: 37px;
		padding: 0 14px;
		font-size: 0.85rem;
		white-space: nowrap;
		cursor: pointer;
		transition: all 0.2s ease;
		border-radius: 8px;
	}
	.clear-icon {
		width: 14px;
		height: 14px;
	}

	.table-header-expand-actions {
		display: inline-flex;
		align-items: center;
		gap: 4px;
	}
	.header-action-btn {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid var(--border-light);
		color: var(--text-secondary);
		width: 26px;
		height: 26px;
		min-width: 26px;
		min-height: 26px;
		border-radius: 6px;
		padding: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
	}
	.header-action-btn:hover:not(:disabled) {
		background: rgba(6, 182, 212, 0.15);
		color: var(--primary);
		border-color: rgba(6, 182, 212, 0.3);
	}
	.header-action-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
	.header-icon {
		width: 14px;
		height: 14px;
	}

	.table-container {
		border: 1px solid var(--border-light);
		overflow-x: auto;
	}
	.admin-table {
		width: 100%;
		border-collapse: collapse;
		text-align: left;
		font-size: 0.92rem;
	}
	.admin-table th {
		padding: 1rem 1.5rem;
		background: rgba(255, 255, 255, 0.02);
		border-bottom: 1px solid var(--border-light);
		font-weight: 600;
		color: var(--text-secondary);
	}
	.admin-table td {
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid var(--border-light);
		vertical-align: middle;
	}

	.master-row {
		cursor: pointer;
		transition: background-color 0.2s ease;
	}
	.master-row:hover {
		background-color: rgba(255, 255, 255, 0.02);
	}

	.expand-btn {
		background: none;
		border: none;
		color: var(--text-muted);
		padding: 0.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.chevron-icon {
		width: 18px;
		height: 18px;
		transition: transform 0.2s ease;
	}
	.chevron-icon.rotated {
		transform: rotate(90deg);
		color: var(--primary);
	}

	.trip-info {
		display: flex;
		flex-direction: column;
	}
	.trip-info .type {
		font-weight: 600;
		color: var(--text-primary);
	}
	.trip-info .loc {
		font-size: 0.8rem;
		color: var(--text-muted);
		margin-top: 2px;
	}

	.no-captain {
		color: var(--text-muted);
		font-style: italic;
		font-size: 0.85rem;
	}
	.date {
		font-weight: 600;
		color: var(--primary);
	}

	.badge {
		font-size: 0.78rem;
		padding: 3px 8px;
		border-radius: 4px;
		font-weight: 600;
		display: inline-block;
	}
	.badge-count {
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid var(--border-light);
		color: var(--text-secondary);
	}
	.badge-size {
		background: rgba(6, 182, 212, 0.06);
		color: var(--primary);
		border: 1px solid rgba(6, 182, 212, 0.15);
	}

	/* Status Badge Styles */
	.status-badge {
		text-transform: capitalize;
	}
	.trip-open { background: rgba(255, 255, 255, 0.04); color: var(--text-secondary); border: 1px solid var(--border-light); }
	.trip-half-booked { background: rgba(6, 182, 212, 0.1); color: var(--primary); border: 1px solid rgba(6, 182, 212, 0.2); }
	.trip-pending-reconfirm { background: rgba(99, 102, 241, 0.1); color: var(--secondary); border: 1px solid rgba(99, 102, 241, 0.2); }
	.trip-confirmed { background: rgba(16, 185, 129, 0.1); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.2); }
	.trip-completed { background: rgba(255, 255, 255, 0.02); color: var(--text-muted); border: 1px solid var(--border-light); }
	.trip-canceled { background: rgba(239, 68, 68, 0.1); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.2); }

	.booking-paid { background: rgba(16, 185, 129, 0.1); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.2); }
	.booking-pending-payment { background: rgba(245, 158, 11, 0.1); color: var(--accent); border: 1px solid rgba(245, 158, 11, 0.2); }
	.booking-awaiting-reconfirm { background: rgba(99, 102, 241, 0.1); color: var(--secondary); border: 1px solid rgba(99, 102, 241, 0.2); }
	.booking-reconfirmed { background: rgba(6, 182, 212, 0.1); color: var(--primary); border: 1px solid rgba(6, 182, 212, 0.2); }
	.booking-held { background: rgba(239, 68, 68, 0.1); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.2); }
	.booking-canceled, .booking-forfeited { background: rgba(255, 255, 255, 0.05); color: var(--text-muted); border: 1px solid var(--border-light); }

	/* Nested Table Styles */
	.nested-row td {
		padding: 0;
		background: var(--input-bg);
	}
	.nested-container {
		padding: 1.5rem;
		margin: 1rem 1.5rem 1.5rem 1.5rem;
		border-radius: 8px;
		border: 1px solid var(--border-light);
		background: var(--bg-surface);
	}
	.nested-container h4 {
		font-size: 1rem;
		margin-bottom: 1rem;
		color: var(--primary);
	}
	.nested-empty {
		font-style: italic;
		color: var(--text-muted);
		font-size: 0.85rem;
	}
	.nested-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.85rem;
	}
	.nested-table th {
		padding: 0.75rem 1rem;
		background: var(--input-focus-bg);
		border-bottom: 1px solid var(--border-light);
		color: var(--text-secondary);
	}
	.nested-table td {
		padding: 0.85rem 1rem;
		border-bottom: 1px solid var(--border-light);
	}
	.nested-table tr:last-child td {
		border-bottom: none;
	}
	.ref-code {
		font-family: monospace;
		font-size: 0.78rem;
		color: var(--primary);
		background: rgba(6, 182, 212, 0.08);
		padding: 3px 6px;
		border-radius: 4px;
		border: 1px solid rgba(6, 182, 212, 0.2);
		word-break: break-all;
		display: inline-block;
		max-width: 140px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.nested-name {
		font-weight: 600;
		color: var(--text-primary);
	}
	.nested-contact {
		display: flex;
		flex-direction: column;
		color: var(--text-secondary);
	}
	.nested-contact .phone {
		font-size: 0.75rem;
		color: var(--text-muted);
	}
	.row-actions {
		display: flex;
		flex-direction: column;
		gap: 6px;
		align-items: stretch;
	}
	.btn-cancel-trip, .btn-captains-log {
		font-size: 0.7rem !important;
		padding: 2px 6px !important;
		opacity: 0.85;
		margin-top: 2px;
	}
	.btn-cancel-trip:hover, .btn-captains-log:hover {
		opacity: 1;
	}

	.audits-section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}
	.btn-copy-claim-icon {
		background: rgba(6, 182, 212, 0.08);
		border: 1px solid rgba(6, 182, 212, 0.2);
		color: var(--primary);
		width: 22px;
		height: 22px;
		min-width: 22px;
		border-radius: 4px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		cursor: pointer;
		transition: all 0.2s ease;
	}
	.btn-copy-claim-icon:hover {
		background: rgba(6, 182, 212, 0.22);
		border-color: var(--primary);
		color: #ffffff;
		transform: scale(1.1);
	}
	.btn-copy-claim-icon.copied {
		background: rgba(16, 185, 129, 0.18);
		border-color: rgba(16, 185, 129, 0.4);
		color: var(--success);
	}
	.claim-icon-svg {
		width: 12px;
		height: 12px;
	}

	.winning-notification-card {
		padding: 1rem 1.25rem;
		border-radius: 8px;
		background: rgba(16, 185, 129, 0.04);
		border: 1px solid rgba(16, 185, 129, 0.2);
		margin-bottom: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.winning-card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.winning-card-title {
		font-size: 0.85rem;
		color: var(--text-primary);
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.winning-header-icon {
		width: 16px;
		height: 16px;
		color: var(--success);
	}
	.winning-time {
		font-size: 0.75rem;
		color: var(--text-muted);
	}
	.winning-message-box {
		background: rgba(16, 185, 129, 0.08);
		border: 1px solid rgba(16, 185, 129, 0.25);
		padding: 10px 14px;
		border-radius: 6px;
	}
	.winning-message-label {
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--text-muted);
		text-transform: uppercase;
		display: block;
		margin-bottom: 2px;
	}
	.winning-message-text {
		font-size: 0.82rem;
		color: var(--text-primary);
		margin: 0;
		line-height: 1.4;
		word-break: break-word;
	}
	.winning-card-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
	}
	.winning-note {
		font-size: 0.78rem;
		color: var(--text-secondary);
	}
	.btn-dispatch-blast {
		font-size: 0.75rem !important;
		padding: 4px 10px !important;
	}
	.empty-log-box {
		padding: 1.25rem;
		border: 1px solid var(--border-light);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.02);
		text-align: center;
		margin-top: 0.5rem;
	}
	.empty-state-text {
		font-weight: 600;
		color: var(--text-primary);
		font-size: 0.9rem;
		margin-bottom: 4px;
	}
	.empty-state-sub {
		font-size: 0.8rem;
		color: var(--text-secondary);
		margin: 0;
	}

	.btn-share-link {
		background: rgba(6, 182, 212, 0.1);
		color: var(--primary);
		border: 1px solid rgba(6, 182, 212, 0.25);
		font-weight: 600;
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 0.75rem;
		display: inline-flex;
		align-items: center;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}
	.btn-share-link:hover {
		background: rgba(6, 182, 212, 0.22);
		border-color: var(--primary);
		color: #ffffff;
		transform: translateY(-1px);
	}
	.btn-copied {
		background: rgba(16, 185, 129, 0.2);
		color: var(--success);
		border: 1px solid rgba(16, 185, 129, 0.4);
		font-weight: 700;
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 0.75rem;
		display: inline-flex;
		align-items: center;
		white-space: nowrap;
		animation: pulse-copy 0.2s ease-in-out;
	}
	@keyframes pulse-copy {
		0% { transform: scale(0.95); }
		50% { transform: scale(1.05); }
		100% { transform: scale(1); }
	}

	/* Slide Drawer & Modal Backdrop Styles */
	.drawer-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
		z-index: 200;
		border: none;
		border-radius: 0;
		cursor: default;
	}

	.drawer {
		position: fixed;
		top: 0;
		right: 0;
		width: 480px;
		max-width: 92vw;
		height: 100vh;
		background: var(--bg-surface);
		border-left: 1px solid var(--border-light);
		box-shadow: -10px 0 40px rgba(0, 0, 0, 0.6);
		z-index: 250;
		display: flex;
		flex-direction: column;
		animation: slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes slide-in {
		from {
			transform: translateX(100%);
		}
		to {
			transform: translateX(0);
		}
	}

	.drawer-header {
		padding: 1.5rem 1.75rem;
		border-bottom: 1px solid var(--border-light);
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		background: rgba(255, 255, 255, 0.01);
	}

	.drawer-subtitle {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--text-muted);
	}

	.drawer-email {
		font-size: 0.85rem;
		color: var(--primary);
		display: block;
		margin-top: 2px;
	}

	.drawer-trip-ref {
		font-size: 0.8rem;
		color: var(--text-secondary);
		margin-top: 4px;
	}

	.drawer-body {
		padding: 1.5rem 1.75rem;
		overflow-y: auto;
		flex: 1;
	}

	.spinner-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 0;
		gap: 1rem;
		color: var(--text-muted);
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid rgba(255, 255, 255, 0.1);
		border-top-color: var(--primary);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.timeline {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.timeline-item {
		padding: 1rem;
		background: var(--bg-surface);
		border: 1px solid var(--border-light);
		border-radius: 8px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.timeline-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.timeline-time {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.timeline-details {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.timeline-template {
		font-size: 0.8rem;
		color: var(--text-muted);
	}

	.timeline-content {
		font-size: 0.85rem;
		line-height: 1.5;
		color: var(--text-primary);
		background: rgba(6, 182, 212, 0.08);
		padding: 10px 14px;
		border-radius: 6px;
		border: 1px solid rgba(6, 182, 212, 0.22);
		white-space: pre-wrap;
		word-break: break-word;
	}

	.timeline-status {
		align-self: flex-start;
		font-size: 0.75rem;
	}

	.channel-email {
		background: rgba(6, 182, 212, 0.12);
		color: var(--primary);
	}
	.channel-sms {
		background: rgba(99, 102, 241, 0.12);
		color: var(--secondary);
	}

	.modal-header {
		padding: 1.5rem 1.75rem 1rem 1.75rem;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		border-bottom: 1px solid var(--border-light);
	}

	.close-btn {
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid var(--border-light);
		color: var(--text-secondary);
		width: 32px;
		height: 32px;
		min-width: 32px;
		min-height: 32px;
		border-radius: 8px;
		padding: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
		flex-shrink: 0;
	}
	.close-btn:hover {
		background: rgba(239, 68, 68, 0.2);
		color: #ffffff;
		border-color: rgba(239, 68, 68, 0.4);
	}
	.close-icon {
		width: 18px;
		height: 18px;
		stroke-width: 2.5;
	}

	/* Admin Cancel Modal */
	.admin-cancel-modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 580px;
		max-width: 92vw;
		max-height: 85vh;
		background: var(--bg-surface);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: 12px;
		z-index: 300;
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		animation: modal-pop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
	}
	.modal-trip-meta {
		font-size: 0.85rem;
		color: var(--text-secondary);
		margin-top: 4px;
	}
	.modal-form {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}
	.modal-body {
		padding: 1.5rem 1.75rem;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		flex: 1;
	}
	.affected-summary-card {
		padding: 1rem;
		border-radius: 8px;
		border: 1px solid var(--border-light);
		background: var(--input-bg);
		font-size: 0.85rem;
	}
	.affected-title {
		margin-bottom: 8px;
		color: var(--text-primary);
	}
	.no-bookings {
		color: var(--text-muted);
		font-style: italic;
	}
	.customer-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.customer-list li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: var(--bg-surface);
		padding: 6px 10px;
		border-radius: 6px;
		border: 1px solid var(--border-light);
	}

	.form-label {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-secondary);
		margin-bottom: 8px;
		display: block;
	}
	.radio-options-grid {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.radio-card {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 12px 14px;
		border-radius: 8px;
		border: 1px solid var(--border-light);
		background: var(--bg-surface);
		cursor: pointer;
		text-align: left;
		transition: all 0.2s ease;
		width: 100%;
	}
	.radio-card.active {
		border-color: var(--primary);
		background: var(--input-focus-bg);
	}
	.radio-dot {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		border: 2px solid var(--text-muted);
		display: inline-block;
		margin-top: 2px;
		flex-shrink: 0;
	}
	.radio-dot.selected {
		border-color: var(--primary);
		background: var(--primary);
		box-shadow: inset 0 0 0 3px var(--bg-surface);
	}
	.radio-content {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.radio-title {
		font-size: 0.9rem;
		font-weight: 700;
		color: var(--text-primary);
	}
	.radio-sub {
		font-size: 0.78rem;
		color: var(--text-muted);
		line-height: 1.3;
	}

	.reason-textarea {
		width: 100%;
		padding: 10px 12px;
		background: var(--input-bg);
		border: 1px solid var(--border-light);
		border-radius: 8px;
		color: var(--text-primary);
		font-family: inherit;
		font-size: 0.9rem;
		outline: none;
	}
	.reason-textarea:focus {
		border-color: var(--primary);
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		padding: 1rem 1.75rem 1.5rem 1.75rem;
		border-top: 1px solid var(--border-light);
		background: var(--bg-surface);
	}

	/* Captain's Log Modal Styles */
	.btn-captains-log {
		background: rgba(6, 182, 212, 0.15);
		color: #38bdf8;
		border: 1px solid rgba(6, 182, 212, 0.3);
		display: inline-flex;
		align-items: center;
		transition: all 0.2s ease;
	}
	.btn-captains-log:hover {
		background: rgba(6, 182, 212, 0.25);
		color: #7dd3fc;
		border-color: rgba(6, 182, 212, 0.5);
	}
	.nested-title-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
	}
	.nested-title-bar h4 {
		margin: 0;
	}

	.captains-log-modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 720px;
		max-width: 94vw;
		max-height: 85vh;
		background: var(--bg-surface);
		border: 1px solid rgba(6, 182, 212, 0.3);
		border-radius: 12px;
		z-index: 300;
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		animation: modal-pop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.log-summary-card {
		padding: 1.25rem;
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.08);
		background: rgba(255, 255, 255, 0.02);
	}
	.log-summary-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}
	.summary-col {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.summary-label {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--text-muted);
	}
	.skipper-name {
		font-size: 1rem;
		color: var(--text-primary);
	}
	.skipper-phone {
		font-size: 0.8rem;
		color: var(--text-secondary);
	}
	.acceptance-time {
		font-size: 0.85rem;
		color: var(--success);
		font-weight: 600;
	}
	.no-time {
		font-size: 0.85rem;
		color: var(--text-muted);
		font-style: italic;
	}

	.audits-section {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.section-title {
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.captains-log-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.85rem;
	}
	.captains-log-table th {
		text-align: left;
		padding: 10px 12px;
		background: var(--input-focus-bg);
		color: var(--text-secondary);
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		border-bottom: 1px solid var(--border-light);
	}
	.captains-log-table td {
		padding: 10px 12px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.04);
		color: var(--text-secondary);
	}
	.captains-log-table tr.winner-row {
		background: rgba(16, 185, 129, 0.06);
	}
	.captain-name {
		font-weight: 600;
		color: var(--text-primary);
	}
	.recipient-contact {
		font-family: monospace;
		font-size: 0.8rem;
		color: var(--text-muted);
	}
	.sent-time {
		font-size: 0.8rem;
	}

	.badge-winner {
		background: rgba(16, 185, 129, 0.12);
		color: #34d399;
		border: 1px solid rgba(16, 185, 129, 0.3);
		font-size: 0.7rem !important;
		padding: 2px 6px !important;
		font-weight: 600;
	}
	.date {
		font-weight: 600;
		color: var(--primary);
		white-space: nowrap;
	}
	.created-at {
		white-space: nowrap;
		font-size: 0.85rem;
		color: var(--text-secondary);
	}
</style>

