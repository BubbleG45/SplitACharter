<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let savingId = $state<string | null>(null);
	let saveSuccessId = $state<string | null>(null);

	const triggerPlaceholders: Record<string, string[]> = {
		match_detected: ['{customer_name}', '{trip_date}', '{trip_type}', '{dashboard_url}'],
		reconfirm_reminder: ['{customer_name}', '{trip_date}', '{deadline_time}', '{dashboard_url}'],
		reconfirm_forfeited: ['{customer_name}', '{trip_date}'],
		captain_blast: ['{trip_type}', '{trip_date}', '{location}', '{accept_url}'],
		captain_confirmed: ['{customer_name}', '{captain_name}', '{captain_phone}', '{meeting_area}', '{trip_date}', '{trip_type}'],
		captain_secured: ['{captain_name}', '{trip_date}', '{trip_type}', '{passenger_list}'],
		matching_timeout: ['{customer_name}', '{trip_date}', '{trip_type}']
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
	{#each data.settings as setting (setting.id)}
		<div class="template-card glass">
			<div class="card-header">
				<h2>{formatTriggerName(setting.trigger_name)}</h2>
				<span class="code-ref">{setting.trigger_name}</span>
			</div>
			
			<form 
				method="POST" 
				action="?/saveTemplate"
				use:enhance={() => {
					savingId = setting.id;
					saveSuccessId = null;
					return async ({ update, result }) => {
						await update();
						savingId = null;
						if (result.type === 'success') {
							saveSuccessId = setting.id;
							setTimeout(() => {
								if (saveSuccessId === setting.id) {
									saveSuccessId = null;
								}
							}, 3000);
						}
					};
				}}
				class="card-body"
			>
				<input type="hidden" name="id" value={setting.id} />

				<!-- Channel Status Toggles -->
				<div class="channels-row">
					<div class="toggle-group">
						<label class="toggle-label">
							<input 
								type="checkbox" 
								checked={setting.email_enabled}
								onchange={(e) => {
									setting.email_enabled = (e.target as HTMLInputElement).checked;
								}}
							/>
							<span class="toggle-text">Email Channel</span>
						</label>
						<input type="hidden" name="email_enabled" value={setting.email_enabled ? 'true' : 'false'} />
					</div>

					<div class="toggle-group">
						<label class="toggle-label">
							<input 
								type="checkbox" 
								checked={setting.sms_enabled}
								onchange={(e) => {
									setting.sms_enabled = (e.target as HTMLInputElement).checked;
								}}
							/>
							<span class="toggle-text">SMS Channel</span>
						</label>
						<input type="hidden" name="sms_enabled" value={setting.sms_enabled ? 'true' : 'false'} />
					</div>
				</div>

				<div class="divider"></div>

				<!-- Email Template Editor -->
				<div class="form-group" class:disabled={!setting.email_enabled}>
					<label for="email-template-{setting.id}">Email Body Template</label>
					<textarea 
						id="email-template-{setting.id}" 
						name="email_template" 
						disabled={!setting.email_enabled}
						rows="4"
						placeholder="Disabled (toggled off)"
						value={setting.email_template || ''}
					></textarea>
				</div>

				<!-- SMS Template Editor -->
				<div class="form-group" class:disabled={!setting.sms_enabled}>
					<label for="sms-template-{setting.id}">SMS Text Template</label>
					<textarea 
						id="sms-template-{setting.id}" 
						name="sms_template" 
						disabled={!setting.sms_enabled}
						rows="3"
						placeholder="Disabled (toggled off)"
						value={setting.sms_template || ''}
					></textarea>
				</div>

				<!-- Placeholders Cheat-sheet -->
				<div class="placeholders-info">
					<span class="info-title">Supported Placeholders:</span>
					<div class="placeholders-chips">
						{#each triggerPlaceholders[setting.trigger_name] || ['{customer_name}'] as ph}
							<code class="ph-chip">{ph}</code>
						{/each}
					</div>
				</div>

				<div class="card-footer">
					{#if saveSuccessId === setting.id}
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
						disabled={savingId === setting.id}
					>
						{savingId === setting.id ? 'Saving...' : 'Save Configuration'}
					</button>
				</div>
			</form>
		</div>
	{/each}
</div>

<style>
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
		grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
		gap: 2rem;
		margin-bottom: 3rem;
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
		background: rgba(255, 255, 255, 0.01);
		border: 1px solid var(--border-light);
		padding: 1rem;
		border-radius: 6px;
	}
	.info-title {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-secondary);
		display: block;
		margin-bottom: 8px;
	}
	.placeholders-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.ph-chip {
		font-size: 0.72rem;
		color: var(--primary);
		background: rgba(6, 182, 212, 0.05);
		border: 1px solid rgba(6, 182, 212, 0.12);
		padding: 2px 6px;
		border-radius: 4px;
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

	@media (max-width: 576px) {
		.settings-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
