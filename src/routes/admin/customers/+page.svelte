<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let searchQuery = $state('');

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
							<span class="badge strike-badge strike-{customer.strike_count >= 3 ? 'critical' : customer.strike_count > 0 ? 'warning' : 'clean'}">
								{customer.strike_count} Strikes
							</span>
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
</style>
