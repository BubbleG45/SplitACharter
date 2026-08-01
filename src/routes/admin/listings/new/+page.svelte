<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	let { data, form } = $props();

	// Array state management for whats_included & what_to_bring initialized from copiedTemplate if copying
	/* svelte-ignore state_referenced_locally */
	let whatsIncludedList = $state<string[]>(data.copiedTemplate?.whats_included || []);
	let newIncludedItem = $state('');
	
	/* svelte-ignore state_referenced_locally */
	let whatToBringList = $state<string[]>(data.copiedTemplate?.what_to_bring || []);
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
	<title>{data.copiedTemplate ? 'Create Listing Template (Copy)' : 'New Listing Template'} — SplitACharter</title>
</svelte:head>

<div class="page-header">
	<div>
		<span class="subtitle">Operations</span>
		<h1>{data.copiedTemplate ? 'Create Listing Template (Copy)' : 'Create Listing Template'}</h1>
	</div>
	<a href="/admin/listings" class="btn btn-secondary">Cancel</a>
</div>

{#if data.copiedTemplate}
	<div class="alert alert-info glass" style="margin-bottom: 1.5rem; display: flex; align-items: center; gap: 12px; background: rgba(6, 182, 212, 0.1); border: 1px solid rgba(6, 182, 212, 0.3); color: var(--primary); padding: 1rem 1.25rem; border-radius: 8px;">
		<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor" class="w-5 h-5 flex-shrink-0">
			<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5" />
		</svg>
		<span><strong>Copying Template:</strong> Pre-filled from <strong>"{data.copiedTemplate.trip_type}"</strong> ({data.copiedTemplate.location}). Duration and Price estimates have been cleared for you to complete.</span>
	</div>
{/if}

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

		<div class="form-layout">
			<!-- Row 1: Trip Type & Location -->
			<div class="form-row form-row-2">
				<div class="form-group">
					<label for="trip_type">Trip Type / Name</label>
					<select
						id="trip_type"
						name="trip_type"
						required
					>
						<option value="" disabled selected={!data.copiedTemplate}>Select a Trip Type</option>
						{#each data.tripTypes as type}
							<option value={type.name} selected={data.copiedTemplate?.trip_type === type.name}>{type.name}</option>
						{/each}
					</select>
				</div>

				<div class="form-group">
					<label for="location">Location / Region</label>
					<select
						id="location"
						name="location"
						required
					>
						<option value="" disabled selected={!data.copiedTemplate}>Select a Location</option>
						<option value="Lower Keys (Key West, Big Pine Key)" selected={data.copiedTemplate?.location === 'Lower Keys (Key West, Big Pine Key)'}>Lower Keys (Key West, Big Pine Key)</option>
						<option value="Middle Keys (Marathon, Pigeon Key)" selected={data.copiedTemplate?.location === 'Middle Keys (Marathon, Pigeon Key)'}>Middle Keys (Marathon, Pigeon Key)</option>
						<option value="Upper Keys (Key Largo, Islamorada)" selected={data.copiedTemplate?.location === 'Upper Keys (Key Largo, Islamorada)'}>Upper Keys (Key Largo, Islamorada)</option>
					</select>
				</div>
			</div>

			<!-- Row 2: Duration, Max Passenger Capacity & Max Group Size Per Reservation -->
			<div class="form-row form-row-3">
				<div class="form-group">
					<label for="duration">Duration</label>
					<input
						type="text"
						id="duration"
						name="duration"
						value={data.copiedTemplate ? '' : '4 hours'}
						placeholder="e.g. 4 hours or 04:00"
						required
					/>
					<span class="input-helper">e.g. 4 hours, 6 hours, or 04:00</span>
				</div>

				<div class="form-group">
					<label for="max_passengers">Max Passenger Capacity</label>
					<input
						type="number"
						id="max_passengers"
						name="max_passengers"
						min="1"
						value={data.copiedTemplate?.max_passengers || ''}
						placeholder="e.g., 6"
						required
					/>
				</div>

				<div class="form-group">
					<label for="max_group_size">Max Group Size Per Reservation</label>
					<input
						type="number"
						id="max_group_size"
						name="max_group_size"
						min="1"
						value={data.copiedTemplate?.max_group_size || 4}
						placeholder="e.g., 4"
						required
					/>
				</div>
			</div>

			<!-- Row 3: Price Range Estimates -->
			<div class="form-row form-row-2">
				<div class="form-group">
					<label for="low_price">Low Price Estimate ($)</label>
					<input
						type="number"
						id="low_price"
						name="low_price"
						min="0"
						step="0.01"
						value=""
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
						value=""
						placeholder="e.g., 800"
						required
					/>
				</div>
			</div>

			<!-- Row 4: Meeting Area -->
			<div class="form-group">
				<label for="meeting_area">Meeting Area / Detailed Address</label>
				<input
					type="text"
					id="meeting_area"
					name="meeting_area"
					value={data.copiedTemplate?.meeting_area || 'Meeting details sent after confirmation'}
					placeholder="e.g., Slip 14, Whale Harbor Marina, MM 83.5"
					required
				/>
			</div>

			<!-- Row 5: Description -->
			<div class="form-group">
				<label for="description">Trip Description</label>
				<textarea
					id="description"
					name="description"
					rows="4"
					placeholder="Provide a compelling description of what this trip template is..."
					required
				>{data.copiedTemplate?.description || ''}</textarea>
			</div>

			<!-- Row 6: What's Included (Tags Input) -->
			<div class="form-group">
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
			<div class="form-group">
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
			<div class="form-group checkbox-group">
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
	.form-layout {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		margin-bottom: 2rem;
	}
	.form-row {
		display: grid;
		gap: 1.5rem;
	}
	.form-row-2 {
		grid-template-columns: 1fr 1fr;
	}
	.form-row-3 {
		grid-template-columns: 1fr 1fr 1fr;
	}
	.form-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
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
		.form-row-2,
		.form-row-3 {
			grid-template-columns: 1fr;
		}
		.form-container {
			padding: 1.5rem;
		}
	}
</style>
