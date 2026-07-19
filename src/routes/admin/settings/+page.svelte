<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let savingId = $state<string | null>(null);
	let saveSuccessId = $state<string | null>(null);
	let selectedId = $state<string | null>(null);

	// Automatically select the first template once the settings are loaded
	$effect(() => {
		if (!selectedId && data.settings.length > 0) {
			selectedId = data.settings[0].id;
		}
	});

	const selectedSetting = $derived(data.settings.find(s => s.id === selectedId));

	const triggerPlaceholders: Record<string, string[]> = {
		match_detected: ['{customer_name}', '{trip_date}', '{trip_type}', '{dashboard_url}'],
		reconfirm_reminder: ['{customer_name}', '{trip_date}', '{deadline_time}', '{dashboard_url}'],
		reconfirm_forfeited: ['{customer_name}', '{trip_date}'],
		counterpart_forfeited: ['{customer_name}', '{trip_date}'],
		captain_blast: ['{trip_type}', '{trip_date}', '{location}', '{accept_url}'],
		captain_confirmed: ['{customer_name}', '{captain_name}', '{captain_phone}', '{meeting_area}', '{trip_date}', '{trip_type}'],
		captain_secured: ['{captain_name}', '{trip_date}', '{trip_type}', '{passenger_list}'],
		captain_details_link: ['{trip_type}', '{trip_date}', '{location}', '{details_url}'],
		matching_timeout: ['{customer_name}', '{trip_date}', '{trip_type}'],
		unmatched_trip_timeout: ['{customer_name}', '{trip_date}', '{trip_type}']
	};

	function formatTriggerName(name: string) {
		return name
			.replace(/_/g, ' ')
			.replace(/\b\w/g, (char) => char.toUpperCase());
	}
</script>

<svelte:head>
	<title>Notification Settings — SplitACharter</title>
</svelte:head>

<div class="admin-header">
	<div>
		<span class="subtitle">Platform Configuration</span>
		<h1>Notification Settings</h1>
	</div>
</div>

