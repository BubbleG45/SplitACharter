<script lang="ts">
	import { enhance } from '$app/forms';

	let { data } = $props();
	let searchQuery = $state('');
	let filterStatus = $state('all'); // 'all', 'active', 'inactive'
	let sortColumn = $state<'trip_type' | 'location' | 'duration' | 'low_price' | 'active'>('trip_type');
	let sortDirection = $state<'asc' | 'desc'>('asc');

	function toggleSort(col: 'trip_type' | 'location' | 'duration' | 'low_price' | 'active') {
		if (sortColumn === col) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortColumn = col;
			sortDirection = 'asc';
		}
	}

	function getDurationMinutes(intervalStr: string | any): number {
		if (typeof intervalStr === 'string') {
			const parts = intervalStr.split(':');
			if (parts.length >= 2) {
				return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
			}
			return 0;
		}
		if (intervalStr && typeof intervalStr === 'object') {
			return (intervalStr.hours || 0) * 60 + (intervalStr.minutes || 0);
		}
		return 0;
	}

	// Client-side filtering and sorting
	let filteredListings = $derived(
		data.listings
			.filter((listing) => {
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
			.sort((a, b) => {
				let valA: any;
				let valB: any;

				if (sortColumn === 'trip_type') {
					valA = a.trip_type.toLowerCase();
					valB = b.trip_type.toLowerCase();
				} else if (sortColumn === 'location') {
					valA = a.location.toLowerCase();
					valB = b.location.toLowerCase();
				} else if (sortColumn === 'duration') {
					valA = getDurationMinutes(a.duration);
					valB = getDurationMinutes(b.duration);
				} else if (sortColumn === 'low_price') {
					valA = parseFloat(a.low_price);
					valB = parseFloat(b.low_price);
				} else if (sortColumn === 'active') {
					valA = a.active ? 1 : 0;
					valB = b.active ? 1 : 0;
				}

				if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
				if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
				return 0;
			})
	);

	let templateToDelete = $state<any | null>(null);
	let deleteConfirmInput = $state('');

	function openDeleteModal(listing: any) {
		templateToDelete = listing;
		deleteConfirmInput = '';
	}

	function closeDeleteModal() {
		templateToDelete = null;
		deleteConfirmInput = '';
	}

	function formatDuration(intervalStr: string | any) {
		if (typeof intervalStr === 'string') {
			if (intervalStr.includes('hour') || intervalStr.includes('hr')) {
				return intervalStr
					.replace(/hours?/gi, 'hrs')
					.replace(/minutes?/gi, 'mins')
					.replace(/\b0 mins\b/gi, '')
					.trim();
			}
			const parts = intervalStr.split(':');
			if (parts.length >= 2) {
				const hours = parseInt(parts[0], 10);
				const minutes = parseInt(parts[1], 10);
				let result = '';
				if (hours > 0) result += `${hours} hr${hours > 1 ? 's' : ''} `;
				if (minutes > 0) result += `${minutes} min${minutes > 1 ? 's' : ''}`;
				return result.trim() || 'N/A';
			}
			return intervalStr;
		}
		if (intervalStr && typeof intervalStr === 'object') {
			let result = '';
			if (intervalStr.hours) result += `${intervalStr.hours} hr${intervalStr.hours > 1 ? 's' : ''} `;
			if (intervalStr.minutes) result += `${intervalStr.minutes} min${intervalStr.minutes > 1 ? 's' : ''}`;
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
					<th class="sortable-th" onclick={() => toggleSort('trip_type')}>
						<div class="th-content">
							<span>Trip Type</span>
							<span class="sort-icon">{sortColumn === 'trip_type' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}</span>
						</div>
					</th>
					<th class="sortable-th" onclick={() => toggleSort('location')}>
						<div class="th-content">
							<span>Location</span>
							<span class="sort-icon">{sortColumn === 'location' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}</span>
						</div>
					</th>
					<th class="sortable-th" onclick={() => toggleSort('duration')}>
						<div class="th-content">
							<span>Duration</span>
							<span class="sort-icon">{sortColumn === 'duration' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}</span>
						</div>
					</th>
					<th class="sortable-th" onclick={() => toggleSort('low_price')}>
						<div class="th-content">
							<span>Price Range</span>
							<span class="sort-icon">{sortColumn === 'low_price' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}</span>
						</div>
					</th>
					<th class="sortable-th" onclick={() => toggleSort('active')}>
						<div class="th-content">
							<span>Status</span>
							<span class="sort-icon">{sortColumn === 'active' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}</span>
						</div>
					</th>
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
								<a href="/admin/listings/new?copyFrom={listing.id}" class="btn-icon btn-copy" title="Copy Template">
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
										<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5" />
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
								<button
									type="button"
									class="btn-icon btn-delete"
									title="Delete Template"
									onclick={() => openDeleteModal(listing)}
								>
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
										<path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
									</svg>
								</button>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<!-- Confirmation Delete Modal -->
{#if templateToDelete}
	<div class="modal-backdrop" onclick={closeDeleteModal} role="presentation">
		<div class="modal-card glass glow-danger" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
			<div class="modal-header">
				<span class="modal-badge step-2">Permanent Deletion</span>
				<h2 class="danger-title">Delete Listing Template</h2>
			</div>

			<div class="modal-body">
				<p>Are you sure you want to delete the listing template for <strong>"{templateToDelete.trip_type}"</strong> ({templateToDelete.location})?</p>

				<div class="modal-alert-box">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 alert-warning-icon">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
					</svg>
					<span><strong>Warning:</strong> Deleting this template will remove it and any associated trip instances from your platform. This action cannot be undone.</span>
				</div>

				<div class="form-group" style="display: flex; flex-direction: column; gap: 8px;">
					<label for="confirm-delete-template-input" style="font-size: 0.9rem; font-weight: 600; color: var(--text-secondary);">
						To confirm deletion, type <strong style="color: var(--danger);">DELETE</strong> in the box below:
					</label>
					<input
						type="text"
						id="confirm-delete-template-input"
						name="confirmText"
						bind:value={deleteConfirmInput}
						placeholder="Type DELETE to confirm"
						style="padding: 10px 12px; background: rgba(0,0,0,0.3); border: 1px solid var(--border-light); border-radius: 6px; color: var(--text-primary); font-family: var(--font-body);"
						autocomplete="off"
					/>
				</div>
			</div>

			<div class="modal-footer">
				<button type="button" class="btn btn-secondary" onclick={closeDeleteModal}>Cancel</button>
				<form method="POST" action="?/deleteTemplate" use:enhance={() => {
					return async ({ update }) => {
						await update();
						closeDeleteModal();
					};
				}}>
					<input type="hidden" name="id" value={templateToDelete.id} />
					<input type="hidden" name="confirmText" value={deleteConfirmInput} />
					<button
						type="submit"
						class="btn btn-danger-solid"
						disabled={deleteConfirmInput.trim() !== 'DELETE'}
						style="opacity: {deleteConfirmInput.trim() === 'DELETE' ? 1 : 0.4}; cursor: {deleteConfirmInput.trim() === 'DELETE' ? 'pointer' : 'not-allowed'};"
					>
						Permanently Delete Template
					</button>
				</form>
			</div>
		</div>
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
	.btn-copy:hover {
		background: rgba(6, 182, 212, 0.15);
		color: var(--primary);
		border-color: rgba(6, 182, 212, 0.3);
	}
	.btn-delete:hover {
		background: rgba(239, 68, 68, 0.2);
		color: var(--danger);
		border-color: var(--danger);
	}

	/* Modal Styles */
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.75);
		backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1.5rem;
	}
	.modal-card {
		max-width: 500px;
		width: 100%;
		border-radius: 12px;
		border: 1px solid var(--border-light);
		background: var(--bg-surface);
		padding: 2rem;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
	}
	.glow-danger {
		border-color: rgba(239, 68, 68, 0.4);
		box-shadow: 0 0 30px rgba(239, 68, 68, 0.15);
	}
	.modal-header {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.modal-header h2 {
		font-size: 1.4rem;
		font-weight: 700;
		margin: 0;
	}
	.danger-title {
		color: var(--danger);
	}
	.modal-badge {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		padding: 2px 8px;
		border-radius: 4px;
		width: fit-content;
		background: rgba(239, 68, 68, 0.15);
		color: var(--danger);
		border: 1px solid rgba(239, 68, 68, 0.3);
	}
	.modal-body {
		color: var(--text-secondary);
		font-size: 0.95rem;
		line-height: 1.5;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.modal-alert-box {
		display: flex;
		align-items: center;
		gap: 10px;
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		color: var(--danger);
		padding: 0.85rem 1rem;
		border-radius: 6px;
		font-size: 0.9rem;
	}
	.alert-warning-icon {
		flex-shrink: 0;
	}
	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		margin-top: 0.5rem;
	}
	.btn-secondary {
		background: rgba(255, 255, 255, 0.05);
		color: var(--text-secondary);
		border: 1px solid var(--border-light);
		cursor: pointer;
		padding: 8px 16px;
		border-radius: 6px;
		font-weight: 600;
	}
	.btn-secondary:hover {
		background: rgba(255, 255, 255, 0.1);
		color: var(--text-primary);
	}
	.btn-danger-solid {
		background: var(--danger);
		color: #ffffff;
		border: 1px solid var(--danger);
		cursor: pointer;
		padding: 8px 16px;
		border-radius: 6px;
		font-weight: 700;
		box-shadow: 0 0 15px rgba(239, 68, 68, 0.4);
		transition: all 0.2s;
	}
	.btn-danger-solid:hover {
		background: #dc2626;
		transform: scale(1.02);
	}

	.sortable-th {
		cursor: pointer;
		user-select: none;
		transition: background 0.15s ease, color 0.15s ease;
	}
	.sortable-th:hover {
		color: var(--primary);
		background: rgba(255, 255, 255, 0.03);
	}
	.th-content {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	.sort-icon {
		font-size: 0.75rem;
		color: var(--primary);
		opacity: 0.8;
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
