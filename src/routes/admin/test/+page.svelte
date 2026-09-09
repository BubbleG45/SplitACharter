<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Active tester preference stored in local state for convenience
	let currentTester = $state<'TJ' | 'BG'>('BG');

	// Filtering states
	let selectedCategory = $state<string>('all');
	let statusFilter = $state<'all' | 'incomplete' | 'completed'>('all');
	let testerFilter = $state<'all' | 'TJ' | 'BG' | 'unassigned'>('all');
	let searchQuery = $state<string>('');

	// Custom item modal
	let showAddModal = $state<boolean>(false);
	let newCategory = $state<string>('');
	let newTitle = $state<string>('');
	let newDescription = $state<string>('');

	// Optimistic local state for items
	let items = $state<typeof data.items>([]);
	$effect(() => {
		items = data.items;
	});

	// Expanded descriptions map
	let expandedItems = $state<Record<string, boolean>>({});

	function toggleExpand(id: string) {
		expandedItems[id] = !expandedItems[id];
	}

	// Filtered items
	let filteredItems = $derived(
		items.filter((item) => {
			if (selectedCategory !== 'all' && item.category !== selectedCategory) {
				return false;
			}
			if (statusFilter === 'completed' && !item.completed) {
				return false;
			}
			if (statusFilter === 'incomplete' && item.completed) {
				return false;
			}
			if (testerFilter === 'TJ' && item.tested_by !== 'TJ') {
				return false;
			}
			if (testerFilter === 'BG' && item.tested_by !== 'BG') {
				return false;
			}
			if (testerFilter === 'unassigned' && item.tested_by) {
				return false;
			}
			if (searchQuery.trim()) {
				const q = searchQuery.toLowerCase();
				const matchTitle = item.title.toLowerCase().includes(q);
				const matchDesc = item.description.toLowerCase().includes(q);
				const matchCat = item.category.toLowerCase().includes(q);
				const matchNotes = item.notes?.toLowerCase().includes(q);
				const matchId = item.id.toLowerCase().includes(q);
				if (!matchTitle && !matchDesc && !matchCat && !matchNotes && !matchId) {
					return false;
				}
			}
			return true;
		})
	);

	// Summary Statistics
	let totalCount = $derived(items.length);
	let completedCount = $derived(items.filter((i) => i.completed).length);
	let percentComplete = $derived(totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0);
	let tjCount = $derived(items.filter((i) => i.completed && i.tested_by === 'TJ').length);
	let bgCount = $derived(items.filter((i) => i.completed && i.tested_by === 'BG').length);
	let remainingCount = $derived(totalCount - completedCount);

	// Grouping by category
	let itemsByCategory = $derived(
		filteredItems.reduce((acc, item) => {
			if (!acc[item.category]) {
				acc[item.category] = [];
			}
			acc[item.category].push(item);
			return acc;
		}, {} as Record<string, typeof items>)
	);

	let activeCategories = $derived(Object.keys(itemsByCategory));
</script>

<svelte:head>
	<title>Manual QA Test Plan — SplitACharter Admin</title>
</svelte:head>

