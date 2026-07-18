<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	/* svelte-ignore state_referenced_locally */
	let active = $state(data.captain.active);

	const locationOptions = [
		'Miami Beach Marina',
		'Key West Bight Marina',
		'Marathon Marina',
		'Bahia Honda Marina',
		'Tampa Bay Yacht Club',
		'Destin Harbor Marina'
	];
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
					<input type="text" id="name" name="name" value={data.captain.name} required />
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

				<div class="form-group">
					<label for="referral_promo_code">Referral Promo Code</label>
					<input type="text" id="referral_promo_code" name="referral_promo_code" value={data.captain.referral_promo_code} />
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
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label>Trip Types Approved</label>
					<div class="options-grid">
						{#each data.tripTypes as type}
							<label class="checkbox-option">
								<input type="checkbox" name="trip_types" value={type.name} checked={data.captain.trip_types?.includes(type.name)} />
								<span>{type.name}</span>
							</label>
						{/each}
					</div>
				</div>

				<div class="form-group">
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label>Locations / Marinas Approved</label>
					<div class="options-grid">
						{#each locationOptions as loc}
							<label class="checkbox-option">
								<input type="checkbox" name="locations" value={loc} checked={data.captain.locations?.includes(loc)} />
								<span>{loc}</span>
							</label>
						{/each}
					</div>
				</div>

				<div class="form-group">
					<label for="notes">Internal Admin Notes</label>
					<textarea id="notes" name="notes" rows="4" placeholder="Licensing status, boat type, auxiliary contact info..." value={data.captain.admin_notes || ''}></textarea>
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

	.form-container {
		border: 1px solid var(--border-light);
		padding: 2.5rem;
		margin-bottom: 3rem;
	}
	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 3rem;
		margin-bottom: 2rem;
	}
	.form-column h3 {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 1.5rem;
		border-bottom: 1px solid var(--border-light);
		padding-bottom: 8px;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-bottom: 1.25rem;
	}
	.form-group label {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-secondary);
	}
	.form-group input[type="text"],
	.form-group input[type="email"],
	.form-group input[type="tel"],
	.form-group input[type="number"],
	.form-group select,
	.form-group textarea {
		width: 100%;
		padding: 10px 12px;
		font-size: 0.9rem;
	}
	
	.checkbox-group {
		margin-top: 1.5rem;
	}
	.toggle-label {
		display: flex;
		align-items: center;
		gap: 10px;
		cursor: pointer;
		font-weight: 600;
		color: var(--text-primary);
	}
	.toggle-label input[type="checkbox"] {
		width: 18px;
		height: 18px;
		accent-color: var(--primary);
	}

	.options-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
		background: rgba(255, 255, 255, 0.01);
		border: 1px solid var(--border-light);
		padding: 1rem;
		border-radius: 6px;
	}
	.checkbox-option {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.85rem;
		color: var(--text-secondary);
		cursor: pointer;
	}
	.checkbox-option input[type="checkbox"] {
		width: 16px;
		height: 16px;
		accent-color: var(--primary);
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1.25rem;
		border-top: 1px solid var(--border-light);
		padding-top: 1.5rem;
	}
	.btn {
		text-decoration: none;
	}

	.alert-error {
		padding: 1rem;
		margin-bottom: 2rem;
		border-radius: 6px;
		border: 1px solid rgba(239, 68, 68, 0.2);
		color: var(--danger);
	}

	@media (max-width: 768px) {
		.form-grid {
			grid-template-columns: 1fr;
			gap: 2rem;
		}
	}
</style>
