<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let activeTab = $state<'areas' | 'marinas'>('areas');

	// Modal / Form state for Area
	let showAreaModal = $state(false);
	let editingArea = $state<any>(null);
	let areaName = $state('');
	let areaSlug = $state('');
	let areaDesc = $state('');
	let areaMapbox = $state('');
	let areaLat = $state('');
	let areaLng = $state('');
	let areaActive = $state(true);

	// Modal / Form state for Marina
	let showMarinaModal = $state(false);
	let editingMarina = $state<any>(null);
	let marinaName = $state('');
	let marinaAddress = $state('');
	let marinaLat = $state('');
	let marinaLng = $state('');
	let marinaPhone = $state('');
	let marinaNotes = $state('');
	let marinaActive = $state(true);
	let marinaAreaIds = $state<string[]>([]);

	let isGenerating = $state(false);

	function openCreateArea() {
		editingArea = null;
		areaName = '';
		areaSlug = '';
		areaDesc = '';
		areaMapbox = '';
		areaLat = '';
		areaLng = '';
		areaActive = true;
		showAreaModal = true;
	}

	function openEditArea(area: any) {
		editingArea = area;
		areaName = area.name;
		areaSlug = area.slug;
		areaDesc = area.description || '';
		areaMapbox = area.mapbox_region || '';
		areaLat = area.center_lat ? String(area.center_lat) : '';
		areaLng = area.center_lng ? String(area.center_lng) : '';
		areaActive = area.active;
		showAreaModal = true;
	}

	function openCreateMarina() {
		editingMarina = null;
		marinaName = '';
		marinaAddress = '';
		marinaLat = '';
		marinaLng = '';
		marinaPhone = '';
		marinaNotes = '';
		marinaActive = true;
		marinaAreaIds = [];
		showMarinaModal = true;
	}

	function openEditMarina(marina: any) {
		editingMarina = marina;
		marinaName = marina.name;
		marinaAddress = marina.address;
		marinaLat = String(marina.lat);
		marinaLng = String(marina.lng);
		marinaPhone = marina.phone || '';
		marinaNotes = marina.notes || '';
		marinaActive = marina.active;
		marinaAreaIds = [...(marina.area_ids || [])];
		showMarinaModal = true;
	}

	function toggleAreaId(id: string) {
		if (marinaAreaIds.includes(id)) {
			marinaAreaIds = marinaAreaIds.filter((item) => item !== id);
		} else {
			marinaAreaIds = [...marinaAreaIds, id];
		}
	}
</script>

<svelte:head>
	<title>Locations & Marinas — SplitACharter Admin</title>
</svelte:head>

