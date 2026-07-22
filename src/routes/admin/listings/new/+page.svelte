<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	let { data, form } = $props();

	// Array state management for whats_included & what_to_bring
	let whatsIncludedList = $state<string[]>([]);
	let newIncludedItem = $state('');
	
	let whatToBringList = $state<string[]>([]);
	let newBringItem = $state('');

	function addIncluded() {
		const trimmed = newIncludedItem.trim();
		if (trimmed && !whatsIncludedList.includes(trimmed)) {
			whatsIncludedList = [...whatsIncludedList, trimmed];
			newIncludedItem = '';
		}
	}

	function removeIncluded(index: number) {
		whatsIncludedList = whatsIncludedList.filter((_, i) => i !== index);
	}

	function addBring() {
		const trimmed = newBringItem.trim();
		if (trimmed && !whatToBringList.includes(trimmed)) {
			whatToBringList = [...whatToBringList, trimmed];
			newBringItem = '';
		}
	}

	function removeBring(index: number) {
		whatToBringList = whatToBringList.filter((_, i) => i !== index);
	}
</script>

<svelte:head>
	<title>New Listing Template — SplitACharter</title>
</svelte:head>

<div class="page-header">
	<div>
		<span class="subtitle">Operations</span>
		<h1>Create Listing Template</h1>
	</div>
	<a href="/admin/listings" class="btn btn-secondary">Cancel</a>
</div>

