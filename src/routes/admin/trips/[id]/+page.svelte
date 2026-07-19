<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let listingDetails = $derived(data.trip.listing_templates as any);

	let savingNotes = $state(false);
	let assigningCaptain = $state(false);
	let cancelingTrip = $state(false);

	function formatDate(dateStr: string) {
		if (!dateStr) return '';
		return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Manage Trip Instance — SplitACharter</title>
</svelte:head>

<div class="admin-header">
	<div>
		<a href="/admin/trips" class="back-link">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4 inline mr-1">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
			</svg>
			Back to Trip Instances
		</a>
		<h1>Trip Instance Operations</h1>
		<span class="subtitle">Reference: {data.trip.id}</span>
	</div>
</div>

{#if form?.message}
	<div class="alert alert-error glass">
		<p>{form.message}</p>
	</div>
{/if}

<div class="ops-grid">
	<!-- Column 1: Passenger Bookings & Management -->
	<div class="column">
		<div class="card glass">
			<div class="card-header">
				<h2>Trip Details & Passengers</h2>
				<span class="badge status-badge trip-{data.trip.status}">{data.trip.status}</span>
			</div>
			
			<div class="card-body">
				<div class="details-summary">
					<p class="date">{formatDate(data.trip.date)}</p>
					<p class="specs">
						<strong>{listingDetails?.trip_type || ''}</strong> — 
						{listingDetails?.location || ''} ({listingDetails?.meeting_area || ''})
					</p>
				</div>

				<div class="divider"></div>

				<h3>Passenger Bookings</h3>
				{#if data.bookings.length === 0}
					<p class="empty-msg">No passenger bookings have been checked out on this slot yet.</p>
				{:else}
					<div class="bookings-list">
						{#each data.bookings as booking}
							{@const customer = booking.customers as any}
							<div class="booking-item glass">
								<div class="booking-header">
									<span class="name">{customer?.name || 'Passenger Group'}</span>
									<span class="badge badge-size">{booking.group_size} Pax</span>
								</div>
								<div class="contact-details">
									<span>{customer?.email || 'N/A'}</span>
									<span>{customer?.phone || 'N/A'}</span>
								</div>
								<div class="booking-footer">
									<span class="badge status-badge booking-{booking.status}">{booking.status}</span>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- Danger Zone -->
		<div class="card glass danger-card">
			<div class="card-header">
				<h2 class="danger-title">Danger Zone</h2>
			</div>
			<div class="card-body">
				<p class="danger-explanation">
					Canceling this trip instance is a manual, non-reversible operational action. 
					Both customer groups will be refunded their $50 deposit automatically, and they will receive cancellation emails/SMS.
				</p>
				
				{#if data.trip.status !== 'canceled'}
					<form 
						method="POST" 
						action="?/cancelTrip"
						use:enhance={() => {
							cancelingTrip = true;
							return async ({ update }) => {
								await update();
								cancelingTrip = false;
							};
						}}
					>
						<button 
							type="submit" 
							class="btn btn-danger"
							disabled={cancelingTrip}
							onclick={() => !confirm('Are you absolutely sure you want to cancel this entire charter and refund all booked passengers?')}
						>
							{cancelingTrip ? 'Canceling...' : 'Cancel Trip & Refund All'}
						</button>
					</form>
				{:else}
					<span class="indicator-canceled">This trip has already been canceled.</span>
				{/if}
			</div>
		</div>
	</div>

	<!-- Column 2: Captain Assignment & Notes -->
	<div class="column">
		<!-- Captain Assignment Card -->
		<div class="card glass">
			<div class="card-header">
				<h2>Skipper Assignment</h2>
			</div>
			
			<div class="card-body">
				{#if data.trip.captain_id}
					{@const currentCaptain = data.captains.find(c => c.id === data.trip.captain_id)}
					<div class="assigned-captain-badge glass">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 primary-glow">
							<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
						</svg>
						<div class="details">
							<span class="label">Assigned Captain</span>
							<span class="val">{currentCaptain?.name || 'Skipper Matched'}</span>
						</div>
					</div>
				{:else}
					<div class="unassigned-badge glass">
						<span class="dot warning-dot"></span>
						<div>
							<span class="label">Status</span>
							<span class="val">Unassigned (Waiting for Claim / Accept Blast)</span>
						</div>
					</div>
				{/if}

				<div class="divider"></div>

				<h3>Manual Override Assignment</h3>
				<p class="description">Select any active skipper below to override the automated blast and assign them directly to this trip.</p>

				{#if data.trip.status !== 'canceled'}
					<form 
						method="POST" 
						action="?/manualAssignCaptain"
						use:enhance={() => {
							assigningCaptain = true;
							return async ({ update }) => {
								await update();
								assigningCaptain = false;
							};
						}}
						class="assign-form"
					>
						<div class="form-group select-wrapper">
							<select name="captainId" value={data.trip.captain_id || ''}>
								<option value="" disabled>-- Select Captain --</option>
								{#each data.captains as cap}
									<option value={cap.id}>{cap.name}</option>
								{/each}
							</select>
						</div>
						<button type="submit" class="btn btn-primary" disabled={assigningCaptain}>
							{assigningCaptain ? 'Assigning...' : 'Assign Selected Captain'}
						</button>
					</form>
				{:else}
					<p class="disabled-msg">Cannot assign captains to canceled trips.</p>
				{/if}
			</div>
		</div>

		<!-- Internal Notes Card -->
		<div class="card glass">
			<div class="card-header">
				<h2>Internal Operations Notes</h2>
			</div>
			
			<form 
				method="POST" 
				action="?/saveNotes"
				use:enhance={() => {
					savingNotes = true;
					return async ({ update }) => {
						await update();
						savingNotes = false;
					};
				}}
				class="card-body"
			>
				<div class="form-group">
					<textarea 
						name="notes" 
						rows="6" 
						placeholder="Add internal logs, weather concerns, customer preferences, or custom pricing adjustments..."
						value={data.trip.notes || ''}
					></textarea>
				</div>
				<button type="submit" class="btn btn-secondary" disabled={savingNotes}>
					{savingNotes ? 'Saving Notes...' : 'Save Operations Notes'}
				</button>
			</form>
		</div>

		<!-- Skipper SMS Blast & Claim Auditing Card -->
		<div class="card glass">
			<div class="card-header">
				<h2>Skipper SMS Blast & Claim Auditing</h2>
			</div>
			<div class="card-body">
				<p class="description">Review SMS notifications dispatched to skippers for this trip, verify delivery status, and access claim/details links for testing.</p>

				{#if data.logs.length === 0}
					<p class="empty-msg">No SMS blast logs or details links found for this trip.</p>
				{:else}
					<div class="audit-list">
						{#each data.logs as log}
							{@const link = log.content.match(/https?:\/\/[^\s"'\s]+/)?.[0]}
							<div class="audit-item glass">
								<div class="audit-header">
									<span class="badge audit-template-badge {log.template}">{log.template.replace(/_/g, ' ')}</span>
									<span class="badge status-badge log-{log.status}">{log.status}</span>
								</div>
								<div class="audit-meta">
									<span><strong>Recipient:</strong> {log.recipient}</span>
									<span><strong>Sent:</strong> {new Date(log.created_at).toLocaleString()}</span>
								</div>
								<div class="audit-content">
									<p>{log.content}</p>
								</div>
								
								{#if link}
									<div class="audit-actions">
										<a href={link} target="_blank" class="btn btn-secondary btn-sm" style="display:inline-flex; align-items:center; gap:4px; font-size:0.8rem; padding:4px 8px; text-decoration:none; margin-right:8px;">
											<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5">
												<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
											</svg>
											Test Link
										</a>
										<button 
											type="button" 
											class="btn btn-secondary btn-sm" 
											style="font-size:0.8rem; padding:4px 8px;"
											onclick={() => {
												navigator.clipboard.writeText(link);
												alert('Copied link to clipboard!');
											}}
										>
											Copy Link
										</button>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.admin-header {
		margin-bottom: 2.5rem;
	}
	.back-link {
		color: var(--primary);
		text-decoration: none;
		font-size: 0.9rem;
		font-weight: 600;
		display: inline-flex;
		align-items: center;
		margin-bottom: 0.5rem;
	}
	.subtitle {
		font-size: 0.85rem;
		color: var(--text-muted);
		font-family: monospace;
	}
	.admin-header h1 {
		font-size: 2.25rem;
		font-weight: 800;
		letter-spacing: -0.5px;
		margin-top: 0.25rem;
	}

	.ops-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		margin-bottom: 3rem;
	}

	.column {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.card {
		border: 1px solid var(--border-light);
	}
	.card-header {
		padding: 1.25rem 2rem;
		border-bottom: 1px solid var(--border-light);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.card-header h2 {
		font-size: 1.15rem;
		font-weight: 700;
		color: var(--text-primary);
	}
	.card-body {
		padding: 2rem;
	}

	.details-summary .date {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--primary);
	}
	.details-summary .specs {
		font-size: 0.95rem;
		color: var(--text-secondary);
		margin-top: 4px;
	}

	.divider {
		height: 1px;
		background: var(--border-light);
		margin: 1.5rem 0;
	}

	.empty-msg {
		color: var(--text-muted);
		font-style: italic;
		font-size: 0.9rem;
	}

	.bookings-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-top: 1rem;
	}
	.booking-item {
		padding: 1.25rem;
		border: 1px solid var(--border-light);
		border-radius: 8px;
	}
	.booking-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-weight: 600;
		color: var(--text-primary);
	}
	.booking-header .badge-size {
		background: rgba(255, 255, 255, 0.05);
		color: var(--text-secondary);
		font-size: 0.75rem;
		padding: 2px 6px;
	}
	.contact-details {
		display: flex;
		flex-direction: column;
		font-size: 0.8rem;
		color: var(--text-muted);
		margin-top: 6px;
		gap: 2px;
	}
	.booking-footer {
		margin-top: 10px;
		display: flex;
	}

	.badge {
		font-size: 0.8rem;
		padding: 4px 10px;
		border-radius: 6px;
		font-weight: 600;
	}
	.status-badge {
		text-transform: capitalize;
	}
	.booking-paid { background: rgba(16, 185, 129, 0.1); color: var(--success); }
	.booking-awaiting-reconfirm { background: rgba(99, 102, 241, 0.1); color: var(--secondary); }
	.booking-reconfirmed { background: rgba(6, 182, 212, 0.1); color: var(--primary); }
	.booking-held { background: rgba(239, 68, 68, 0.1); color: var(--danger); }
	.booking-canceled, .booking-forfeited { background: rgba(255, 255, 255, 0.05); color: var(--text-muted); }

	.trip-open { background: rgba(255, 255, 255, 0.04); color: var(--text-secondary); }
	.trip-half-booked { background: rgba(6, 182, 212, 0.1); color: var(--primary); }
	.trip-pending-reconfirm { background: rgba(99, 102, 241, 0.1); color: var(--secondary); }
	.trip-confirmed { background: rgba(16, 185, 129, 0.1); color: var(--success); }
	.trip-completed { background: rgba(255, 255, 255, 0.02); color: var(--text-muted); }
	.trip-canceled { background: rgba(239, 68, 68, 0.1); color: var(--danger); }

	/* Skipper Badge */
	.assigned-captain-badge, .unassigned-badge {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 1.25rem;
		border: 1px solid var(--border-light);
		border-radius: 8px;
	}
	.assigned-captain-badge svg {
		width: 32px;
		height: 32px;
		color: var(--primary);
	}
	.unassigned-badge .dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background-color: var(--accent);
		box-shadow: 0 0 8px var(--accent);
	}
	.assigned-captain-badge .details, .unassigned-badge div {
		display: flex;
		flex-direction: column;
	}
	.assigned-captain-badge .label, .unassigned-badge .label {
		font-size: 0.75rem;
		color: var(--text-muted);
	}
	.assigned-captain-badge .val, .unassigned-badge .val {
		font-weight: 700;
		color: var(--text-primary);
		font-size: 1.05rem;
	}

	.description {
		font-size: 0.85rem;
		color: var(--text-secondary);
		margin-top: 10px;
		margin-bottom: 1.25rem;
		line-height: 1.5;
	}

	.assign-form {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.select-wrapper select {
		width: 100%;
		padding: 10px 12px;
		font-size: 0.9rem;
	}

	textarea {
		width: 100%;
		padding: 10px 12px;
		font-size: 0.9rem;
		line-height: 1.5;
		resize: vertical;
		margin-bottom: 1rem;
	}

	/* Danger Card */
	.danger-card {
		border: 1px solid rgba(239, 68, 68, 0.2);
	}
	.danger-title {
		color: var(--danger) !important;
	}
	.danger-explanation {
		font-size: 0.85rem;
		color: var(--text-secondary);
		line-height: 1.6;
		margin-bottom: 1.25rem;
	}
	.indicator-canceled {
		color: var(--danger);
		font-weight: 600;
		font-size: 0.9rem;
	}
	.disabled-msg {
		color: var(--text-muted);
		font-style: italic;
		font-size: 0.85rem;
	}

	.alert-error {
		padding: 1rem;
		margin-bottom: 2rem;
		border-radius: 6px;
		border: 1px solid rgba(239, 68, 68, 0.2);
		color: var(--danger);
	}

	/* Auditing Card Styles */
	.audit-list {
		display: flex;
		flex-direction: column;
		gap: 16px;
		margin-top: 1rem;
	}
	.audit-item {
		padding: 1.25rem;
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.audit-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.audit-template-badge {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		background: rgba(99, 102, 241, 0.12);
		color: #a5b4fc;
		border: 1px solid rgba(99, 102, 241, 0.2);
	}
	.audit-template-badge.captain_details_link {
		background: rgba(6, 182, 212, 0.12);
		color: #cffafe;
		border: 1px solid rgba(6, 182, 212, 0.2);
	}
	.log-delivered {
		background: rgba(16, 185, 129, 0.12);
		color: var(--success);
		border: 1px solid rgba(16, 185, 129, 0.2);
	}
	.log-failed {
		background: rgba(239, 68, 68, 0.12);
		color: var(--danger);
		border: 1px solid rgba(239, 68, 68, 0.2);
	}
	.log-suppressed {
		background: rgba(156, 163, 175, 0.12);
		color: var(--text-muted);
		border: 1px solid rgba(156, 163, 175, 0.2);
	}
	.audit-meta {
		display: flex;
		justify-content: space-between;
		font-size: 0.8rem;
		color: var(--text-secondary);
	}
	.audit-content {
		font-size: 0.85rem;
		line-height: 1.5;
		color: var(--text-primary);
		background: rgba(0, 0, 0, 0.15);
		padding: 10px;
		border-radius: 6px;
		border: 1px solid rgba(255, 255, 255, 0.02);
		word-break: break-all;
	}
	.audit-actions {
		display: flex;
		margin-top: 4px;
	}

	@media (max-width: 768px) {
		.ops-grid {
			grid-template-columns: 1fr;
			gap: 2rem;
		}
	}
</style>
