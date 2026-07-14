<script lang="ts">
	let { data } = $props();

	let selectedStatus = $state('all');

	// Filter bookings based on selected status
	let filteredBookings = $derived(
		selectedStatus === 'all'
			? data.bookings
			: data.bookings.filter((b) => b.status === selectedStatus)
	);

	function formatDate(dateStr: string) {
		if (!dateStr) return 'N/A';
		return new Date(dateStr).toLocaleDateString('en-US', {
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
</script>

<svelte:head>
	<title>Manage Bookings — SplitACharter</title>
</svelte:head>

<div class="admin-header">
	<div>
		<span class="subtitle">Operations Overview</span>
		<h1>Customer Bookings</h1>
	</div>
</div>

<div class="control-row glass">
	<div class="filter-group">
		<label for="status-filter">Status Filter:</label>
		<select id="status-filter" bind:value={selectedStatus}>
			<option value="all">All Bookings</option>
			<option value="pending-payment">Pending Payment</option>
			<option value="paid">Paid</option>
			<option value="awaiting-reconfirm">Awaiting Reconfirm</option>
			<option value="reconfirmed">Reconfirmed</option>
			<option value="held">Held</option>
			<option value="canceled">Canceled</option>
			<option value="forfeited">Forfeited</option>
		</select>
	</div>
</div>

<div class="table-container glass">
	{#if filteredBookings.length === 0}
		<div class="empty-state">
			<p>No bookings match the selected status.</p>
		</div>
	{:else}
		<table class="admin-table">
			<thead>
				<tr>
					<th>Customer</th>
					<th>Trip Date</th>
					<th>Trip Details</th>
					<th>Group Size</th>
					<th>Status</th>
					<th>Created</th>
				</tr>
			</thead>
			<tbody>
				{#each filteredBookings as booking (booking.id)}
					{@const trip = (Array.isArray(booking.trip_instances) ? booking.trip_instances[0] : booking.trip_instances) as any}
					{@const template = trip ? ((Array.isArray(trip.listing_templates) ? trip.listing_templates[0] : trip.listing_templates) as any) : null}
					{@const customer = (Array.isArray(booking.customers) ? booking.customers[0] : booking.customers) as any}

					<tr>
						<td>
							<div class="customer-info">
								<span class="name">{customer?.name || 'N/A'}</span>
								<span class="contact">{customer?.email || 'N/A'}</span>
								<span class="contact">{customer?.phone || 'N/A'}</span>
							</div>
						</td>
						<td>
							<span class="date">{formatDate(trip?.date)}</span>
						</td>
						<td>
							<div class="trip-info">
								<span class="type">{template?.trip_type || 'Unknown'}</span>
								<span class="loc">{template?.location || 'Unknown'}</span>
							</div>
						</td>
						<td>
							<span class="badge badge-size">{booking.group_size} Pax</span>
						</td>
						<td>
							<span class="badge status-badge booking-{booking.status}">
								{booking.status}
							</span>
						</td>
						<td>
							<span class="created-at">{formatDateTime(booking.created_at)}</span>
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

	.customer-info, .trip-info {
		display: flex;
		flex-direction: column;
	}
	.customer-info .name, .trip-info .type {
		font-weight: 600;
		color: var(--text-primary);
	}
	.customer-info .contact, .trip-info .loc {
		font-size: 0.8rem;
		color: var(--text-muted);
		margin-top: 2px;
	}

	.badge {
		font-size: 0.8rem;
		padding: 4px 10px;
		border-radius: 6px;
		font-weight: 600;
	}
	.badge-size {
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid var(--border-light);
		color: var(--text-secondary);
	}

	.status-badge {
		text-transform: capitalize;
		display: inline-block;
	}
	.booking-paid { background: rgba(16, 185, 129, 0.1); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.2); }
	.booking-pending-payment { background: rgba(245, 158, 11, 0.1); color: var(--accent); border: 1px solid rgba(245, 158, 11, 0.2); }
	.booking-awaiting-reconfirm { background: rgba(99, 102, 241, 0.1); color: var(--secondary); border: 1px solid rgba(99, 102, 241, 0.2); }
	.booking-reconfirmed { background: rgba(6, 182, 212, 0.1); color: var(--primary); border: 1px solid rgba(6, 182, 212, 0.2); }
	.booking-held { background: rgba(239, 68, 68, 0.1); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.2); }
	.booking-canceled, .booking-forfeited { background: rgba(255, 255, 255, 0.05); color: var(--text-muted); border: 1px solid var(--border-light); }

	.created-at {
		color: var(--text-muted);
		font-size: 0.85rem;
	}

	.empty-state {
		padding: 3rem 1.5rem;
		text-align: center;
		color: var(--text-muted);
	}
</style>
