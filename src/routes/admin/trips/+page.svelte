<script lang="ts">
	import { deserialize } from '$app/forms';

	let { data } = $props();

	// Search & filtering state
	let searchQuery = $state('');
	let selectedStatus = $state('all');
	let selectedListing = $state('all');

	// Expanded trip ids tracking
	let expandedTripIds = $state(new Set<string>());

	// Communication logs drawer state
	let showDrawer = $state(false);
	let selectedCustomer = $state<{ name: string; email: string; phone: string | null } | null>(null);
	let loadingLogs = $state(false);
	let logs = $state<any[]>([]);

	// Derived filtered trips based on status, listing, and search query
	let filteredTrips = $derived(
		data.trips.filter((t: any) => {
			const statusMatch = selectedStatus === 'all' || t.status === selectedStatus;
			const templateMatch = selectedListing === 'all' || t.listing_templates?.id === selectedListing;

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
				const tripTypeMatch = t.listing_templates?.trip_type?.toLowerCase().includes(query);
				const locationMatch = t.listing_templates?.location?.toLowerCase().includes(query);
				searchMatch = !!(customerMatch || captainMatch || tripTypeMatch || locationMatch || (t.id && t.id.toLowerCase().includes(query)));
			}

			return statusMatch && templateMatch && searchMatch;
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
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function formatDateTime(dateTimeStr: string) {
		if (!dateTimeStr) return 'N/A';
		return new Date(dateTimeStr).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
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

	async function openCommunications(customer: any) {
		selectedCustomer = customer;
		showDrawer = true;
		loadingLogs = true;
		logs = [];

		try {
			const formData = new FormData();
			if (customer.email) formData.append('email', customer.email);
			if (customer.phone) formData.append('phone', customer.phone);

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
			<label for="listing-filter">Listing Template:</label>
			<select id="listing-filter" bind:value={selectedListing}>
				<option value="all">All Listings</option>
				{#each data.listingTemplates as template}
					<option value={template.id}>{template.trip_type} ({template.location})</option>
				{/each}
			</select>
		</div>

		<div class="filter-group">
			<label for="status-filter">Trip Status:</label>
			<select id="status-filter" bind:value={selectedStatus}>
				<option value="all">All Trips</option>
				<option value="open">Open (0 of 2 Booked)</option>
				<option value="half-booked">Half-Booked (1 of 2 Booked)</option>
				<option value="pending-reconfirm">Pending Reconfirm</option>
				<option value="confirmed">Confirmed</option>
				<option value="completed">Completed</option>
				<option value="canceled">Canceled</option>
			</select>
		</div>
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
					<th style="width: 40px;"></th>
					<th>Date</th>
					<th>Charter Specs</th>
					<th>Assigned Captain</th>
					<th>Bookings</th>
					<th>Status</th>
				</tr>
			</thead>
			<tbody>
				{#each filteredTrips as trip (trip.id)}
					{@const template = (Array.isArray(trip.listing_templates) ? trip.listing_templates[0] : trip.listing_templates) as any}
					{@const captain = (Array.isArray(trip.captains) ? trip.captains[0] : trip.captains) as any}
					{@const bookingsCount = trip.bookings?.length || 0}
					{@const isExpanded = expandedTripIds.has(trip.id)}

					<tr class="master-row" onclick={() => toggleTrip(trip.id)}>
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
							<span class="badge badge-count">{bookingsCount} / 2 Booked</span>
						</td>
						<td>
							<span class="badge status-badge trip-{trip.status}">
								{#if trip.status === 'open'}
									0 of 2 Booked
								{:else if trip.status === 'half-booked'}
									1 of 2 Booked
								{:else if trip.status === 'pending-reconfirm'}
									Pending Reconfirm
								{:else}
									{trip.status}
								{/if}
							</span>
						</td>
					</tr>

					<!-- Expandable Nested Bookings Row -->
					{#if isExpanded}
						<tr class="nested-row">
							<td colspan="6">
								<div class="nested-container glass">
									<h4>Customer Bookings for this Trip</h4>
									{#if bookingsCount === 0}
										<p class="nested-empty">No customers have signed up for this trip instance yet.</p>
									{:else}
										<table class="nested-table">
											<thead>
												<tr>
													<th>Booking Ref #</th>
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
													<tr>
														<td>
															<code class="ref-code" title={booking.id}>{booking.id}</code>
														</td>
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
															<span class="created-at">{formatDateTime(booking.created_at)}</span>
														</td>
														<td>
															{#if customer}
																<button 
																	class="btn btn-secondary btn-xs"
																	onclick={(e) => { e.stopPropagation(); openCommunications(customer); }}
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

<style>
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
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1.25rem;
		align-items: center;
	}
	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.filter-group label {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-secondary);
	}
	.filter-group select, .search-input {
		width: 100%;
		padding: 8px 12px;
		font-size: 0.9rem;
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
		background: rgba(0, 0, 0, 0.2);
	}
	.nested-container {
		padding: 1.5rem;
		margin: 1rem 1.5rem 1.5rem 1.5rem;
		border-radius: 8px;
		border: 1px solid var(--border-light);
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
		background: rgba(255, 255, 255, 0.01);
		border-bottom: 1px solid var(--border-light);
		color: var(--text-secondary);
	}
	.nested-table td {
		padding: 0.85rem 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.04);
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
	.created-at {
		color: var(--text-muted);
	}

	/* Slide Drawer Styles */
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
		cursor: default;
	}
	.drawer {
		position: fixed;
		top: 0;
		right: 0;
		width: 500px;
		max-width: 90vw;
		height: 100vh;
		background: var(--bg-surface-dark);
		border-left: 1px solid var(--border-light);
		border-radius: 0;
		z-index: 210;
		display: flex;
		flex-direction: column;
		box-shadow: -10px 0 30px rgba(0, 0, 0, 0.5);
		animation: slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	}
	@keyframes slide-in {
		from { transform: translateX(100%); }
		to { transform: translateX(0); }
	}
	.drawer-header {
		padding: 2rem;
		border-bottom: 1px solid var(--border-light);
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}
	.drawer-subtitle {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 1px;
		color: var(--primary);
		font-weight: 700;
	}
	.drawer-header h2 {
		font-size: 1.5rem;
		margin-top: 4px;
	}
	.drawer-email {
		font-size: 0.85rem;
		color: var(--text-secondary);
	}
	.close-btn {
		background: none;
		border: none;
		color: var(--text-muted);
		padding: 4px;
	}
	.close-btn:hover {
		color: var(--text-primary);
	}
	.close-icon {
		width: 24px;
		height: 24px;
	}

	.drawer-body {
		padding: 2rem;
		overflow-y: auto;
		flex: 1;
	}

	/* Timeline in Drawer */
	.timeline {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	.timeline-item {
		border-left: 2px solid var(--border-light);
		padding-left: 1.25rem;
		position: relative;
	}
	.timeline-item::before {
		content: '';
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--text-muted);
		position: absolute;
		left: -6px;
		top: 6px;
		border: 2px solid var(--bg-surface-dark);
	}
	.timeline-item:hover::before {
		background: var(--primary);
		box-shadow: 0 0 8px var(--primary);
	}
	.timeline-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 6px;
	}
	.timeline-channel {
		font-size: 0.7rem;
		text-transform: uppercase;
	}
	.channel-sms { background: rgba(99, 102, 241, 0.15); color: var(--secondary); border: 1px solid rgba(99, 102, 241, 0.3); }
	.channel-email { background: rgba(6, 182, 212, 0.15); color: var(--primary); border: 1px solid rgba(6, 182, 212, 0.3); }
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
		font-size: 0.75rem;
		color: var(--text-secondary);
	}
	.timeline-template code {
		background: rgba(255, 255, 255, 0.05);
		padding: 2px 4px;
		border-radius: 4px;
	}
	.timeline-content {
		font-size: 0.85rem;
		line-height: 1.4;
		color: var(--text-primary);
		white-space: pre-wrap;
		background: rgba(255, 255, 255, 0.02);
		padding: 8px 12px;
		border-radius: 6px;
		border: 1px solid var(--border-light);
	}
	.timeline-status {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: capitalize;
		width: fit-content;
	}
	.status-sent, .status-delivered { color: var(--success); }
	.status-failed { color: var(--danger); }

	/* General components and loading spinner */
	.spinner-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 0;
		color: var(--text-secondary);
		gap: 12px;
	}
	.spinner {
		border: 3px solid rgba(255, 255, 255, 0.05);
		border-top: 3px solid var(--primary);
		border-radius: 50%;
		width: 30px;
		height: 30px;
		animation: spin 1s linear infinite;
	}
	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.btn-secondary {
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid var(--border-light);
		color: var(--text-primary);
	}
	.btn-secondary:hover {
		background: rgba(255, 255, 255, 0.1);
	}
	.btn-xs {
		padding: 4px 10px;
		font-size: 0.78rem;
		border-radius: 4px;
	}
	.icon {
		width: 14px;
		height: 14px;
	}

	.empty-state {
		padding: 3rem 1.5rem;
		text-align: center;
		color: var(--text-muted);
	}
</style>

