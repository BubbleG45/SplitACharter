<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatPromoCode, deriveCaptainPromoCode } from '$lib/promo_codes';

	let { data, form } = $props();

	/* svelte-ignore state_referenced_locally */
	let active = $state(data.captain.active);
	/* svelte-ignore state_referenced_locally */
	let name = $state(data.captain.name || '');
	/* svelte-ignore state_referenced_locally */
	let charterName = $state(data.captain.charter_name || '');
	/* svelte-ignore state_referenced_locally */
	let referralPromoCode = $state(data.captain.referral_promo_code || '');

	const locationOptions = [
		'Lower Keys (Key West, Big Pine Key)',
		'Middle Keys (Marathon, Pigeon Key)',
		'Upper Keys (Key Largo, Islamorada)'
	];
	/* svelte-ignore state_referenced_locally */
	let selectedTripTypes = $state<string[]>(data.captain.trip_types || []);
	/* svelte-ignore state_referenced_locally */
	let selectedLocations = $state<string[]>(data.captain.locations || []);

	function handleCharterNameInput(e: Event) {
		const target = e.target as HTMLInputElement;
		charterName = target.value;
	}

	function handlePromoCodeInput(e: Event) {
		const target = e.target as HTMLInputElement;
		referralPromoCode = formatPromoCode(target.value);
	}

	function syncPromoFromCharter() {
		referralPromoCode = deriveCaptainPromoCode(charterName, name);
	}

	function toggleAllTripTypes() {
		if (selectedTripTypes.length === data.tripTypes.length) {
			selectedTripTypes = [];
		} else {
			selectedTripTypes = data.tripTypes.map((t: { name: string }) => t.name);
		}
	}

	function toggleAllLocations() {
		if (selectedLocations.length === locationOptions.length) {
			selectedLocations = [];
		} else {
			selectedLocations = [...locationOptions];
		}
	}
</script>

<svelte:head>
	<title>Edit Captain — SplitACharter</title>
</svelte:head>

<div class="admin-header">
	<div>
		<span class="subtitle">Operations Overview</span>
		<h1>Edit Captain Profile</h1>
	</div>
</div>

