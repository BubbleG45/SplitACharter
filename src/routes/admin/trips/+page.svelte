<script lang="ts">
	let { data } = $props();

	let selectedStatus = $state('all');

	// Filter trips based on selected status
	let filteredTrips = $derived(
		selectedStatus === 'all'
			? data.trips
			: data.trips.filter((t) => t.status === selectedStatus)
	);

	function formatDate(dateStr: string) {
		if (!dateStr) return 'N/A';
		return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Trip Instances — SplitACharter</title>
</svelte:head>

<div class="admin-header">
	<div>
		<span class="subtitle">Operations Overview</span>
		<h1>Trip Instances</h1>
	</div>
</div>

<div class="control-row glass">
	<div class="filter-group">
		<label for="status-filter">Status Filter:</label>
		<select id="status-filter" bind:value={selectedStatus}>
			<option value="all">All Trips</option>
			<option value="open">Open (0 of 2 groups)</option>
			<option value="half-booked">Half-Booked (1 of 2 groups)</option>
			<option value="pending-reconfirm">Pending Reconfirmation</option>
			<option value="confirmed">Confirmed (Captain matching)</option>
			<option value="completed">Completed</option>
			<option value="canceled">Canceled</option>
		</select>
	</div>
</div>

<div class="table-container glass">
	{#if filteredTrips.length === 0}
		<div class="empty-state">
			<p>No trip instances match the selected status.</p>
		</div>
	{:else}
		<table class="admin-table">
			<thead>
				<tr>
					<th>Date</th>
					<th>Charter Specs</th>
					<th>Assigned Captain</th>
					<th>Status</th>
					<th>Instance Reference</th>
				</tr>
			</thead>
			<tbody>
				{#each filteredTrips as trip (trip.id)}
					{@const template = (Array.isArray(trip.listing_templates) ? trip.listing_templates[0] : trip.listing_templates) as any}
					{@const captain = (Array.isArray(trip.captains) ? trip.captains[0] : trip.captains) as any}

					<tr>
						<td>
							<span class="date">{formatDate(trip.date)}</span>
						</td>
						<td>
							<div class="trip-info">
								<span class="type">{template?.trip_type || 'Unknown'}</span>
								<span class="loc">{template?.location || 'Unknown'} — {template?.meeting_area || 'Unknown'}</span>
							</div>
						</td>
						<td>
							{#if captain}
								<div class="captain-info">
									<span class="name">{captain.name}</span>
									<span class="phone">{captain.phone || 'N/A'}</span>
								</div>
							{:else}
								<span class="no-captain">Unassigned</span>
							{/if}
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
						<td>
							<span class="ref-val">{trip.id.substring(0, 8)}...</span>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>

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
		padding: 1.25rem;
		border: 1px solid var(--border-light);
		margin-bottom: 1.5rem;
	}
	.filter-group {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.filter-group label {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-secondary);
	}
	.filter-group select {
		padding: 6px 12px;
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
	.admin-table tr:last-child td {
		border-bottom: none;
	}

	.trip-info, .captain-info {
		display: flex;
		flex-direction: column;
	}
	.trip-info .type, .captain-info .name {
		font-weight: 600;
		color: var(--text-primary);
	}
	.trip-info .loc, .captain-info .phone {
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
		font-size: 0.8rem;
		padding: 4px 10px;
		border-radius: 6px;
		font-weight: 600;
	}

	.status-badge {
		text-transform: capitalize;
		display: inline-block;
	}
	.trip-open { background: rgba(255, 255, 255, 0.04); color: var(--text-secondary); border: 1px solid var(--border-light); }
	.trip-half-booked { background: rgba(6, 182, 212, 0.1); color: var(--primary); border: 1px solid rgba(6, 182, 212, 0.2); }
	.trip-pending-reconfirm { background: rgba(99, 102, 241, 0.1); color: var(--secondary); border: 1px solid rgba(99, 102, 241, 0.2); }
	.trip-confirmed { background: rgba(16, 185, 129, 0.1); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.2); }
	.trip-completed { background: rgba(255, 255, 255, 0.02); color: var(--text-muted); border: 1px solid var(--border-light); }
	.trip-canceled { background: rgba(239, 68, 68, 0.1); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.2); }

	.ref-val {
		color: var(--text-muted);
		font-family: monospace;
	}

	.empty-state {
		padding: 3rem 1.5rem;
		text-align: center;
		color: var(--text-muted);
	}
</style>
