<script lang="ts">
	let { data } = $props();

	let searchQuery = $state('');

	// Filter captains based on search query
	let filteredCaptains = $derived(
		searchQuery.trim() === ''
			? data.captains
			: data.captains.filter(
					(c) =>
						c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
						c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
						c.phone.includes(searchQuery)
				)
	);

	function formatInterval(intervalStr: string) {
		if (!intervalStr) return 'N/A';
		// Simple cleaner for interval strings e.g. "24:00:00" -> "24h"
		const parts = intervalStr.split(':');
		if (parts.length >= 2) {
			const hours = parseInt(parts[0], 10);
			return `${hours}h`;
		}
		return intervalStr;
	}
</script>

<svelte:head>
	<title>Manage Captains — SplitACharter</title>
</svelte:head>

<div class="admin-header">
	<div>
		<span class="subtitle">Operations Overview</span>
		<h1>Registered Captains</h1>
	</div>
	<div>
		<a href="/admin/captains/new" class="btn btn-primary">Add Captain</a>
	</div>
</div>

<div class="control-row glass">
	<div class="search-group">
		<label for="captain-search">Search Captains:</label>
		<input
			type="text"
			id="captain-search"
			placeholder="Search by name, email, or phone..."
			bind:value={searchQuery}
			class="search-input"
		/>
	</div>
</div>

<div class="table-container glass">
	{#if filteredCaptains.length === 0}
		<div class="empty-state">
			<p>No captains match your search query.</p>
		</div>
	{:else}
		<table class="admin-table">
			<thead>
				<tr>
					<th>Captain</th>
					<th>Promo Code</th>
					<th>Trip Types</th>
					<th>Locations</th>
					<th>Notice Req.</th>
					<th>Max Passengers</th>
					<th>Status</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each filteredCaptains as captain (captain.id)}
					<tr>
						<td>
							<div class="captain-info">
								<span class="name">{captain.name}</span>
								<span class="contact">{captain.email}</span>
								<span class="contact">{captain.phone}</span>
							</div>
						</td>
						<td>
							<span class="promo-code">{captain.referral_promo_code}</span>
						</td>
						<td>
							<div class="chips-list">
								{#each captain.trip_types as type}
									<span class="chip chip-primary">{type}</span>
								{/each}
							</div>
						</td>
						<td>
							<div class="chips-list">
								{#each captain.locations as loc}
									<span class="chip chip-secondary">{loc}</span>
								{/each}
							</div>
						</td>
						<td>
							<span class="notice">{formatInterval(captain.minimum_notice)}</span>
						</td>
						<td>
							<span class="cap">{captain.max_passengers} Passengers</span>
						</td>
						<td>
							{#if captain.active}
								<span class="status-indicator active">Active</span>
							{:else}
								<span class="status-indicator inactive">Inactive</span>
							{/if}
						</td>
						<td>
							<a href="/admin/captains/{captain.id}/edit" class="btn btn-secondary btn-xs">Edit</a>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>

<style>
	.admin-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}
	.btn-xs {
		padding: 4px 8px;
		font-size: 0.8rem;
		text-decoration: none;
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

	.captain-info {
		display: flex;
		flex-direction: column;
	}
	.captain-info .name {
		font-weight: 600;
		color: var(--text-primary);
	}
	.captain-info .contact {
		font-size: 0.8rem;
		color: var(--text-muted);
		margin-top: 2px;
	}

	.promo-code {
		font-family: monospace;
		color: var(--text-muted);
		background: rgba(255, 255, 255, 0.02);
		padding: 2px 6px;
		border-radius: 4px;
		border: 1px solid var(--border-light);
	}

	.chips-list {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		max-width: 220px;
	}
	.chip {
		font-size: 0.75rem;
		padding: 2px 8px;
		border-radius: 4px;
		font-weight: 500;
	}
	.chip-primary {
		background: rgba(6, 182, 212, 0.08);
		color: var(--primary);
		border: 1px solid rgba(6, 182, 212, 0.15);
	}
	.chip-secondary {
		background: rgba(99, 102, 241, 0.08);
		color: var(--secondary);
		border: 1px solid rgba(99, 102, 241, 0.15);
	}

	.notice, .cap {
		font-weight: 500;
	}

	.status-indicator {
		font-size: 0.8rem;
		font-weight: 600;
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	.status-indicator::before {
		content: '';
		display: inline-block;
		width: 6px;
		height: 6px;
		border-radius: 50%;
	}
	.status-indicator.active {
		color: var(--success);
	}
	.status-indicator.active::before {
		background-color: var(--success);
		box-shadow: 0 0 6px var(--success);
	}
	.status-indicator.inactive {
		color: var(--text-muted);
	}
	.status-indicator.inactive::before {
		background-color: var(--text-muted);
	}

	.empty-state {
		padding: 3rem 1.5rem;
		text-align: center;
		color: var(--text-muted);
	}
</style>
