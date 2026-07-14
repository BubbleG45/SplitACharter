<script lang="ts">
	import { enhance } from '$app/forms';

	let { data } = $props();
	let searchQuery = $state('');
	let filterStatus = $state('all'); // 'all', 'active', 'inactive'

	// Client-side filtering
	let filteredListings = $derived(
		data.listings.filter((listing) => {
			const matchesSearch =
				listing.trip_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
				listing.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
				listing.description.toLowerCase().includes(searchQuery.toLowerCase());
			
			const matchesStatus =
				filterStatus === 'all' ||
				(filterStatus === 'active' && listing.active) ||
				(filterStatus === 'inactive' && !listing.active);

			return matchesSearch && matchesStatus;
		})
	);

	function formatDuration(intervalStr: string | any) {
		// Postgres interval formats can be e.g. "04:00:00" or custom object
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
		// In case it is an object from pg
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
	<title>Manage Listing Templates — SplitACharter</title>
</svelte:head>

<div class="page-header">
	<div>
		<span class="subtitle">Operations</span>
		<h1>Listing Templates</h1>
	</div>
	<a href="/admin/listings/new" class="btn btn-primary">
		<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
			<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
		</svg>
		<span>New Template</span>
	</a>
</div>

<!-- Controls Bar -->
<div class="controls-bar glass">
	<div class="search-wrapper">
		<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="search-icon">
			<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
		</svg>
		<input
			type="text"
			placeholder="Search by type, location, or description..."
			bind:value={searchQuery}
			class="search-input"
		/>
	</div>
	<div class="filter-wrapper">
		<span class="filter-label">Filter:</span>
		<select bind:value={filterStatus} class="filter-select">
			<option value="all">All Templates</option>
			<option value="active">Active Only</option>
			<option value="inactive">Inactive Only</option>
		</select>
	</div>
</div>

<!-- Listings Container -->
{#if filteredListings.length === 0}
	<div class="empty-state glass">
		<div class="empty-icon">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-12 h-12">
				<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
			</svg>
		</div>
		<h3>No Listing Templates Found</h3>
		<p>Try refining your search query or create a new listing template to get started.</p>
	</div>
{:else}
	<div class="listings-table-container glass">
		<table class="listings-table">
			<thead>
				<tr>
					<th>Trip Type</th>
					<th>Location</th>
					<th>Duration</th>
					<th>Price Range</th>
					<th>Max Pax</th>
					<th>Status</th>
					<th class="actions-col">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each filteredListings as listing (listing.id)}
					<tr class="listing-row {!listing.active ? 'inactive-row' : ''}">
						<td class="primary-col">
							<div class="title-cell">
								<span class="trip-title">{listing.trip_type}</span>
								<span class="trip-desc">{listing.description}</span>
							</div>
						</td>
						<td>{listing.location}</td>
						<td>{formatDuration(listing.duration)}</td>
						<td class="price-cell">
							${parseFloat(listing.low_price).toFixed(0)} – ${parseFloat(listing.high_price).toFixed(0)}
						</td>
						<td>{listing.max_passengers}</td>
						<td>
							<span class="status-badge {listing.active ? 'active-badge' : 'inactive-badge'}">
								{listing.active ? 'Active' : 'Inactive'}
							</span>
						</td>
						<td class="actions-cell">
							<div class="action-buttons-group">
								<a href="/admin/listings/{listing.id}/edit" class="btn-icon" title="Edit Template">
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
										<path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
									</svg>
								</a>
								<form method="POST" action="?/toggleActive" use:enhance class="toggle-form">
									<input type="hidden" name="id" value={listing.id} />
									<input type="hidden" name="active" value={listing.active} />
									<button type="submit" class="btn-icon toggle-btn {listing.active ? 'btn-deactivate' : 'btn-activate'}" title={listing.active ? 'Deactivate' : 'Activate'}>
										{#if listing.active}
											<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
												<path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
											</svg>
										{:else}
											<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
												<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
										{/if}
									</button>
								</form>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<style>
	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 2rem;
	}
	.subtitle {
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 1.5px;
		color: var(--primary);
		font-weight: 700;
	}
	.page-header h1 {
		font-size: 2.25rem;
		font-weight: 800;
		letter-spacing: -0.5px;
		margin-top: 0.25rem;
	}
	.btn {
		text-decoration: none;
		font-size: 0.95rem;
		padding: 10px 18px;
	}

	.controls-bar {
		padding: 1rem;
		display: flex;
		gap: 1.5rem;
		margin-bottom: 2rem;
		align-items: center;
	}
	.search-wrapper {
		flex: 1;
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
		pointer-events: none;
	}
	.search-input {
		width: 100%;
		padding-left: 42px;
	}
	.filter-wrapper {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.filter-label {
		font-size: 0.9rem;
		color: var(--text-secondary);
		font-weight: 500;
	}
	.filter-select {
		padding: 8px 12px;
		min-width: 160px;
	}

	.listings-table-container {
		width: 100%;
		overflow-x: auto;
		border: 1px solid var(--border-light);
	}
	.listings-table {
		width: 100%;
		border-collapse: collapse;
		text-align: left;
		font-size: 0.95rem;
	}
	.listings-table th {
		padding: 1.25rem 1.5rem;
		font-family: var(--font-heading);
		font-weight: 600;
		color: var(--text-secondary);
		border-bottom: 1px solid var(--border-light);
		background: rgba(255, 255, 255, 0.01);
	}
	.listings-table td {
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid var(--border-light);
		vertical-align: middle;
	}
	.listing-row {
		transition: background-color 0.2s ease;
	}
	.listing-row:hover {
		background: rgba(255, 255, 255, 0.02);
	}
	.listing-row:last-child td {
		border-bottom: none;
	}
	.inactive-row {
		opacity: 0.6;
	}

	.primary-col {
		max-width: 350px;
	}
	.title-cell {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.trip-title {
		font-weight: 600;
		color: var(--text-primary);
		font-size: 1rem;
	}
	.trip-desc {
		font-size: 0.8rem;
		color: var(--text-muted);
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
	}

	.price-cell {
		font-family: var(--font-heading);
		font-weight: 600;
	}

	.status-badge {
		font-size: 0.75rem;
		padding: 4px 10px;
		border-radius: 20px;
		font-weight: 600;
		display: inline-block;
	}
	.active-badge {
		background: rgba(16, 185, 129, 0.12);
		color: var(--success);
		border: 1px solid rgba(16, 185, 129, 0.2);
	}
	.inactive-badge {
		background: rgba(239, 68, 68, 0.12);
		color: var(--danger);
		border: 1px solid rgba(239, 68, 68, 0.2);
	}

	.actions-col {
		text-align: right;
	}
	.actions-cell {
		text-align: right;
	}
	.action-buttons-group {
		display: inline-flex;
		gap: 0.5rem;
		justify-content: flex-end;
		align-items: center;
	}
	.btn-icon {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid var(--border-light);
		color: var(--text-secondary);
		width: 36px;
		height: 36px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		padding: 0;
	}
	.btn-icon:hover {
		color: var(--text-primary);
		background: rgba(255, 255, 255, 0.12);
		border-color: var(--text-muted);
		transform: scale(1.05);
	}
	.toggle-form {
		display: inline;
	}
	.btn-deactivate:hover {
		background: rgba(239, 68, 68, 0.15);
		color: var(--danger);
		border-color: rgba(239, 68, 68, 0.3);
	}
	.btn-activate:hover {
		background: rgba(16, 185, 129, 0.15);
		color: var(--success);
		border-color: rgba(16, 185, 129, 0.3);
	}

	.empty-state {
		padding: 4rem 2rem;
		text-align: center;
		border: 1px solid var(--border-light);
	}
	.empty-icon {
		color: var(--text-muted);
		margin-bottom: 1rem;
		display: flex;
		justify-content: center;
	}
	.empty-state h3 {
		font-size: 1.25rem;
		margin-bottom: 0.5rem;
	}
	.empty-state p {
		color: var(--text-secondary);
		max-width: 400px;
		margin: 0 auto;
	}

	@media (max-width: 768px) {
		.controls-bar {
			flex-direction: column;
			align-items: stretch;
		}
		.filter-wrapper {
			justify-content: space-between;
		}
		.listings-table th:nth-child(3),
		.listings-table td:nth-child(3),
		.listings-table th:nth-child(5),
		.listings-table td:nth-child(5) {
			display: none;
		}
	}
</style>