<div class="locations-admin-page">
	<div class="page-header">
		<div>
			<h1>Locations & Marinas</h1>
			<p class="subtitle">
				Manage scalable departure areas, physical marina coordinates, and captain service boundaries.
			</p>
		</div>

		<div class="header-actions">
			<form method="POST" action="?/generateListings" use:enhance={() => {
				isGenerating = true;
				return async ({ update }) => {
					await update();
					isGenerating = false;
				};
			}}>
				<button type="submit" class="btn btn-secondary" disabled={isGenerating}>
					{#if isGenerating}
						<span class="spinner-sm"></span> Generating...
					{:else}
						⚡ Sync Catalog Listings (Area × Type × Duration)
					{/if}
				</button>
			</form>

			{#if activeTab === 'areas'}
				<button type="button" class="btn btn-primary" onclick={openCreateArea}>
					+ Add New Area
				</button>
			{:else}
				<button type="button" class="btn btn-primary" onclick={openCreateMarina}>
					+ Add New Marina
				</button>
			{/if}
		</div>
	</div>

	{#if form?.message}
		<div class="alert-box" class:alert-success={form?.success} class:alert-error={!form?.success}>
			{form.message}
		</div>
	{/if}

	<!-- Tab Switcher -->
	<div class="tabs-bar">
		<button
			type="button"
			class="tab-btn"
			class:active={activeTab === 'areas'}
			onclick={() => (activeTab = 'areas')}
		>
			Operating Areas ({data.areas.length})
		</button>
		<button
			type="button"
			class="tab-btn"
			class:active={activeTab === 'marinas'}
			onclick={() => (activeTab = 'marinas')}
		>
			Marinas & Coordinates ({data.marinas.length})
		</button>
	</div>

	<!-- AREAS TAB -->
	{#if activeTab === 'areas'}
		<div class="table-container glass">
			<table class="data-table">
				<thead>
					<tr>
						<th>Area Name</th>
						<th>Slug / ID</th>
						<th>Associated Marinas</th>
						<th>Center GPS Coordinates</th>
						<th>Status</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each data.areas as area}
						{@const linkedMarinas = data.marinas.filter((m: any) => m.area_ids?.includes(area.id))}
						<tr>
							<td class="primary-cell">
								<strong>{area.name}</strong>
								{#if area.description}
									<span class="cell-sub">{area.description}</span>
								{/if}
							</td>
							<td>
								<code>{area.slug}</code>
							</td>
							<td>
								{#if linkedMarinas.length > 0}
									<span class="badge badge-info">{linkedMarinas.length} Marinas</span>
								{:else}
									<span class="badge badge-warning">0 Marinas (Uncovered)</span>
								{/if}
							</td>
							<td>
								{#if area.center_lat && area.center_lng}
									<span class="mono-coords">{Number(area.center_lat).toFixed(4)}, {Number(area.center_lng).toFixed(4)}</span>
								{:else}
									<span class="text-muted">Not specified</span>
								{/if}
							</td>
							<td>
								<span class="status-pill" class:active={area.active}>
									{area.active ? 'Active' : 'Inactive'}
								</span>
							</td>
							<td>
								<button type="button" class="btn btn-sm btn-outline" onclick={() => openEditArea(area)}>
									Edit
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	<!-- MARINAS TAB -->
	{#if activeTab === 'marinas'}
		<div class="table-container glass">
			<table class="data-table">
				<thead>
					<tr>
						<th>Marina Name & Address</th>
						<th>Linked Areas</th>
						<th>GPS Lat / Lng</th>
						<th>Phone</th>
						<th>Status</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each data.marinas as marina}
						{@const linkedAreas = data.areas.filter((a: any) => marina.area_ids?.includes(a.id))}
						<tr>
							<td class="primary-cell">
								<strong>⚓ {marina.name}</strong>
								<span class="cell-sub">{marina.address}</span>
							</td>
							<td>
								{#if linkedAreas.length > 0}
									<div class="tag-group">
										{#each linkedAreas as la}
											<span class="tag-pill">{la.name}</span>
										{/each}
									</div>
								{:else}
									<span class="badge badge-warning">No Area Linked</span>
								{/if}
							</td>
							<td>
								<span class="mono-coords">{Number(marina.lat).toFixed(4)}, {Number(marina.lng).toFixed(4)}</span>
							</td>
							<td>
								{marina.phone || '—'}
							</td>
							<td>
								<span class="status-pill" class:active={marina.active}>
									{marina.active ? 'Active' : 'Inactive'}
								</span>
							</td>
							<td>
								<button type="button" class="btn btn-sm btn-outline" onclick={() => openEditMarina(marina)}>
									Edit
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	<!-- AREA MODAL -->
	{#if showAreaModal}
		<div class="modal-backdrop" onclick={() => (showAreaModal = false)} role="presentation">
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<div class="modal-card glass" onclick={(e) => e.stopPropagation()} role="dialog">
				<div class="modal-header">
					<h3>{editingArea ? 'Edit Operating Area' : 'Add New Operating Area'}</h3>
					<button type="button" class="btn-close" onclick={() => (showAreaModal = false)}>✕</button>
				</div>

				<form method="POST" action={editingArea ? '?/updateArea' : '?/createArea'} use:enhance={() => {
					return async ({ update }) => {
						await update();
						showAreaModal = false;
					};
				}}>
					{#if editingArea}
						<input type="hidden" name="id" value={editingArea.id} />
					{/if}

					<div class="form-group">
						<label for="area-name">Area Name *</label>
						<input id="area-name" name="name" type="text" bind:value={areaName} required placeholder="e.g. Miami – Biscayne Bay" />
					</div>

					<div class="form-group">
						<label for="area-slug">URL Slug / Identifier *</label>
						<input id="area-slug" name="slug" type="text" bind:value={areaSlug} placeholder="e.g. miami-biscayne-bay" />
						<span class="helper-text">Used in search URLs and database filters.</span>
					</div>

					<div class="form-group">
						<label for="area-desc">Description</label>
						<input id="area-desc" name="description" type="text" bind:value={areaDesc} placeholder="e.g. Biscayne Bay and South Beach waters" />
					</div>

					<div class="form-grid-2">
						<div class="form-group">
							<label for="area-lat">Center Latitude</label>
							<input id="area-lat" name="center_lat" type="number" step="0.0001" bind:value={areaLat} placeholder="25.7617" />
						</div>
						<div class="form-group">
							<label for="area-lng">Center Longitude</label>
							<input id="area-lng" name="center_lng" type="number" step="0.0001" bind:value={areaLng} placeholder="-80.1918" />
						</div>
					</div>

					<div class="form-group checkbox-row">
						<label>
							<input type="checkbox" name="active" value="true" bind:checked={areaActive} />
							<span>Active & available for customer browsing</span>
						</label>
					</div>

					<div class="modal-actions">
						<button type="button" class="btn btn-secondary" onclick={() => (showAreaModal = false)}>Cancel</button>
						<button type="submit" class="btn btn-primary">{editingArea ? 'Save Changes' : 'Create Area'}</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- MARINA MODAL -->
	{#if showMarinaModal}
		<div class="modal-backdrop" onclick={() => (showMarinaModal = false)} role="presentation">
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<div class="modal-card glass" onclick={(e) => e.stopPropagation()} role="dialog">
				<div class="modal-header">
					<h3>{editingMarina ? 'Edit Marina & Coordinates' : 'Add New Physical Marina'}</h3>
					<button type="button" class="btn-close" onclick={() => (showMarinaModal = false)}>✕</button>
				</div>

				<form method="POST" action={editingMarina ? '?/updateMarina' : '?/createMarina'} use:enhance={() => {
					return async ({ update }) => {
						await update();
						showMarinaModal = false;
					};
				}}>
					{#if editingMarina}
						<input type="hidden" name="id" value={editingMarina.id} />
					{/if}

					<div class="form-group">
						<label for="marina-name">Marina Name *</label>
						<input id="marina-name" name="name" type="text" bind:value={marinaName} required placeholder="e.g. Oceanside Marina Key West" />
					</div>

					<div class="form-group">
						<label for="marina-address">Physical Street Address *</label>
						<input id="marina-address" name="address" type="text" bind:value={marinaAddress} required placeholder="e.g. 5950 Peninsular Ave, Key West, FL 33040" />
					</div>

					<div class="form-grid-2">
						<div class="form-group">
							<label for="marina-lat">Latitude *</label>
							<input id="marina-lat" name="lat" type="number" step="0.0000001" bind:value={marinaLat} required placeholder="24.5670" />
						</div>
						<div class="form-group">
							<label for="marina-lng">Longitude *</label>
							<input id="marina-lng" name="lng" type="number" step="0.0000001" bind:value={marinaLng} required placeholder="-81.7480" />
						</div>
					</div>

					<div class="form-group">
						<label>Serving Operating Areas *</label>
						<div class="area-checkboxes-grid">
							{#each data.areas as area}
								<label class="area-checkbox-item">
									<input
										type="checkbox"
										name="area_ids"
										value={area.id}
										checked={marinaAreaIds.includes(area.id)}
										onchange={() => toggleAreaId(area.id)}
									/>
									<span>{area.name}</span>
								</label>
							{/each}
						</div>
						<span class="helper-text">A boundary marina can serve multiple areas.</span>
					</div>

					<div class="form-grid-2">
						<div class="form-group">
							<label for="marina-phone">Dockmaster Phone</label>
							<input id="marina-phone" name="phone" type="tel" bind:value={marinaPhone} placeholder="(305) 555-0199" />
						</div>
						<div class="form-group">
							<label for="marina-notes">Slip / Access Notes</label>
							<input id="marina-notes" name="notes" type="text" bind:value={marinaNotes} placeholder="Gate code, parking instructions, etc." />
						</div>
					</div>

					<div class="form-group checkbox-row">
						<label>
							<input type="checkbox" name="active" value="true" bind:checked={marinaActive} />
							<span>Active & available for captain departures</span>
						</label>
					</div>

					<div class="modal-actions">
						<button type="button" class="btn btn-secondary" onclick={() => (showMarinaModal = false)}>Cancel</button>
						<button type="submit" class="btn btn-primary">{editingMarina ? 'Save Marina' : 'Create Marina'}</button>
					</div>
				</form>
			</div>
		</div>
	{/if}
</div>

<style>
	.locations-admin-page {
		padding: 2rem;
		max-width: 1300px;
		margin: 0 auto;
		color: var(--text-primary);
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 2rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.page-header h1 {
		font-size: 1.85rem;
		font-weight: 800;
		letter-spacing: -0.5px;
		margin: 0 0 0.35rem 0;
	}

	.subtitle {
		color: var(--text-secondary);
		margin: 0;
		font-size: 0.95rem;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.tabs-bar {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
		border-bottom: 1px solid var(--border-light);
		padding-bottom: 0.5rem;
	}

	.tab-btn {
		background: none;
		border: none;
		color: var(--text-secondary);
		font-weight: 600;
		padding: 0.6rem 1.25rem;
		border-radius: 8px;
		cursor: pointer;
		font-size: 0.95rem;
		transition: all 0.2s ease;
	}

	.tab-btn:hover {
		color: var(--text-primary);
		background: var(--bg-surface);
	}

	.tab-btn.active {
		color: var(--primary);
		background: var(--glass-bg);
		border: 1px solid var(--border-light);
	}

	.table-container {
		border-radius: 12px;
		border: 1px solid var(--border-light);
		overflow-x: auto;
		background: var(--bg-surface);
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
		text-align: left;
		font-size: 0.9rem;
	}

	.data-table th {
		padding: 1rem 1.25rem;
		font-weight: 600;
		color: var(--text-secondary);
		border-bottom: 1px solid var(--border-light);
		background: var(--glass-bg);
	}

	.data-table td {
		padding: 1rem 1.25rem;
		border-bottom: 1px solid var(--border-light);
		vertical-align: middle;
	}

	.primary-cell strong {
		display: block;
		font-size: 0.95rem;
		color: var(--text-primary);
	}

	.cell-sub {
		display: block;
		font-size: 0.8rem;
		color: var(--text-secondary);
		margin-top: 0.2rem;
	}

	.mono-coords {
		font-family: monospace;
		font-size: 0.85rem;
		color: var(--text-secondary);
	}

	.tag-group {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}

	.tag-pill {
		font-size: 0.75rem;
		padding: 0.2rem 0.6rem;
		border-radius: 6px;
		background: var(--glass-bg);
		border: 1px solid var(--border-light);
		color: var(--text-primary);
	}

	.badge {
		font-size: 0.75rem;
		padding: 0.25rem 0.6rem;
		border-radius: 6px;
		font-weight: 600;
	}

	.badge-info {
		background: rgba(59, 130, 246, 0.15);
		color: #3b82f6;
		border: 1px solid rgba(59, 130, 246, 0.3);
	}

	.badge-warning {
		background: rgba(245, 158, 11, 0.15);
		color: #f59e0b;
		border: 1px solid rgba(245, 158, 11, 0.3);
	}

	.status-pill {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		padding: 0.2rem 0.6rem;
		border-radius: 20px;
		background: rgba(239, 68, 68, 0.15);
		color: #ef4444;
	}

	.status-pill.active {
		background: rgba(34, 197, 94, 0.15);
		color: #22c55e;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.6rem 1.1rem;
		border-radius: 8px;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		border: none;
		transition: all 0.15s ease;
	}

	.btn-primary {
		background: var(--primary);
		color: #ffffff;
	}

	.btn-secondary {
		background: var(--glass-bg);
		color: var(--text-primary);
		border: 1px solid var(--border-light);
	}

	.btn-secondary:hover {
		background: var(--bg-surface);
	}

	.btn-sm {
		padding: 0.35rem 0.75rem;
		font-size: 0.8rem;
	}

	.btn-outline {
		background: transparent;
		color: var(--text-primary);
		border: 1px solid var(--border-light);
	}

	.btn-outline:hover {
		background: var(--glass-bg);
	}

	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1.5rem;
	}

	.modal-card {
		background: var(--bg-surface);
		border: 1px solid var(--border-light);
		border-radius: 14px;
		width: 100%;
		max-width: 580px;
		padding: 1.75rem;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
		max-height: 90vh;
		overflow-y: auto;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.modal-header h3 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 700;
	}

	.btn-close {
		background: none;
		border: none;
		color: var(--text-secondary);
		font-size: 1.25rem;
		cursor: pointer;
	}

	.form-group {
		margin-bottom: 1.25rem;
	}

	.form-group label {
		display: block;
		font-size: 0.85rem;
		font-weight: 600;
		margin-bottom: 0.4rem;
		color: var(--text-primary);
	}

	.form-group input[type="text"],
	.form-group input[type="number"],
	.form-group input[type="tel"] {
		width: 100%;
		padding: 0.65rem 0.85rem;
		background: var(--input-bg, var(--bg-base));
		border: 1px solid var(--border-light);
		border-radius: 8px;
		color: var(--text-primary);
		font-size: 0.9rem;
	}

	.form-grid-2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.helper-text {
		display: block;
		font-size: 0.75rem;
		color: var(--text-secondary);
		margin-top: 0.35rem;
	}

	.checkbox-row label {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		font-weight: 500;
		cursor: pointer;
	}

	.area-checkboxes-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
		background: var(--bg-base);
		padding: 0.75rem;
		border-radius: 8px;
		border: 1px solid var(--border-light);
	}

	.area-checkbox-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		cursor: pointer;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		margin-top: 1.75rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border-light);
	}

	.alert-box {
		padding: 0.85rem 1.25rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
		font-size: 0.9rem;
		font-weight: 500;
	}

	.alert-success {
		background: rgba(34, 197, 94, 0.15);
		color: #22c55e;
		border: 1px solid rgba(34, 197, 94, 0.3);
	}

	.alert-error {
		background: rgba(239, 68, 68, 0.15);
		color: #ef4444;
		border: 1px solid rgba(239, 68, 68, 0.3);
	}

	.spinner-sm {
		display: inline-block;
		width: 14px;
		height: 14px;
		border: 2px solid currentColor;
		border-top-color: transparent;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