{#if form?.message}
	<div class="alert alert-danger glass">
		<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 alert-icon">
			<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
		</svg>
		<span>{form.message}</span>
	</div>
{/if}

<div class="form-container glass">
	<form method="POST" action="?/create" use:enhance class="listing-form">
		<!-- Serialized JSON inputs for arrays -->
		<input type="hidden" name="whats_included" value={JSON.stringify(whatsIncludedList)} />
		<input type="hidden" name="what_to_bring" value={JSON.stringify(whatToBringList)} />

		<div class="form-grid">
			<!-- Row 1: Trip Type & Location -->
			<div class="form-group">
				<label for="trip_type">Trip Type / Name</label>
				<select
					id="trip_type"
					name="trip_type"
					required
				>
					<option value="" disabled selected>Select a Trip Type</option>
					{#each data.tripTypes as type}
						<option value={type.name}>{type.name}</option>
					{/each}
				</select>
			</div>

			<div class="form-group">
				<label for="location">Location / Marina</label>
				<input
					type="text"
					id="location"
					name="location"
					placeholder="e.g., Islamorada, FL"
					required
				/>
			</div>

			<!-- Row 2: Duration, Passenger Cap & Status -->
			<div class="form-group">
				<label for="duration">Duration (Hours & Minutes)</label>
				<input
					type="time"
					id="duration"
					name="duration"
					value="04:00"
					required
				/>
				<span class="input-helper">Format: Hours:Minutes (e.g. 04:00 for 4 hours)</span>
			</div>

			<div class="form-group">
				<label for="max_passengers">Max Passenger Capacity</label>
				<input
					type="number"
					id="max_passengers"
					name="max_passengers"
					min="1"
					placeholder="e.g., 6"
					required
				/>
			</div>

			<!-- Row 3: Price Range -->
			<div class="form-group">
				<label for="low_price">Low Price Estimate ($)</label>
				<input
					type="number"
					id="low_price"
					name="low_price"
					min="0"
					step="0.01"
					placeholder="e.g., 600"
					required
				/>
			</div>

			<div class="form-group">
				<label for="high_price">High Price Estimate ($)</label>
				<input
					type="number"
					id="high_price"
					name="high_price"
					min="0"
					step="0.01"
					placeholder="e.g., 800"
					required
				/>
			</div>

			<!-- Row 4: Meeting Area -->
			<div class="form-group full-width">
				<label for="meeting_area">Meeting Area / Detailed Address</label>
				<input
					type="text"
					id="meeting_area"
					name="meeting_area"
					value="Provided by captain"
					placeholder="e.g., Slip 14, Whale Harbor Marina, MM 83.5"
					required
				/>
			</div>

			<!-- Row 5: Description -->
			<div class="form-group full-width">
				<label for="description">Trip Description</label>
				<textarea
					id="description"
					name="description"
					rows="4"
					placeholder="Provide a compelling description of what this trip template is..."
					required
				></textarea>
			</div>

			<!-- Row 6: What's Included (Tags Input) -->
			<div class="form-group full-width">
				<label for="whats_included_input">What's Included</label>
				<div class="tag-input-wrapper">
					<input
						type="text"
						id="whats_included_input"
						placeholder="Add included item and press Enter..."
						bind:value={newIncludedItem}
						onkeydown={(e) => {
							if (e.key === 'Enter') {
								e.preventDefault();
								addIncluded();
							}
						}}
					/>
					<button type="button" onclick={addIncluded} class="btn-add">Add</button>
				</div>
				<div class="tags-container">
					{#each whatsIncludedList as item, index}
						<span class="tag-badge">
							{item}
							<button type="button" onclick={() => removeIncluded(index)} class="tag-remove" aria-label="Remove item">
								&times;
							</button>
						</span>
					{/each}
				</div>
			</div>

			<!-- Row 7: What to Bring (Tags Input) -->
			<div class="form-group full-width">
				<label for="what_to_bring_input">What to Bring</label>
				<div class="tag-input-wrapper">
					<input
						type="text"
						id="what_to_bring_input"
						placeholder="Add item to bring and press Enter..."
						bind:value={newBringItem}
						onkeydown={(e) => {
							if (e.key === 'Enter') {
								e.preventDefault();
								addBring();
							}
						}}
					/>
					<button type="button" onclick={addBring} class="btn-add">Add</button>
				</div>
				<div class="tags-container">
					{#each whatToBringList as item, index}
						<span class="tag-badge accent-badge">
							{item}
							<button type="button" onclick={() => removeBring(index)} class="tag-remove" aria-label="Remove item">
								&times;
							</button>
						</span>
					{/each}
				</div>
			</div>

			<!-- Row 8: Active Status -->
			<div class="form-group full-width checkbox-group">
				<label class="switch-container">
					<input type="checkbox" name="active" value="true" checked />
					<span class="switch-slider"></span>
				</label>
				<div class="switch-label-wrapper">
					<span class="switch-title">Active listing template</span>
					<span class="switch-desc">Visible to customers browsing the platform immediately</span>
				</div>
			</div>
		</div>

		<div class="form-actions">
			<button type="submit" class="btn btn-primary">Create Template</button>
		</div>
	</form>
</div>

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

	.alert {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 2rem;
		font-size: 0.95rem;
	}
	.alert-danger {
		background: rgba(239, 68, 68, 0.12);
		border: 1px solid rgba(239, 68, 68, 0.2);
		color: #fca5a5;
	}
	.alert-icon {
		flex-shrink: 0;
	}

	.form-container {
		padding: 2.5rem;
		border: 1px solid var(--border-light);
	}
	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
		margin-bottom: 2rem;
	}
	.form-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.full-width {
		grid-column: span 2;
	}
	label {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text-secondary);
	}
	.input-helper {
		font-size: 0.75rem;
		color: var(--text-muted);
		margin-top: -4px;
	}
	textarea {
		resize: vertical;
	}

	/* Tag inputs styling */
	.tag-input-wrapper {
		display: flex;
		gap: 10px;
	}
	.tag-input-wrapper input {
		flex: 1;
	}
	.btn-add {
		background: var(--bg-surface-elevated);
		border: 1px solid var(--border-light);
		color: var(--text-primary);
		padding: 10px 16px;
		font-weight: 600;
	}
	.btn-add:hover {
		background: rgba(255, 255, 255, 0.1);
	}
	.tags-container {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 8px;
	}
	.tag-badge {
		background: rgba(6, 182, 212, 0.1);
		color: var(--primary);
		border: 1px solid rgba(6, 182, 212, 0.25);
		padding: 6px 12px;
		border-radius: 20px;
		font-size: 0.85rem;
		font-weight: 500;
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	.accent-badge {
		background: rgba(99, 102, 241, 0.1);
		color: var(--secondary);
		border: 1px solid rgba(99, 102, 241, 0.25);
	}
	.tag-remove {
		background: transparent;
		border: none;
		color: inherit;
		cursor: pointer;
		font-size: 1.1rem;
		line-height: 1;
		font-weight: bold;
		padding: 0;
	}
	.tag-remove:hover {
		opacity: 0.8;
	}

	/* Switch component */
	.checkbox-group {
		flex-direction: row;
		align-items: center;
		gap: 1rem;
		border-top: 1px solid var(--border-light);
		padding-top: 1.5rem;
		margin-top: 1rem;
	}
	.switch-container {
		position: relative;
		display: inline-block;
		width: 52px;
		height: 28px;
		flex-shrink: 0;
	}
	.switch-container input {
		opacity: 0;
		width: 0;
		height: 0;
	}
	.switch-slider {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: var(--bg-surface-elevated);
		transition: .4s;
		border-radius: 34px;
		border: 1px solid var(--border-light);
	}
	.switch-slider:before {
		position: absolute;
		content: "";
		height: 20px;
		width: 20px;
		left: 3px;
		bottom: 3px;
		background-color: var(--text-secondary);
		transition: .4s;
		border-radius: 50%;
	}
	.switch-container input:checked + .switch-slider {
		background: linear-gradient(135deg, var(--primary), var(--secondary));
		border-color: transparent;
	}
	.switch-container input:checked + .switch-slider:before {
		transform: translateX(24px);
		background-color: white;
	}
	.switch-label-wrapper {
		display: flex;
		flex-direction: column;
	}
	.switch-title {
		font-size: 0.95rem;
		font-weight: 600;
	}
	.switch-desc {
		font-size: 0.8rem;
		color: var(--text-muted);
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		margin-top: 2rem;
		border-top: 1px solid var(--border-light);
		padding-top: 1.5rem;
	}

	@media (max-width: 768px) {
		.form-grid {
			grid-template-columns: 1fr;
		}
		.full-width {
			grid-column: span 1;
		}
		.form-container {
			padding: 1.5rem;
		}
	}
</style>