{#if form?.message}
	<div class="alert alert-error glass">
		<p>{form.message}</p>
	</div>
{/if}

<div class="form-container glass">
	<form method="POST" use:enhance class="admin-form">
		<div class="form-grid">
			<!-- Column 1: Basic Info -->
			<div class="form-column">
				<h3>Primary Details</h3>
				
				<div class="form-group">
					<label for="name">Captain Name *</label>
					<input type="text" id="name" name="name" bind:value={name} required />
				</div>

				<div class="form-group">
					<label for="charter_name">
						Charter / Boat Business Name <span class="highlight-tag">(Used for Ref Code)</span>
					</label>
					<input
						type="text"
						id="charter_name"
						name="charter_name"
						bind:value={charterName}
						oninput={handleCharterNameInput}
						placeholder="e.g. Salty Dog Charters, Key West Anglers"
					/>
					<span class="input-helper">The charter name is used to generate clean, memorable referral promo codes.</span>
				</div>

				<div class="form-group">
					<div class="promo-header-group">
						<label for="referral_promo_code">Referral Promo Code (ALL CAPS) *</label>
						<button type="button" class="btn-resync" onclick={syncPromoFromCharter} title="Re-derive code from Charter Name">
							↺ Sync from Charter Name
						</button>
					</div>
					<input
						type="text"
						id="referral_promo_code"
						name="referral_promo_code"
						bind:value={referralPromoCode}
						oninput={handlePromoCodeInput}
						placeholder="e.g. SALTY-DOG-CHARTERS"
						style="text-transform: uppercase; font-family: monospace; font-weight: 600;"
						required
					/>
					<span class="input-helper">Referral promo code is saved in ALL CAPS. Must be unique across all captains.</span>
				</div>

				<div class="form-group">
					<label for="email">Email Address *</label>
					<input type="email" id="email" name="email" value={data.captain.email} required />
				</div>

				<div class="form-group">
					<label for="phone">Phone Number *</label>
					<input type="tel" id="phone" name="phone" value={data.captain.phone} required />
				</div>

				<div class="form-group">
					<label for="minimum_notice">Minimum Notice Required</label>
					<select id="minimum_notice" name="minimum_notice" value={data.captain.minimum_notice}>
						<option value="12 hours">12 Hours</option>
						<option value="24 hours">24 Hours</option>
						<option value="48 hours">48 Hours</option>
						<option value="72 hours">72 Hours</option>
					</select>
				</div>

				<div class="form-group">
					<label for="max_passengers">Max Passenger Capacity</label>
					<input type="number" id="max_passengers" name="max_passengers" value={data.captain.max_passengers} required min="1" max="20" />
				</div>

				<div class="form-group checkbox-group">
					<label class="toggle-label">
						<input type="checkbox" checked={active} onchange={(e) => active = (e.target as HTMLInputElement).checked} />
						<span>Active Status</span>
					</label>
					<input type="hidden" name="active" value={active ? 'true' : 'false'} />
				</div>
			</div>

			<!-- Column 2: Eligibility & Notes -->
			<div class="form-column">
				<h3>Qualifications & Eligibility</h3>

				<div class="form-group">
					<div class="section-label-header">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label>Trip Types Approved</label>
						<button
							type="button"
							class="btn-select-all"
							onclick={toggleAllTripTypes}
						>
							{selectedTripTypes.length === data.tripTypes.length ? 'Deselect All' : 'Select All'}
						</button>
					</div>
					<div class="checkbox-grid">
						{#each data.tripTypes as type}
							<label class="checkbox-label">
								<input
									type="checkbox"
									name="trip_types"
									value={type.name}
									checked={selectedTripTypes.includes(type.name)}
									onchange={(e) => {
										const checked = (e.target as HTMLInputElement).checked;
										if (checked) {
											selectedTripTypes = [...selectedTripTypes, type.name];
										} else {
											selectedTripTypes = selectedTripTypes.filter(t => t !== type.name);
										}
									}}
								/>
								<span>{type.name}</span>
							</label>
						{/each}
					</div>
				</div>

				<div class="form-group">
					<div class="section-label-header">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label>Locations Serviced</label>
						<button
							type="button"
							class="btn-select-all"
							onclick={toggleAllLocations}
						>
							{selectedLocations.length === locationOptions.length ? 'Deselect All' : 'Select All'}
						</button>
					</div>
					<div class="checkbox-grid">
						{#each locationOptions as loc}
							<label class="checkbox-label">
								<input
									type="checkbox"
									name="locations"
									value={loc}
									checked={selectedLocations.includes(loc)}
									onchange={(e) => {
										const checked = (e.target as HTMLInputElement).checked;
										if (checked) {
											selectedLocations = [...selectedLocations, loc];
										} else {
											selectedLocations = selectedLocations.filter(l => l !== loc);
										}
									}}
								/>
								<span>{loc}</span>
							</label>
						{/each}
					</div>
				</div>

				<div class="form-group">
					<label for="notes">Admin Internal Notes</label>
					<textarea id="notes" name="notes" rows="4" value={data.captain.admin_notes || ''}></textarea>
				</div>
			</div>
		</div>

		<div class="form-actions">
			<a href="/admin/captains" class="btn btn-secondary">Cancel</a>
			<button type="submit" class="btn btn-primary">Save Changes</button>
		</div>
	</form>
</div>

<style>
	.admin-header {
		margin-bottom: 2rem;
	}

	.subtitle {
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--primary);
		font-weight: 700;
	}

	h1 {
		font-size: 2.25rem;
		font-weight: 700;
	}

	.form-container {
		padding: 2.5rem;
		border-radius: 16px;
		border: 1px solid var(--border-light);
	}

	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 3rem;
		margin-bottom: 2.5rem;
	}

	.form-column h3 {
		font-size: 1.25rem;
		margin-bottom: 1.5rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--border-light);
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	label {
		display: block;
		font-size: 0.85rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: var(--text-secondary);
	}

	.highlight-tag {
		font-size: 0.75rem;
		color: var(--primary);
		font-weight: 600;
		margin-left: 0.25rem;
	}

	.promo-header-group {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.promo-header-group label {
		margin-bottom: 0;
	}

	.btn-resync {
		background: none;
		border: none;
		color: var(--primary);
		font-size: 0.75rem;
		cursor: pointer;
		font-weight: 600;
		padding: 0;
		text-decoration: underline;
		transition: color 0.2s ease;
	}

	.btn-resync:hover {
		color: var(--primary-hover);
	}

	.input-helper {
		display: block;
		font-size: 0.78rem;
		color: var(--text-muted);
		margin-top: 0.35rem;
		line-height: 1.4;
	}

	input[type="text"],
	input[type="email"],
	input[type="tel"],
	input[type="number"],
	select,
	textarea {
		width: 100%;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		background: var(--input-bg);
		border: 1px solid var(--border-light);
		color: var(--text-primary);
		font-family: var(--font-body);
		font-size: 0.95rem;
		box-sizing: border-box;
	}

	input:focus, select:focus, textarea:focus {
		outline: none;
		border-color: var(--primary);
		background: var(--input-focus-bg);
	}

	.section-label-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.btn-select-all {
		background: none;
		border: none;
		color: var(--primary);
		font-size: 0.75rem;
		cursor: pointer;
		font-weight: 600;
		padding: 0;
	}

	.btn-select-all:hover {
		text-decoration: underline;
	}

	.checkbox-grid {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-height: 180px;
		overflow-y: auto;
		padding: 0.75rem;
		background: var(--input-bg);
		border: 1px solid var(--border-light);
		border-radius: 8px;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		color: var(--text-primary);
		cursor: pointer;
		margin-bottom: 0;
	}

	.toggle-label {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		cursor: pointer;
		font-weight: 600;
		color: var(--text-primary);
	}

	.toggle-label input[type="checkbox"] {
		width: 1.25rem;
		height: 1.25rem;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--border-light);
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
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

	.alert {
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
	}

	.alert-error {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid var(--danger);
		color: var(--danger);
	}

	@media (max-width: 900px) {
		.form-grid {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}
	}
</style>
