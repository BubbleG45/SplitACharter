<script lang="ts">
	let { data } = $props();

	let searchQuery = $state('');
	let copiedKey = $state('');

	// Filter captains based on search query (including charter name and promo code)
	let filteredCaptains = $derived(
		searchQuery.trim() === ''
			? data.captains
			: data.captains.filter(
					(c) =>
						c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
						(c.charter_name && c.charter_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
						c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
						(c.referral_promo_code && c.referral_promo_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
						c.phone.includes(searchQuery)
				)
	);

	function formatInterval(intervalStr: string) {
		if (!intervalStr) return 'N/A';
		const parts = intervalStr.split(':');
		if (parts.length >= 2) {
			const hours = parseInt(parts[0], 10);
			return `${hours}h`;
		}
		return intervalStr;
	}

	function copyToClipboard(text: string, key: string) {
		navigator.clipboard.writeText(text);
		copiedKey = key;
		setTimeout(() => {
			if (copiedKey === key) copiedKey = '';
		}, 2000);
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
			placeholder="Search by captain, charter name, promo code, email, or phone..."
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
					<th>Captain & Charter</th>
					<th>Promo Code / Link</th>
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
								{#if captain.charter_name}
									<span class="charter-badge">{captain.charter_name}</span>
								{/if}
								<span class="contact">{captain.email}</span>
								<span class="contact">{captain.phone}</span>
							</div>
						</td>
						<td>
							<div class="promo-cell">
								<span class="promo-code">{captain.referral_promo_code}</span>
								<div class="promo-actions">
									<button
										type="button"
										class="btn-copy-mini"
										title="Copy Promo Code"
										onclick={() => copyToClipboard(captain.referral_promo_code, `code-${captain.id}`)}
									>
										{#if copiedKey === `code-${captain.id}`}
											<span class="text-success">✔ Copied</span>
										{:else}
											<span>Copy Code</span>
										{/if}
									</button>
									<button
										type="button"
										class="btn-copy-mini"
										title="Copy Direct Referral Link"
										onclick={() => {
											const link = `${window.location.origin}/browse?ref=${encodeURIComponent(captain.referral_promo_code)}`;
											copyToClipboard(link, `link-${captain.id}`);
										}}
									>
										{#if copiedKey === `link-${captain.id}`}
											<span class="text-success">✔ Link Copied</span>
										{:else}
											<span>Copy Link</span>
										{/if}
									</button>
								</div>
							</div>
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
		max-width: 450px;
		padding: 6px 12px;
		font-size: 0.9rem;
		border-radius: 6px;
		border: 1px solid var(--border-light);
		background: var(--input-bg);
		color: var(--text-primary);
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
	.charter-badge {
		font-size: 0.78rem;
		color: var(--primary);
		font-weight: 600;
		margin-top: 2px;
	}
	.captain-info .contact {
		font-size: 0.8rem;
		color: var(--text-muted);
		margin-top: 2px;
	}

	.promo-cell {
		display: flex;
		flex-direction: column;
		gap: 6px;
		align-items: flex-start;
	}

	.promo-code {
		font-family: monospace;
		font-weight: 600;
		color: var(--text-primary);
		background: var(--input-bg);
		padding: 2px 6px;
		border-radius: 4px;
		border: 1px solid var(--border-light);
		font-size: 0.85rem;
	}

	.promo-actions {
		display: flex;
		gap: 4px;
	}

	.btn-copy-mini {
		background: none;
		border: 1px solid var(--border-light);
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 0.72rem;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-copy-mini:hover {
		color: var(--primary);
		border-color: var(--primary);
		background: var(--input-focus-bg);
	}

	.text-success {
		color: var(--success);
		font-weight: 600;
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

	.btn {
		padding: 0.6rem 1.2rem;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		text-decoration: none;
		border: none;
	}

	.btn-primary {
		background: var(--primary);
		color: #ffffff;
	}

	.btn-secondary {
		background: var(--bg-surface-elevated);
		color: var(--text-primary);
		border: 1px solid var(--border-light);
	}
</style>
