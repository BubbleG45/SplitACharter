<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let searchQuery = $state('');

	// Strikes drawer / modal state
	let showStrikesDrawer = $state(false);
	let selectedCustomer = $state<any>(null);

	// Reactively bind activeCustomer to update dynamically after SvelteKit invalidates the data
	let activeCustomer = $derived(
		selectedCustomer
			? data.customers.find((c: any) => c.id === selectedCustomer.id)
			: null
	);

	// Filter customers based on search query
	let filteredCustomers = $derived(
		searchQuery.trim() === ''
			? data.customers
			: data.customers.filter(
					(c) =>
						c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
						c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
						(c.phone && c.phone.includes(searchQuery))
				)
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
	<title>Customer Registry — SplitACharter</title>
</svelte:head>

<div class="admin-header">
	<div>
		<span class="subtitle">Operations Overview</span>
		<h1>Customer Accounts</h1>
	</div>
</div>

{#if form?.message}
	<div class="alert alert-error glass">
		<p>{form.message}</p>
	</div>
{/if}

<div class="control-row glass">
	<div class="search-group">
		<label for="customer-search">Search Customers:</label>
		<input
			type="text"
			id="customer-search"
			placeholder="Search by name, email, or phone..."
			bind:value={searchQuery}
			class="search-input"
		/>
	</div>
</div>

<div class="table-container glass">
	{#if filteredCustomers.length === 0}
		<div class="empty-state">
			<p>No customers match your search query.</p>
		</div>
	{:else}
		<table class="admin-table">
			<thead>
				<tr>
					<th>Name</th>
					<th>Contact Info</th>
					<th>Strikes</th>
					<th>Account Status</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each filteredCustomers as customer (customer.id)}
					<tr class:flagged-row={customer.flagged || customer.strike_count >= 3}>
						<td>
							<span class="name">{customer.name}</span>
						</td>
						<td>
							<div class="contact-info">
								<span class="email">{customer.email}</span>
								<span class="phone">{customer.phone || 'No phone registered'}</span>
							</div>
						</td>
						<td>
							<button 
								class="badge-btn" 
								onclick={() => { selectedCustomer = customer; showStrikesDrawer = true; }}
								title="Manage Strikes History"
							>
								<span class="badge strike-badge strike-{customer.strike_count >= 3 ? 'critical' : customer.strike_count > 0 ? 'warning' : 'clean'}">
									{customer.strike_count} Strikes
								</span>
							</button>
						</td>
						<td>
							{#if customer.flagged}
								<span class="status-badge status-flagged">Suspended / Flagged</span>
							{:else}
								<span class="status-badge status-active">Good Standing</span>
							{/if}
						</td>
						<td>
							<div class="action-buttons">
								<!-- Flag Toggle Action -->
								<form method="POST" action="?/toggleFlag" use:enhance class="inline-form">
									<input type="hidden" name="customerId" value={customer.id} />
									<input type="hidden" name="currentFlagged" value={customer.flagged ? 'true' : 'false'} />
									<button type="submit" class="btn btn-xs {customer.flagged ? 'btn-secondary' : 'btn-danger'}">
										{customer.flagged ? 'Unflag Account' : 'Flag Account'}
									</button>
								</form>

								<!-- Clear Strikes Action -->
								{#if customer.strike_count > 0}
									<form method="POST" action="?/clearStrikes" use:enhance class="inline-form">
										<input type="hidden" name="customerId" value={customer.id} />
										<button type="submit" class="btn btn-secondary btn-xs">
											Clear Strikes
										</button>
									</form>
								{/if}
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>

<!-- Customer Strikes History Drawer -->
{#if showStrikesDrawer && activeCustomer}
	<!-- Backdrop -->
	<button class="drawer-backdrop" onclick={() => showStrikesDrawer = false} aria-label="Close panel"></button>

	<!-- Slide Panel -->
	<div class="drawer glass glow-primary">
		<div class="drawer-header">
			<div>
				<span class="drawer-subtitle">Strike Registry</span>
				<h2>{activeCustomer.name}</h2>
				<span class="drawer-email">{activeCustomer.email}</span>
			</div>
			<button class="close-btn" onclick={() => showStrikesDrawer = false} aria-label="Close Drawer">
				<svg class="close-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<div class="drawer-body">
			<!-- History list -->
			<div class="strikes-section">
				<h3>Strike History</h3>
				{#if !activeCustomer.customer_strikes || activeCustomer.customer_strikes.length === 0}
					<p class="empty-state">No strikes on record for this customer.</p>
				{:else}
					<div class="strike-list">
						{#each activeCustomer.customer_strikes as strike (strike.id)}
							{@const trip = (Array.isArray(strike.trip_instances) ? strike.trip_instances[0] : strike.trip_instances) as any}
							<div class="strike-item glass">
								<div class="strike-header">
									<span class="strike-date">{new Date(strike.created_at).toLocaleDateString()}</span>
									
									<form method="POST" action="?/deleteStrike" use:enhance class="inline-form">
										<input type="hidden" name="strikeId" value={strike.id} />
										<button type="submit" class="btn-delete" aria-label="Remove Strike">
											<svg class="icon-trash" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
												<path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
											</svg>
										</button>
									</form>
								</div>
								
								<p class="strike-reason"><strong>Reason:</strong> {strike.reason}</p>
								
								{#if trip}
									{@const template = (Array.isArray(trip.listing_templates) ? trip.listing_templates[0] : trip.listing_templates) as any}
									<div class="strike-trip">
										<span class="trip-tag">Linked Trip:</span>
										<span class="trip-desc">
											{template?.trip_type} ({formatDate(trip.date)})
										</span>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Add Strike Form -->
			<div class="strikes-section add-strike-section">
				<h3>Issue Strike Manually</h3>
				<form method="POST" action="?/addStrike" use:enhance class="add-strike-form">
					<input type="hidden" name="customerId" value={activeCustomer.id} />
					
					<div class="form-group">
						<label for="tripInstanceId">Link to Booking / Trip:</label>
						<select id="tripInstanceId" name="tripInstanceId">
							<option value="">-- Not Linked to a Trip --</option>
							{#each activeCustomer.bookings || [] as booking}
								{@const trip = (Array.isArray(booking.trip_instances) ? booking.trip_instances[0] : booking.trip_instances) as any}
								{#if trip}
									{@const template = (Array.isArray(trip.listing_templates) ? trip.listing_templates[0] : trip.listing_templates) as any}
									<option value={trip.id}>
										{template?.trip_type} ({formatDate(trip.date)})
									</option>
								{/if}
							{/each}
						</select>
					</div>

					<div class="form-group">
						<label for="reason">Reason for Strike:</label>
						<textarea 
							id="reason" 
							name="reason" 
							placeholder="Explain why this strike is being issued..." 
							rows="3" 
							required
						></textarea>
					</div>

					<button type="submit" class="btn btn-primary btn-block">
						Issue Strike
					</button>
				</form>
			</div>
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
		padding: 1.25rem;
		border: 1px solid var(--border-light);
		margin-bottom: 1.5rem;
	}
	.search-group {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
	}
	.search-group label {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-secondary);
		flex-shrink: 0;
	}
	.search-input {
		width: 100%;
		max-width: 400px;
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

	.name {
		font-weight: 600;
		color: var(--text-primary);
	}
	.contact-info {
		display: flex;
		flex-direction: column;
	}
	.contact-info .email {
		font-weight: 500;
		color: var(--text-secondary);
	}
	.contact-info .phone {
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
	.strike-badge {
		display: inline-block;
	}
	.strike-clean { background: rgba(16, 185, 129, 0.08); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.15); }
	.strike-warning { background: rgba(245, 158, 11, 0.08); color: var(--accent); border: 1px solid rgba(245, 158, 11, 0.15); }
	.strike-critical { background: rgba(239, 68, 68, 0.08); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.15); }

	.status-badge {
		font-size: 0.85rem;
		font-weight: 600;
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	.status-badge::before {
		content: '';
		display: inline-block;
		width: 6px;
		height: 6px;
		border-radius: 50%;
	}
	.status-active {
		color: var(--success);
	}
	.status-active::before {
		background-color: var(--success);
		box-shadow: 0 0 6px var(--success);
	}
	.status-flagged {
		color: var(--danger);
	}
	.status-flagged::before {
		background-color: var(--danger);
		box-shadow: 0 0 6px var(--danger);
	}

	/* Flagged Highlight Row */
	.flagged-row td {
		background: rgba(239, 68, 68, 0.015);
	}

	.action-buttons {
		display: flex;
		gap: 8px;
		align-items: center;
	}
	.inline-form {
		display: inline-block;
	}

	.btn-xs {
		padding: 4px 8px;
		font-size: 0.8rem;
	}

	.alert-error {
		padding: 1rem;
		margin-bottom: 2rem;
		border-radius: 6px;
		border: 1px solid rgba(239, 68, 68, 0.2);
		color: var(--danger);
	}

	.empty-state {
		padding: 3rem 1.5rem;
		text-align: center;
		color: var(--text-muted);
	}

	.badge-btn {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		text-align: left;
		display: inline-block;
	}
	.badge-btn:hover .badge {
		border-color: var(--primary);
		box-shadow: 0 0 8px rgba(6, 182, 212, 0.2);
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
		display: flex;
		flex-direction: column;
		gap: 2.5rem;
	}

	.strikes-section h3 {
		font-size: 1.1rem;
		color: var(--text-primary);
		margin-bottom: 1.25rem;
		border-bottom: 1px solid var(--border-light);
		padding-bottom: 0.5rem;
	}

	.strike-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.strike-item {
		padding: 1.25rem;
		border: 1px solid var(--border-light);
		border-radius: 8px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.strike-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.strike-date {
		font-size: 0.8rem;
		color: var(--text-muted);
		font-weight: 600;
	}
	.btn-delete {
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		padding: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
	}
	.btn-delete:hover {
		color: var(--danger);
		background: rgba(239, 68, 68, 0.1);
	}
	.icon-trash {
		width: 16px;
		height: 16px;
	}
	.strike-reason {
		font-size: 0.9rem;
		color: var(--text-primary);
		line-height: 1.4;
	}
	.strike-trip {
		display: flex;
		gap: 6px;
		font-size: 0.8rem;
		background: rgba(255, 255, 255, 0.03);
		padding: 6px 10px;
		border-radius: 4px;
		border: 1px solid var(--border-light);
		align-items: center;
		width: fit-content;
	}
	.trip-tag {
		color: var(--primary);
		font-weight: 600;
	}
	.trip-desc {
		color: var(--text-secondary);
	}

	/* Form Styling */
	.add-strike-form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	.form-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.form-group label {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-secondary);
	}
	.form-group select, .form-group textarea {
		width: 100%;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid var(--border-light);
		color: var(--text-primary);
	}
	.btn-block {
		width: 100%;
	}
</style>