<div class="test-page-container">
	<!-- Page Header -->
	<header class="page-header">
		<div class="header-content">
			<div class="title-row">
				<h1 class="page-title">
					Manual QA Test Plan
					<span class="badge-tag">Verification Checklist</span>
				</h1>
			</div>
			<p class="page-subtitle">
				Shared real-time testing checklist for TJ & BG to verify every system feature, state transition, and notification.
			</p>
		</div>

		<div class="header-actions">
			<!-- Active Tester Switcher -->
			<div class="tester-active-bar">
				<span class="tester-active-label">Testing as:</span>
				<div class="tester-pills">
					<button
						type="button"
						class="tester-pill {currentTester === 'TJ' ? 'active-tj' : ''}"
						onclick={() => (currentTester = 'TJ')}
					>
						TJ (Owner)
					</button>
					<button
						type="button"
						class="tester-pill {currentTester === 'BG' ? 'active-bg' : ''}"
						onclick={() => (currentTester = 'BG')}
					>
						BG (Dev)
					</button>
				</div>
			</div>

			<div class="action-buttons-group">
				<button type="button" class="btn btn-primary" onclick={() => (showAddModal = true)}>
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="btn-icon">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
					</svg>
					Add Test Item
				</button>

				<form method="POST" action="?/resetToDefaults" use:enhance>
					<button
						type="submit"
						class="btn btn-secondary"
						onclick={(e) => {
							if (!confirm('Are you sure you want to reset the test plan to the default master catalog?')) {
								e.preventDefault();
							}
						}}
						title="Restore the standard test items from code catalog"
					>
						Reset Catalog
					</button>
				</form>

				<form method="POST" action="?/clearAllStatus" use:enhance>
					<button
						type="submit"
						class="btn btn-secondary btn-danger-outline"
						onclick={(e) => {
							if (!confirm('Are you sure you want to uncheck all completed tests and clear test notes?')) {
								e.preventDefault();
							}
						}}
						title="Clear all checkmarks and notes"
					>
						Clear Checks
					</button>
				</form>
			</div>
		</div>
	</header>

	<!-- Progress & Stats Overview -->
	<section class="stats-card">
		<div class="progress-section">
			<div class="progress-info">
				<div class="progress-headline">
					<span class="progress-percent">{percentComplete}%</span>
					<span class="progress-label">Overall Progress ({completedCount} of {totalCount} completed)</span>
				</div>
				<span class="remaining-badge">{remainingCount} Remaining</span>
			</div>
			<div class="progress-track" role="progressbar" aria-valuenow={percentComplete} aria-valuemin="0" aria-valuemax="100">
				<div class="progress-bar-fill" style="width: {percentComplete}%"></div>
			</div>
		</div>

		<div class="stats-metrics-grid">
			<div class="metric-box">
				<span class="metric-label">Total Test Cases</span>
				<span class="metric-val">{totalCount}</span>
			</div>
			<div class="metric-box">
				<span class="metric-label">Completed</span>
				<span class="metric-val text-success">{completedCount}</span>
			</div>
			<div class="metric-box">
				<span class="metric-label">Verified by TJ</span>
				<span class="metric-val text-tj">{tjCount}</span>
			</div>
			<div class="metric-box">
				<span class="metric-label">Verified by BG</span>
				<span class="metric-val text-bg">{bgCount}</span>
			</div>
		</div>
	</section>

	<!-- Filter and Search Bar -->
	<section class="filter-card">
		<div class="filter-row">
			<!-- Search Field -->
			<div class="search-input-wrapper">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="search-icon">
					<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
				</svg>
				<input
					type="text"
					class="form-control search-input"
					placeholder="Search test cases, instructions, or notes..."
					bind:value={searchQuery}
				/>
				{#if searchQuery}
					<button type="button" class="clear-search-btn" onclick={() => (searchQuery = '')} aria-label="Clear search">
						×
					</button>
				{/if}
			</div>

			<!-- Status Filter -->
			<div class="select-group">
				<label for="status-filter" class="filter-label">Status:</label>
				<select id="status-filter" class="form-control select-control" bind:value={statusFilter}>
					<option value="all">All Statuses</option>
					<option value="incomplete">Incomplete Only</option>
					<option value="completed">Completed Only</option>
				</select>
			</div>

			<!-- Tester Filter -->
			<div class="select-group">
				<label for="tester-filter" class="filter-label">Tester:</label>
				<select id="tester-filter" class="form-control select-control" bind:value={testerFilter}>
					<option value="all">All Testers</option>
					<option value="TJ">TJ Only</option>
					<option value="BG">BG Only</option>
					<option value="unassigned">Unassigned Only</option>
				</select>
			</div>

			<!-- Category Filter Dropdown -->
			<div class="select-group">
				<label for="category-filter" class="filter-label">Category:</label>
				<select id="category-filter" class="form-control select-control" bind:value={selectedCategory}>
					<option value="all">All Categories ({data.categories.length})</option>
					{#each data.categories as cat}
						<option value={cat}>{cat}</option>
					{/each}
				</select>
			</div>
		</div>
	</section>

	<!-- Checklist Items Grouped by Category -->
	<main class="test-groups-container">
		{#if activeCategories.length === 0}
			<div class="empty-state-card">
				<p class="empty-title">No test items match the current filters.</p>
				<p class="empty-subtitle">Try adjusting your search query, status, or category filter.</p>
				<button
					type="button"
					class="btn btn-secondary"
					onclick={() => {
						searchQuery = '';
						statusFilter = 'all';
						testerFilter = 'all';
						selectedCategory = 'all';
					}}
				>
					Reset Filters
				</button>
			</div>
		{:else}
			{#each activeCategories as category}
				{@const catItems = itemsByCategory[category]}
				{@const catCompleted = catItems.filter((i) => i.completed).length}
				<section class="category-block">
					<div class="category-header">
						<div class="category-title-wrap">
							<h2 class="category-title">{category}</h2>
							<span class="category-count">
								{catCompleted}/{catItems.length} passed
							</span>
						</div>
					</div>

					<div class="items-list">
						{#each catItems as item (item.id)}
							<div class="test-item-card {item.completed ? 'is-completed' : ''}">
								<!-- Main Row -->
								<div class="item-main-row">
									<!-- Checkbox Form -->
									<form
										method="POST"
										action="?/toggleItem"
										use:enhance={() => {
											// Optimistic update
											item.completed = !item.completed;
											if (item.completed && !item.tested_by) {
												item.tested_by = currentTester;
											}
											return async ({ update }) => {
												await update({ reset: false });
											};
										}}
										class="checkbox-form"
									>
										<input type="hidden" name="id" value={item.id} />
										<input type="hidden" name="completed" value={item.completed ? 'false' : 'true'} />
										<input type="hidden" name="tested_by" value={currentTester} />

										<button
											type="submit"
											class="custom-checkbox {item.completed ? 'checked' : ''}"
											aria-label={item.completed ? 'Mark incomplete' : 'Mark complete'}
											title={item.completed ? 'Click to uncheck' : `Check off as ${currentTester}`}
										>
											{#if item.completed}
												<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="check-icon">
													<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
												</svg>
											{/if}
										</button>
									</form>

									<!-- Title & ID -->
									<div class="item-title-section">
										<div class="item-badges">
											<span class="item-id-badge">{item.id}</span>
											{#if item.completed}
												<span class="badge-status-passed">PASSED</span>
											{:else}
												<span class="badge-status-pending">PENDING</span>
											{/if}
										</div>
										<h3 class="item-title {item.completed ? 'completed-text' : ''}">
											{item.title}
										</h3>
									</div>

									<!-- Tester Assignment Selector -->
									<div class="item-tester-section">
										<span class="tester-mini-label">Tester:</span>
										<div class="tester-choice-group">
											<!-- Set to TJ -->
											<form
												method="POST"
												action="?/setTester"
												use:enhance={() => {
													item.tested_by = item.tested_by === 'TJ' ? null : 'TJ';
													return async ({ update }) => {
														await update({ reset: false });
													};
												}}
											>
												<input type="hidden" name="id" value={item.id} />
												<input type="hidden" name="tested_by" value={item.tested_by === 'TJ' ? '' : 'TJ'} />
												<button
													type="submit"
													class="tester-btn {item.tested_by === 'TJ' ? 'selected-tj' : ''}"
													title={item.tested_by === 'TJ' ? 'Assigned to TJ (click to unassign)' : 'Assign to TJ'}
												>
													TJ
												</button>
											</form>

											<!-- Set to BG -->
											<form
												method="POST"
												action="?/setTester"
												use:enhance={() => {
													item.tested_by = item.tested_by === 'BG' ? null : 'BG';
													return async ({ update }) => {
														await update({ reset: false });
													};
												}}
											>
												<input type="hidden" name="id" value={item.id} />
												<input type="hidden" name="tested_by" value={item.tested_by === 'BG' ? '' : 'BG'} />
												<button
													type="submit"
													class="tester-btn {item.tested_by === 'BG' ? 'selected-bg' : ''}"
													title={item.tested_by === 'BG' ? 'Assigned to BG (click to unassign)' : 'Assign to BG'}
												>
													BG
												</button>
											</form>
										</div>
									</div>

									<!-- Expand Instructions Toggle -->
									<button
										type="button"
										class="btn-expand"
										onclick={() => toggleExpand(item.id)}
										aria-expanded={expandedItems[item.id] || false}
										title="Toggle instructions"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											stroke-width="2"
											stroke="currentColor"
											class="expand-icon {expandedItems[item.id] ? 'rotate-180' : ''}"
										>
											<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
										</svg>
									</button>
								</div>

								<!-- Step-by-Step Description & Instructions (Expandable / Preview) -->
								<div class="item-description-block {expandedItems[item.id] ? 'expanded' : ''}">
									<div class="instruction-lead">
										<span class="instruction-label">Verification Steps & Expected Result:</span>
										<p class="instruction-text">{item.description}</p>
									</div>

									<!-- Inline Notes Editor -->
									<div class="notes-wrapper">
										<form
											method="POST"
											action="?/saveNotes"
											use:enhance={() => {
												return async ({ update }) => {
													await update({ reset: false });
												};
											}}
											class="notes-form"
										>
											<input type="hidden" name="id" value={item.id} />
											<div class="notes-input-group">
												<label for="notes-{item.id}" class="notes-label">
													Tester Notes & Observations:
												</label>
												<textarea
													id="notes-{item.id}"
													name="notes"
													class="form-control notes-textarea"
													placeholder="Write notes, bug observations, trip IDs tested, or notes for TJ / BG..."
													rows="2"
													bind:value={item.notes}
												></textarea>
												<div class="notes-footer">
													{#if item.id.startsWith('custom-')}
														<button
															type="submit"
															formaction="?/deleteItem"
															class="btn-delete-custom"
															onclick={(e) => {
																if (!confirm('Delete this custom test item?')) e.preventDefault();
															}}
														>
															Delete Custom Item
														</button>
													{/if}
													<button type="submit" class="btn btn-sm btn-save-notes">
														Save Note
													</button>
												</div>
											</div>
										</form>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</section>
			{/each}
		{/if}
	</main>

	<!-- Add Custom Test Case Modal -->
	{#if showAddModal}
		<div class="modal-backdrop" onclick={() => (showAddModal = false)} onkeydown={(e) => e.key === 'Escape' && (showAddModal = false)} role="presentation">
			<div class="modal-card" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" tabindex="-1">
				<div class="modal-header">
					<h3 class="modal-title">Add Custom Test Case</h3>
					<button type="button" class="modal-close-btn" onclick={() => (showAddModal = false)} aria-label="Close modal">×</button>
				</div>

				<form
					method="POST"
					action="?/addCustomItem"
					use:enhance={() => {
						return async ({ update, result }) => {
							await update();
							if (result.type === 'success') {
								showAddModal = false;
								newTitle = '';
								newDescription = '';
								newCategory = '';
							}
						};
					}}
					class="modal-form"
				>
					<div class="form-group">
						<label for="new-cat" class="form-label">Category</label>
						<input
							type="text"
							id="new-cat"
							name="category"
							class="form-control"
							placeholder="e.g. Captain Priority & Promo or custom category"
							list="categories-list"
							required
							bind:value={newCategory}
						/>
						<datalist id="categories-list">
							{#each data.categories as cat}
								<option value={cat}>{cat}</option>
							{/each}
						</datalist>
					</div>

					<div class="form-group">
						<label for="new-title" class="form-label">Test Case Title</label>
						<input
							type="text"
							id="new-title"
							name="title"
							class="form-control"
							placeholder="e.g. Test edge case on specific device"
							required
							bind:value={newTitle}
						/>
					</div>

					<div class="form-group">
						<label for="new-desc" class="form-label">Step-by-Step Instructions & Expected Result</label>
						<textarea
							id="new-desc"
							name="description"
							class="form-control"
							rows="3"
							placeholder="Explain the setup, action steps, and what the expected outcome is..."
							required
							bind:value={newDescription}
						></textarea>
					</div>

					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" onclick={() => (showAddModal = false)}>
							Cancel
						</button>
						<button type="submit" class="btn btn-primary">
							Add to Checklist
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}
</div>

<style>
	.test-page-container {
		display: flex;
		flex-direction: column;
		gap: 24px;
		max-width: 1200px;
		margin: 0 auto;
		padding: 24px 16px 80px;
	}

	/* Page Header */
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 20px;
		flex-wrap: wrap;
	}

	.page-title {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--text-primary);
		display: flex;
		align-items: center;
		gap: 12px;
		margin: 0;
	}

	.badge-tag {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 3px 10px;
		border-radius: 9999px;
		background: rgba(14, 165, 233, 0.15);
		color: var(--accent-teal, #0ea5e9);
		border: 1px solid rgba(14, 165, 233, 0.3);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.page-subtitle {
		margin: 6px 0 0;
		font-size: 0.9375rem;
		color: var(--text-secondary);
	}

	.header-actions {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 12px;
	}

	.tester-active-bar {
		display: flex;
		align-items: center;
		gap: 8px;
		background: var(--bg-surface);
		padding: 4px 12px;
		border-radius: 9999px;
		border: 1px solid var(--border-light);
	}

	.tester-active-label {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-secondary);
	}

	.tester-pills {
		display: flex;
		gap: 4px;
	}

	.tester-pill {
		border: none;
		background: transparent;
		font-size: 0.8125rem;
		font-weight: 600;
		padding: 4px 10px;
		border-radius: 9999px;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.tester-pill:hover {
		color: var(--text-primary);
	}

	.tester-pill.active-tj {
		background: #8b5cf6;
		color: #ffffff;
	}

	.tester-pill.active-bg {
		background: #0ea5e9;
		color: #ffffff;
	}

	.action-buttons-group {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 8px 16px;
		font-size: 0.875rem;
		font-weight: 600;
		border-radius: 8px;
		cursor: pointer;
		border: 1px solid transparent;
		transition: all 0.15s ease;
	}

	.btn-primary {
		background: var(--primary, #0ea5e9);
		color: #ffffff;
	}

	.btn-primary:hover {
		filter: brightness(1.08);
	}

	.btn-secondary {
		background: var(--bg-surface);
		color: var(--text-primary);
		border: 1px solid var(--border-light);
	}

	.btn-secondary:hover {
		background: var(--glass-bg);
	}

	.btn-danger-outline {
		color: var(--danger, #ef4444);
		border-color: rgba(239, 68, 68, 0.3);
	}

	.btn-danger-outline:hover {
		background: rgba(239, 68, 68, 0.1);
	}

	.btn-icon {
		width: 16px;
		height: 16px;
	}

	/* Stats Card */
	.stats-card {
		background: var(--bg-surface);
		border: 1px solid var(--border-light);
		border-radius: 12px;
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.progress-section {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.progress-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.progress-headline {
		display: flex;
		align-items: baseline;
		gap: 8px;
	}

	.progress-percent {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--accent-teal, #0ea5e9);
	}

	.progress-label {
		font-size: 0.875rem;
		color: var(--text-secondary);
		font-weight: 500;
	}

	.remaining-badge {
		font-size: 0.8125rem;
		font-weight: 600;
		padding: 2px 8px;
		border-radius: 6px;
		background: var(--glass-bg);
		color: var(--text-secondary);
		border: 1px solid var(--border-light);
	}

	.progress-track {
		height: 10px;
		background: var(--input-bg, rgba(255, 255, 255, 0.05));
		border-radius: 9999px;
		overflow: hidden;
		border: 1px solid var(--border-light);
	}

	.progress-bar-fill {
		height: 100%;
		background: linear-gradient(90deg, #0ea5e9 0%, #10b981 100%);
		transition: width 0.3s ease;
	}

	.stats-metrics-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 12px;
		padding-top: 12px;
		border-top: 1px solid var(--border-light);
	}

	.metric-box {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.metric-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.metric-val {
		font-size: 1.35rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.text-success {
		color: #10b981;
	}

	.text-tj {
		color: #8b5cf6;
	}

	.text-bg {
		color: #0ea5e9;
	}

	/* Filter Card */
	.filter-card {
		background: var(--bg-surface);
		border: 1px solid var(--border-light);
		border-radius: 12px;
		padding: 16px;
	}

	.filter-row {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
		align-items: center;
	}

	.search-input-wrapper {
		position: relative;
		flex: 1 1 240px;
		display: flex;
		align-items: center;
	}

	.search-icon {
		position: absolute;
		left: 12px;
		width: 16px;
		height: 16px;
		color: var(--text-secondary);
		pointer-events: none;
	}

	.search-input {
		padding-left: 36px;
		padding-right: 32px;
		width: 100%;
	}

	.clear-search-btn {
		position: absolute;
		right: 10px;
		background: none;
		border: none;
		color: var(--text-secondary);
		font-size: 1.1rem;
		cursor: pointer;
	}

	.select-group {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.filter-label {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-secondary);
		white-space: nowrap;
	}

	.form-control {
		background: var(--input-bg, rgba(255, 255, 255, 0.05));
		color: var(--text-primary);
		border: 1px solid var(--border-light);
		border-radius: 8px;
		padding: 8px 12px;
		font-size: 0.875rem;
		outline: none;
	}

	.form-control:focus {
		border-color: var(--accent-teal, #0ea5e9);
	}

	.select-control {
		cursor: pointer;
		min-width: 130px;
	}

	/* Category Block */
	.test-groups-container {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.category-block {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.category-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 4px;
	}

	.category-title-wrap {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.category-title {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0;
	}

	.category-count {
		font-size: 0.8125rem;
		font-weight: 600;
		padding: 2px 8px;
		border-radius: 6px;
		background: var(--glass-bg);
		color: var(--text-secondary);
		border: 1px solid var(--border-light);
	}

	.items-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	/* Test Item Card */
	.test-item-card {
		background: var(--bg-surface);
		border: 1px solid var(--border-light);
		border-radius: 10px;
		transition: all 0.15s ease;
		overflow: hidden;
	}

	.test-item-card:hover {
		border-color: rgba(14, 165, 233, 0.35);
	}

	.test-item-card.is-completed {
		background: rgba(16, 185, 129, 0.04);
		border-color: rgba(16, 185, 129, 0.25);
	}

	.item-main-row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 16px;
	}

	.checkbox-form {
		margin: 0;
		display: flex;
		align-items: center;
	}

	.custom-checkbox {
		width: 24px;
		height: 24px;
		border-radius: 6px;
		border: 2px solid var(--border-light);
		background: var(--input-bg, rgba(255, 255, 255, 0.05));
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.15s ease;
		padding: 0;
	}

	.custom-checkbox:hover {
		border-color: var(--accent-teal, #0ea5e9);
	}

	.custom-checkbox.checked {
		background: #10b981;
		border-color: #10b981;
		color: #ffffff;
	}

	.check-icon {
		width: 16px;
		height: 16px;
	}

	.item-title-section {
		flex: 1 1 auto;
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}

	.item-badges {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.item-id-badge {
		font-family: monospace;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-secondary);
		background: var(--glass-bg);
		padding: 1px 6px;
		border-radius: 4px;
		border: 1px solid var(--border-light);
	}

	.badge-status-passed {
		font-size: 0.6875rem;
		font-weight: 700;
		color: #10b981;
		background: rgba(16, 185, 129, 0.12);
		padding: 1px 6px;
		border-radius: 4px;
		border: 1px solid rgba(16, 185, 129, 0.3);
	}

	.badge-status-pending {
		font-size: 0.6875rem;
		font-weight: 600;
		color: var(--text-secondary);
		background: var(--glass-bg);
		padding: 1px 6px;
		border-radius: 4px;
		border: 1px solid var(--border-light);
	}

	.item-title {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	.item-title.completed-text {
		color: var(--text-secondary);
	}

	.item-tester-section {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.tester-mini-label {
		font-size: 0.75rem;
		color: var(--text-secondary);
		font-weight: 600;
	}

	.tester-choice-group {
		display: flex;
		gap: 4px;
	}

	.tester-btn {
		border: 1px solid var(--border-light);
		background: var(--bg-base);
		font-size: 0.75rem;
		font-weight: 700;
		padding: 3px 8px;
		border-radius: 6px;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.tester-btn:hover {
		color: var(--text-primary);
		border-color: var(--accent-teal, #0ea5e9);
	}

	.tester-btn.selected-tj {
		background: #8b5cf6;
		border-color: #8b5cf6;
		color: #ffffff;
	}

	.tester-btn.selected-bg {
		background: #0ea5e9;
		border-color: #0ea5e9;
		color: #ffffff;
	}

	.btn-expand {
		background: none;
		border: none;
		color: var(--text-secondary);
		cursor: pointer;
		padding: 6px;
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: color 0.15s ease;
	}

	.btn-expand:hover {
		color: var(--text-primary);
	}

	.expand-icon {
		width: 18px;
		height: 18px;
		transition: transform 0.2s ease;
	}

	.rotate-180 {
		transform: rotate(180deg);
	}

	/* Description & Notes Details */
	.item-description-block {
		display: none;
		padding: 0 16px 16px 52px;
		flex-direction: column;
		gap: 12px;
		border-top: 1px dashed var(--border-light);
		margin-top: 4px;
		padding-top: 12px;
	}

	.item-description-block.expanded {
		display: flex;
	}

	.instruction-lead {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.instruction-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--accent-teal, #0ea5e9);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.instruction-text {
		font-size: 0.875rem;
		color: var(--text-primary);
		line-height: 1.5;
		margin: 0;
	}

	.notes-wrapper {
		background: var(--bg-base);
		border: 1px solid var(--border-light);
		border-radius: 8px;
		padding: 10px 12px;
	}

	.notes-form {
		margin: 0;
	}

	.notes-input-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.notes-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-secondary);
	}

	.notes-textarea {
		width: 100%;
		resize: vertical;
		font-family: inherit;
		font-size: 0.8125rem;
	}

	.notes-footer {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 8px;
		margin-top: 4px;
	}

	.btn-save-notes {
		background: var(--bg-surface);
		color: var(--text-primary);
		border: 1px solid var(--border-light);
		padding: 4px 10px;
		font-size: 0.75rem;
		font-weight: 600;
		border-radius: 6px;
		cursor: pointer;
	}

	.btn-save-notes:hover {
		border-color: var(--accent-teal, #0ea5e9);
	}

	.btn-delete-custom {
		margin-right: auto;
		background: none;
		border: none;
		color: var(--danger, #ef4444);
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		padding: 4px 6px;
	}

	.btn-delete-custom:hover {
		text-decoration: underline;
	}

	/* Empty State */
	.empty-state-card {
		background: var(--bg-surface);
		border: 1px dashed var(--border-light);
		border-radius: 12px;
		padding: 40px 20px;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
	}

	.empty-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	.empty-subtitle {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin: 0 0 12px;
	}

	/* Modal */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 16px;
	}

	.modal-card {
		background: var(--bg-surface);
		border: 1px solid var(--border-light);
		border-radius: 12px;
		width: 100%;
		max-width: 500px;
		overflow: hidden;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px 20px;
		border-bottom: 1px solid var(--border-light);
	}

	.modal-title {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0;
	}

	.modal-close-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		color: var(--text-secondary);
		cursor: pointer;
		line-height: 1;
	}

	.modal-form {
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.form-label {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-secondary);
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		padding-top: 8px;
	}

	/* Responsive Tweaks */
	@media (max-width: 768px) {
		.page-header {
			flex-direction: column;
			align-items: stretch;
		}

		.header-actions {
			align-items: stretch;
		}

		.tester-active-bar {
			justify-content: space-between;
		}

		.item-description-block {
			padding-left: 16px;
		}
	}
</style>