{#if form?.message}
	<div class="alert alert-error glass">
		<p>{form.message}</p>
	</div>
{/if}

<div class="settings-grid">
	<!-- Left Sidebar List -->
	<div class="template-sidebar glass">
		<div class="sidebar-header">
			<h3>Select Template</h3>
		</div>
		<div class="sidebar-list">
			{#each data.settings as setting}
				<button 
					type="button" 
					class="sidebar-item" 
					class:active={selectedId === setting.id}
					onclick={() => selectedId = setting.id}
				>
					<div class="item-title">{formatTriggerName(setting.trigger_name)}</div>
					<div class="item-meta">
						<span class="status-dot" class:enabled={setting.email_enabled || setting.sms_enabled}></span>
						<span class="meta-code">{setting.trigger_name}</span>
					</div>
				</button>
			{/each}
		</div>
	</div>

	<!-- Right Form Editor -->
	<div class="template-detail">
		{#if selectedSetting}
			<div class="template-card glass">
				<div class="card-header">
					<h2>{formatTriggerName(selectedSetting.trigger_name)}</h2>
					<span class="code-ref">{selectedSetting.trigger_name}</span>
				</div>
				
				<form 
					method="POST" 
					action="?/saveTemplate"
					use:enhance={() => {
						savingId = selectedSetting.id;
						saveSuccessId = null;
						return async ({ update, result }) => {
							await update();
							savingId = null;
							if (result.type === 'success') {
								saveSuccessId = selectedSetting.id;
								setTimeout(() => {
									if (saveSuccessId === selectedSetting.id) {
										saveSuccessId = null;
									}
								}, 3000);
							}
						};
					}}
					class="card-body"
				>
					<input type="hidden" name="id" value={selectedSetting.id} />

					<!-- Channel Status Toggles -->
					<div class="channels-row">
						<div class="toggle-group">
							<label class="toggle-label">
								<input 
									type="checkbox" 
									checked={selectedSetting.email_enabled}
									onchange={(e) => {
										selectedSetting.email_enabled = (e.target as HTMLInputElement).checked;
									}}
								/>
								<span class="toggle-text">Email Channel</span>
							</label>
							<input type="hidden" name="email_enabled" value={selectedSetting.email_enabled ? 'true' : 'false'} />
						</div>

						<div class="toggle-group">
							<label class="toggle-label">
								<input 
									type="checkbox" 
									checked={selectedSetting.sms_enabled}
									onchange={(e) => {
										selectedSetting.sms_enabled = (e.target as HTMLInputElement).checked;
									}}
								/>
								<span class="toggle-text">SMS Channel</span>
							</label>
							<input type="hidden" name="sms_enabled" value={selectedSetting.sms_enabled ? 'true' : 'false'} />
						</div>
					</div>

					<div class="divider"></div>

					<!-- Email Template Editor -->
					<div class="form-group" class:disabled={!selectedSetting.email_enabled}>
						<label for="email-template-{selectedSetting.id}">Email Body Template</label>
						<textarea 
							id="email-template-{selectedSetting.id}" 
							name="email_template" 
							disabled={!selectedSetting.email_enabled}
							rows="5"
							placeholder="Disabled (toggled off)"
							value={selectedSetting.email_template || ''}
						></textarea>
					</div>

					<!-- SMS Template Editor -->
					<div class="form-group" class:disabled={!selectedSetting.sms_enabled}>
						<label for="sms-template-{selectedSetting.id}">SMS Text Template</label>
						<textarea 
							id="sms-template-{selectedSetting.id}" 
							name="sms_template" 
							disabled={!selectedSetting.sms_enabled}
							rows="4"
							placeholder="Disabled (toggled off)"
							value={selectedSetting.sms_template || ''}
						></textarea>
					</div>

					<!-- Placeholders Cheat-sheet -->
					<div class="placeholders-info">
						<span class="info-title">Supported Placeholders:</span>
						<span class="placeholders-text">
							{#each triggerPlaceholders[selectedSetting.trigger_name] || ['{customer_name}'] as ph, idx}
								<code class="ph-code">{ph}</code>{#if idx < (triggerPlaceholders[selectedSetting.trigger_name] || ['{customer_name}']).length - 1}, {/if}
							{/each}
						</span>
					</div>

					<div class="card-footer">
						{#if saveSuccessId === selectedSetting.id}
							<span class="status-alert success-msg">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4 inline">
									<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
								</svg>
								Changes saved!
							</span>
						{/if}

						<button 
							type="submit" 
							class="btn btn-primary"
							disabled={savingId === selectedSetting.id}
						>
							{savingId === selectedSetting.id ? 'Saving...' : 'Save Configuration'}
						</button>
					</div>
				</form>
			</div>
		{:else}
			<div class="empty-state glass">
				<p>Select a notification trigger template from the sidebar list to edit its channels and templates.</p>
			</div>
		{/if}
	</div>
</div>

<div class="divider-main"></div>

<div class="admin-header section-header">
	<div>
		<span class="subtitle">Operations Configuration</span>
		<h2>Allowed Trip Types</h2>
		<p class="section-desc">Manage the exact categories of charters allowed on the platform.</p>
	</div>
</div>

{#if form?.tripTypeMessage}
	<div class="alert alert-error glass">
		<p>{form.tripTypeMessage}</p>
	</div>
{/if}

<div class="trip-types-container glass">
	<div class="trip-types-grid">
		<div class="add-type-form">
			<h3>Add New Trip Type</h3>
			<form method="POST" action="?/addTripType" use:enhance class="type-form">
				<div class="form-group">
					<label for="new-trip-type">Trip Type Name</label>
					<input 
						id="new-trip-type" 
						type="text" 
						name="name" 
						placeholder="e.g. Eco Tour" 
						required 
						class="text-input"
					/>
				</div>
				<button type="submit" class="btn btn-primary" style="margin-top: 0.5rem; align-self: flex-start;">Add Trip Type</button>
			</form>
		</div>

		<div class="types-list-section">
			<h3>Active Trip Types ({data.tripTypes?.length || 0})</h3>
			{#if !data.tripTypes || data.tripTypes.length === 0}
				<p class="empty-msg">No trip types defined. The system requires at least one.</p>
			{:else}
				<div class="types-table glass">
					{#each data.tripTypes as type}
						<div class="type-row">
							<span class="type-name">{type.name}</span>
							<form method="POST" action="?/deleteTripType" use:enhance class="delete-form">
								<input type="hidden" name="name" value={type.name} />
								<button 
									type="submit" 
									class="btn-danger-action"
									onclick={(e) => {
										if (!confirm(`Are you sure you want to delete "${type.name}"?`)) {
											e.preventDefault();
										}
									}}
								>
									Delete
								</button>
							</form>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.divider-main {
		margin: 4rem 0 3rem 0;
		height: 1px;
		background: linear-gradient(90deg, transparent, var(--border-light), transparent);
	}
	.section-header {
		margin-bottom: 1.5rem;
	}
	.section-header h2 {
		font-size: 1.75rem;
		font-weight: 800;
		margin-top: 0.25rem;
	}
	.section-desc {
		font-size: 0.95rem;
		color: var(--text-secondary);
		margin-top: 0.25rem;
	}
	.trip-types-container {
		border: 1px solid var(--border-light);
		padding: 2.5rem;
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.01);
		margin-bottom: 4rem;
	}
	.trip-types-grid {
		display: grid;
		grid-template-columns: 1fr 2fr;
		gap: 3rem;
	}
	.trip-types-grid h3 {
		font-size: 1.15rem;
		font-weight: 700;
		margin-bottom: 1rem;
		color: var(--text-primary);
	}
	.type-form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	.text-input {
		width: 100%;
		padding: 10px 12px;
		font-size: 0.9rem;
		background: rgba(0, 0, 0, 0.2);
		border: 1px solid var(--border-light);
		border-radius: 6px;
		color: var(--text-primary);
		font-family: var(--font-body);
		transition: border-color 0.2s;
	}
	.text-input:focus {
		border-color: var(--primary);
		outline: none;
	}
	.types-table {
		border: 1px solid var(--border-light);
		border-radius: 6px;
		overflow: hidden;
		max-height: 400px;
		overflow-y: auto;
	}
	.type-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1.5rem;
		border-bottom: 1px solid var(--border-light);
		transition: background-color 0.2s;
	}
	.type-row:last-child {
		border-bottom: none;
	}
	.type-row:hover {
		background: rgba(255, 255, 255, 0.02);
	}
	.type-name {
		font-weight: 600;
		font-size: 0.95rem;
		color: var(--text-primary);
	}
	.empty-msg {
		color: var(--text-muted);
		font-style: italic;
		font-size: 0.9rem;
	}
	.btn-danger-action {
		background: rgba(239, 68, 68, 0.1);
		color: var(--danger);
		border: 1px solid rgba(239, 68, 68, 0.2);
		font-size: 0.8rem;
		padding: 4px 10px;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s;
	}
	.btn-danger-action:hover {
		background: var(--danger);
		color: #fff;
		border-color: var(--danger);
	}

	.admin-header {
		margin-bottom: 2.5rem;
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

	.settings-grid {
		display: grid;
		grid-template-columns: 280px 1fr;
		gap: 2rem;
		margin-bottom: 3rem;
		align-items: start;
	}

	/* Sidebar Styles */
	.template-sidebar {
		border: 1px solid var(--border-light);
		border-radius: 8px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}
	.sidebar-header {
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid var(--border-light);
		background: rgba(255, 255, 255, 0.02);
	}
	.sidebar-header h3 {
		font-size: 1rem;
		font-weight: 700;
		margin: 0;
		color: var(--text-primary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	.sidebar-list {
		display: flex;
		flex-direction: column;
		max-height: 550px;
		overflow-y: auto;
	}
	.sidebar-item {
		width: 100%;
		text-align: left;
		padding: 0.6rem 1rem;
		background: transparent;
		border: none;
		border-bottom: 1px solid var(--border-light);
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 4px;
		transition: all 0.2s ease;
	}
	.sidebar-item:last-child {
		border-bottom: none;
	}
	.sidebar-item:hover {
		background: rgba(255, 255, 255, 0.03);
	}
	.sidebar-item.active {
		background: rgba(6, 182, 212, 0.08);
		border-left: 3px solid var(--primary);
		padding-left: calc(1rem - 3px);
	}
	.item-title {
		font-weight: 600;
		font-size: 0.88rem;
		color: var(--text-primary);
	}
	.sidebar-item.active .item-title {
		color: var(--primary);
	}
	.item-meta {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.72rem;
		color: var(--text-muted);
	}
	.meta-code {
		font-family: monospace;
	}
	.status-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: rgba(239, 68, 68, 0.4);
		border: 1px solid rgba(239, 68, 68, 0.6);
		display: inline-block;
		flex-shrink: 0;
	}
	.status-dot.enabled {
		background: var(--success);
		box-shadow: 0 0 8px var(--success);
		border-color: rgba(16, 185, 129, 0.5);
	}

	.template-detail {
		display: flex;
		flex-direction: column;
	}

	.empty-state {
		padding: 3rem;
		text-align: center;
		border-radius: 8px;
		border: 1px dashed var(--border-light);
		color: var(--text-muted);
	}

	.template-card {
		border: 1px solid var(--border-light);
		display: flex;
		flex-direction: column;
	}
	.card-header {
		padding: 1.5rem 2rem;
		border-bottom: 1px solid var(--border-light);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.card-header h2 {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text-primary);
	}
	.code-ref {
		font-family: monospace;
		font-size: 0.75rem;
		color: var(--text-muted);
		background: rgba(255, 255, 255, 0.03);
		padding: 2px 8px;
		border-radius: 4px;
		border: 1px solid var(--border-light);
	}

	.card-body {
		padding: 2rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		flex-grow: 1;
	}

	.channels-row {
		display: flex;
		gap: 2rem;
	}
	.toggle-group {
		display: flex;
		align-items: center;
	}
	.toggle-label {
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	.toggle-label input[type="checkbox"] {
		width: 18px;
		height: 18px;
		cursor: pointer;
		accent-color: var(--primary);
	}

	.divider {
		height: 1px;
		background: var(--border-light);
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
		transition: opacity 0.2s ease;
	}
	.form-group.disabled {
		opacity: 0.4;
	}
	.form-group label {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-secondary);
	}
	.form-group textarea {
		width: 100%;
		padding: 10px 12px;
		font-size: 0.9rem;
		line-height: 1.5;
		resize: vertical;
		font-family: var(--font-body);
	}

	.placeholders-info {
		padding: 0.5rem 0;
	}
	.info-title {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-secondary);
		display: inline-block;
		margin-right: 6px;
	}
	.placeholders-text {
		font-size: 0.82rem;
		color: var(--text-secondary);
	}
	.ph-code {
		font-family: monospace;
		font-size: 0.82rem;
		color: var(--primary);
		background: none;
		border: none;
		padding: 0;
	}

	.card-footer {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 1rem;
		margin-top: auto;
		padding-top: 1rem;
	}
	.status-alert {
		font-size: 0.85rem;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 4px;
	}
	.success-msg {
		color: var(--success);
	}

	.btn {
		font-size: 0.9rem;
		padding: 8px 16px;
	}

	.alert-error {
		padding: 1rem;
		margin-bottom: 2rem;
		border-radius: 6px;
		border: 1px solid rgba(239, 68, 68, 0.2);
		color: var(--danger);
	}

	@media (max-width: 992px) {
		.settings-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
