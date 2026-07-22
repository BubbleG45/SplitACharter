<script lang="ts">
	import { enhance } from '$app/forms';

	let { data } = $props();

	function formatDate(dateStr: string | null | undefined) {
		if (!dateStr) return 'Date Pending';
		try {
			const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
			const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
			if (isNaN(d.getTime())) return dateStr;
			return d.toLocaleDateString('en-US', options);
		} catch (e) {
			return dateStr;
		}
	}

	function formatPhoneNumber(phone: string | null | undefined) {
		if (!phone) return 'Not provided';
		const cleaned = ('' + phone).replace(/\D/g, '');
		if (cleaned.length === 10) {
			return `(${cleaned.slice(0, 3)})${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
		} else if (cleaned.length === 11 && cleaned.startsWith('1')) {
			return `(${cleaned.slice(1, 4)})${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
		}
		return phone;
	}

	let copiedId = $state('');
	let cancelingBooking = $state<any>(null);
	let cancellingInProgress = $state(false);

	function handleCopy(id: string) {
		navigator.clipboard.writeText(id);
		copiedId = id;
		setTimeout(() => {
			if (copiedId === id) {
				copiedId = '';
			}
		}, 2000);
	}
</script>

<svelte:head>
	<title>Customer Dashboard — SplitACharter</title>
</svelte:head>

<div class="dashboard-wrapper">
	<div class="bg-blur bg-blur-1"></div>
	<div class="bg-blur bg-blur-2"></div>

	<div class="dashboard-container">
		<header class="dashboard-header">
			<div class="user-welcome">
				<span class="logo-badge">SplitACharter Portal</span>
				<h1>Hello, {data.profile?.name || 'Customer'}</h1>
				<p class="subtitle">Manage your shared charters, track matches, and view reservation details.</p>
			</div>
			<div class="header-actions">
				<a href="/browse" class="btn btn-primary">Browse Charters</a>
				<form action="/login?/signOut" method="POST" style="display: inline;">
					<button type="submit" class="btn btn-secondary">Sign Out</button>
				</form>
			</div>
		</header>

		<!-- Profile info summary -->
		<div class="profile-card glass">
			<div class="profile-avatar">
				{data.profile?.name?.charAt(0).toUpperCase() || 'C'}
			</div>
			<div class="profile-info">
				<div class="info-group">
					<span class="label">Email Address</span>
					<span class="value">{data.profile?.email}</span>
				</div>
				<div class="info-group">
					<span class="label">Phone Number</span>
					<span class="value">{formatPhoneNumber(data.profile?.phone)}</span>
				</div>
				<div class="info-group">
					<span class="label">Account Status</span>
					<span class="value status-val">
						{#if data.profile?.flagged}
							<span class="flagged-indicator">Suspended</span>
						{:else if data.profile?.strike_count > 0}
							<span class="strikes-indicator">{data.profile?.strike_count} / 3 Strikes</span>
						{:else}
							<span class="active-indicator">Good Standing</span>
						{/if}
					</span>
				</div>
			</div>
		</div>

		<!-- Bookings List -->
		<section class="bookings-section">
			<h2>My Reservations</h2>

			{#if data.bookings.length === 0}
				<div class="empty-state glass">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" class="w-12 h-12 empty-icon">
						<path stroke-linecap="round" stroke-linejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25" />
					</svg>
					<h3>No Bookings Found</h3>
					<p>You haven't booked any shared charters yet. Browse our listing templates to open a date or join an existing trip!</p>
					<a href="/browse" class="btn btn-primary mt-4">Browse Charters</a>
				</div>
			{:else}
				<div class="bookings-list">
					{#each data.bookings as booking (booking.id)}
						{@const trip = (Array.isArray(booking.trip_instances) ? booking.trip_instances[0] : booking.trip_instances) as any}
						{@const template = (trip && Array.isArray(trip.listing_templates) ? trip.listing_templates[0] : trip?.listing_templates) as any}
						
						<div class="booking-card glass">
							<div class="booking-card-header">
								<div class="trip-meta">
									<span class="trip-date">{formatDate(trip?.date)}</span>
									<h3>{template?.trip_type || 'Charter Reservation'}</h3>
									<span class="trip-loc">{template?.location || 'Florida Keys'} — {template?.meeting_area || 'Provided by captain'}</span>
								</div>
								
								<div class="status-meta">
									<div class="status-group">
										<span class="status-lbl">Booking State</span>
										<span class="status-badge booking-{booking.status}">
											{booking.status}
										</span>
									</div>
									<div class="status-group">
										<span class="status-lbl">Charter Share</span>
										<span class="status-badge trip-{trip?.status || 'open'}">
											{#if trip?.status === 'open'}
												0 of 2 Booked
											{:else if trip?.status === 'half-booked'}
												1 of 2 Booked (Half-Booked)
											{:else if trip?.status === 'pending-reconfirm'}
												2 of 2 Booked (Pending Reconfirmation)
											{:else}
												{trip?.status || 'open'}
											{/if}
										</span>
									</div>
								</div>
							</div>

							<div class="booking-card-body">
								<div class="detail-row">
									<div class="detail-item">
										<span class="lbl">Group Size</span>
										<span class="val">{booking.group_size} Passengers</span>
									</div>
									<div class="detail-item">
										<span class="lbl">Reservation deposit paid</span>
										<span class="val price-val">$50.00</span>
									</div>
									<div class="detail-item">
										<span class="lbl">Booking Reference</span>
										<span class="val ref-val" style="display: flex; align-items: center; gap: 6px;">
											<span style="flex: 1; word-break: break-all;">{booking.id}</span>
											<button
												type="button"
												class="copy-btn"
												title="Copy Reference ID"
												onclick={() => handleCopy(booking.id)}
												style="background: none; border: none; padding: 4px; display: inline-flex; align-items: center; cursor: pointer; color: {copiedId === booking.id ? 'var(--success)' : 'var(--text-muted)'}; transition: color 0.2s;"
											>
												{#if copiedId === booking.id}
													<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 14px; height: 14px;">
														<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
													</svg>
												{:else}
													<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 14px; height: 14px;">
														<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-1.5a2.251 2.251 0 00-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 00-9-9z" />
													</svg>
												{/if}
											</button>
										</span>
									</div>
								</div>

								<!-- Action/Helper Info boxes based on status -->
								{#if booking.status === 'paid' && trip?.status === 'half-booked'}
									<div class="info-alert info-primary glass">
										<span class="pulse-dot"></span>
										<p><strong>Waiting for a second group to join.</strong> Once another group books this date, both groups will receive a text and email request to reconfirm. If no group joins by the trip date, your deposit is automatically refunded.</p>
									</div>
								{:else if booking.status === 'paid' && trip?.status === 'pending-reconfirm'}
									<div class="info-alert info-warning glass">
										<p><strong>Reconfirmation Pending.</strong> The charter has reached 2-of-2 groups. You will receive an SMS and email notification shortly to reconfirm your attendance. Check your phone!</p>
									</div>
								{:else if booking.status === 'awaiting-reconfirm'}
									<div class="info-alert info-warning glass action-alert">
										<p><strong>Attendance Verification Required!</strong> Please reconfirm your booking now. Failure to do so before the window closes will result in forfeiture of your deposit.</p>
										<form method="POST" action="?/reconfirm" use:enhance>
											<input type="hidden" name="bookingId" value={booking.id} />
											<button type="submit" class="btn btn-primary btn-small">Reconfirm Booking</button>
										</form>
									</div>
								{:else if booking.status === 'reconfirmed'}
									<div class="info-alert info-success glass">
										<p><strong>Booking Reconfirmed!</strong> You've verified your slot. We are now running the captain matching sequence. Once a captain accepts, we will send you their contact details!</p>
									</div>
								{:else if booking.status === 'held'}
									<div class="info-alert info-danger glass">
										<p><strong>Booking Held.</strong> Your counterpart group failed to reconfirm, so the trip has reset. Your $50.00 fee is being held. You can apply it to a new match or request a manual refund from support.</p>
									</div>
								{/if}

								<!-- Reservation Question & Cancel Action -->
								<div class="booking-card-footer">
									<a
										href="mailto:info@splitacharter.com?subject={encodeURIComponent(`Trip Question - Booking Ref: ${booking.id}`)}&body={encodeURIComponent(`Hello SplitACharter Support,\n\nI have a question regarding my trip reservation.\n\nBooking Reference: ${booking.id}\nTrip Type: ${template?.trip_type || 'N/A'}\nDate: ${trip?.date || 'N/A'}\nLocation: ${template?.location || 'N/A'}\n\nMy Question:\n`)}"
										target="_blank"
										rel="noopener noreferrer"
										class="btn btn-secondary btn-question"
									>
										<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
											<path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M12 18h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
										<span>Have Questions? Email Support</span>
									</a>

									{#if !['canceled', 'forfeited', 'completed'].includes(booking.status)}
										<div class="cancel-action-group">
											<button
												type="button"
												class="btn btn-danger-outline btn-cancel"
												onclick={() => (cancelingBooking = { booking, trip, template })}
											>
												<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
													<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
												</svg>
												<span>Cancel Booking</span>
											</button>
											<a href="/how-it-works#cancellation-policy" target="_blank" class="faq-policy-link">
												FAQ Cancellation Policy
											</a>
										</div>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</section>
	</div>
</div>

<!-- Double Confirmation Cancellation Modal -->
{#if cancelingBooking}
	<div class="modal-backdrop" onclick={() => (cancelingBooking = null)} role="presentation"></div>
	<div class="cancel-modal glass glow-danger" role="dialog" aria-modal="true" aria-labelledby="cancel-modal-title">
		<div class="modal-header">
			<div class="modal-title-group">
				<div class="warning-icon-wrapper">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
					</svg>
				</div>
				<div>
					<h3 id="cancel-modal-title">Confirm Cancellation</h3>
					<span class="modal-subtitle">{cancelingBooking.template?.trip_type || 'Charter Reservation'}</span>
				</div>
			</div>
			<button type="button" class="close-modal-btn" onclick={() => (cancelingBooking = null)} aria-label="Close modal">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<div class="modal-body">
			<p class="modal-text">Are you sure you want to cancel your charter reservation for <strong>{formatDate(cancelingBooking.trip?.date)}</strong>?</p>
			
			<div class="refund-notice-card" class:refundable={cancelingBooking.booking.status !== 'reconfirmed'} class:non-refundable={cancelingBooking.booking.status === 'reconfirmed'}>
				{#if cancelingBooking.booking.status !== 'reconfirmed'}
					<div class="notice-badge badge-success">✓ Eligible for Refund</div>
					<p>Since you have <strong>not reconfirmed</strong> your trip slot yet, your <strong>$50.00 reservation deposit will be fully refunded</strong> to your original payment method.</p>
				{:else}
					<div class="notice-badge badge-danger">⚠️ Non-Refundable</div>
					<p>Since you have <strong>already reconfirmed</strong> this trip slot, your <strong>$50.00 reservation deposit is non-refundable</strong> per our cancellation policy.</p>
				{/if}
			</div>

			<div class="faq-link-row">
				<a href="/how-it-works#cancellation-policy" target="_blank" class="faq-policy-link modal-faq-link">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
						<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
					</svg>
					Read our full Cancellation & Refund Policy in FAQ
				</a>
			</div>
		</div>

		<div class="modal-actions">
			<button type="button" class="btn btn-secondary" onclick={() => (cancelingBooking = null)} disabled={cancellingInProgress}>
				Keep My Booking
			</button>
			<form
				method="POST"
				action="?/cancelBooking"
				use:enhance={() => {
					cancellingInProgress = true;
					return async ({ update }) => {
						await update();
						cancellingInProgress = false;
						cancelingBooking = null;
					};
				}}
				style="display: inline;"
			>
				<input type="hidden" name="bookingId" value={cancelingBooking.booking.id} />
				<button type="submit" class="btn btn-danger" disabled={cancellingInProgress}>
					{cancellingInProgress ? 'Canceling...' : 'Yes, Confirm Cancellation'}
				</button>
			</form>
		</div>
	</div>
{/if}

<style>
	.dashboard-wrapper {
		min-height: 100vh;
		position: relative;
		overflow: hidden;
		background: #060913;
		padding: 4rem 2rem;
	}

	.bg-blur {
		position: absolute;
		border-radius: 50%;
		filter: blur(150px);
		z-index: 1;
		pointer-events: none;
		opacity: 0.12;
	}
	.bg-blur-1 {
		background: var(--primary);
		width: 500px;
		height: 500px;
		top: -10%;
		right: 15%;
	}
	.bg-blur-2 {
		background: var(--secondary);
		width: 500px;
		height: 500px;
		bottom: -10%;
		left: 15%;
	}

	.dashboard-container {
		max-width: 1000px;
		margin: 0 auto;
		width: 100%;
		z-index: 2;
		position: relative;
	}

	.dashboard-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		margin-bottom: 3rem;
		gap: 2rem;
	}
	.logo-badge {
		font-size: 0.8rem;
		padding: 4px 10px;
		border-radius: 4px;
		background: rgba(6, 182, 212, 0.15);
		color: var(--primary);
		border: 1px solid rgba(6, 182, 212, 0.25);
		font-weight: 600;
		display: inline-block;
		margin-bottom: 0.5rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	.dashboard-header h1 {
		font-size: 2.5rem;
		font-weight: 800;
		letter-spacing: -0.7px;
	}
	.subtitle {
		font-size: 1.05rem;
		color: var(--text-secondary);
		margin-top: 0.25rem;
	}
	.header-actions {
		display: flex;
		gap: 1rem;
		flex-shrink: 0;
	}
	.btn {
		text-decoration: none;
		font-size: 0.95rem;
	}

	/* Profile Card */
	.profile-card {
		display: flex;
		align-items: center;
		gap: 2rem;
		padding: 1.5rem 2rem;
		margin-bottom: 3rem;
		border: 1px solid var(--border-light);
	}
	.profile-avatar {
		width: 60px;
		height: 60px;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--primary), var(--secondary));
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.75rem;
		font-weight: 800;
		color: white;
		border: 2px solid rgba(255, 255, 255, 0.1);
	}
	.profile-info {
		display: flex;
		gap: 3rem;
		flex-wrap: wrap;
	}
	.info-group {
		display: flex;
		flex-direction: column;
	}
	.info-group .label {
		font-size: 0.75rem;
		color: var(--text-muted);
		text-transform: uppercase;
		font-weight: 600;
		letter-spacing: 0.5px;
		margin-bottom: 4px;
	}
	.info-group .value {
		font-size: 1rem;
		font-weight: 500;
		color: var(--text-primary);
	}
	.active-indicator {
		color: var(--success);
		font-weight: 600;
	}
	.flagged-indicator {
		color: var(--danger);
		font-weight: 600;
	}
	.strikes-indicator {
		color: var(--accent);
		font-weight: 600;
	}

	/* Bookings Section */
	.bookings-section h2 {
		font-size: 1.75rem;
		font-weight: 800;
		letter-spacing: -0.4px;
		margin-bottom: 1.5rem;
	}
	.bookings-list {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}
	.booking-card {
		border: 1px solid var(--border-light);
		padding: 2rem;
	}
	.booking-card-header {
		display: flex;
		justify-content: space-between;
		gap: 2rem;
		border-bottom: 1px solid var(--border-light);
		padding-bottom: 1.5rem;
	}
	.trip-meta {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.trip-date {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--primary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: 4px;
	}
	.trip-meta h3 {
		font-size: 1.4rem;
		font-weight: 700;
		margin-bottom: 4px;
	}
	.trip-loc {
		font-size: 0.9rem;
		color: var(--text-secondary);
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
	}
	.status-meta {
		display: flex;
		gap: 2rem;
		text-align: right;
		flex-shrink: 0;
	}
	.status-group {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}
	.status-lbl {
		font-size: 0.75rem;
		color: var(--text-muted);
		text-transform: uppercase;
		font-weight: 600;
		margin-bottom: 6px;
	}

	/* Status Badge Styling */
	.status-badge {
		font-size: 0.8rem;
		padding: 4px 12px;
		border-radius: 6px;
		font-weight: 600;
		text-transform: capitalize;
		display: inline-block;
	}
	.booking-paid { background: rgba(16, 185, 129, 0.1); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.2); }
	.booking-pending-payment { background: rgba(245, 158, 11, 0.1); color: var(--accent); border: 1px solid rgba(245, 158, 11, 0.2); }
	.booking-awaiting-reconfirm { background: rgba(99, 102, 241, 0.1); color: var(--secondary); border: 1px solid rgba(99, 102, 241, 0.2); }
	.booking-reconfirmed { background: rgba(6, 182, 212, 0.1); color: var(--primary); border: 1px solid rgba(6, 182, 212, 0.2); }
	.booking-held { background: rgba(239, 68, 68, 0.1); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.2); }
	.booking-canceled, .booking-forfeited { background: rgba(255, 255, 255, 0.05); color: var(--text-muted); border: 1px solid var(--border-light); }

	.trip-open { background: rgba(245, 158, 11, 0.1); color: var(--accent); border: 1px solid rgba(245, 158, 11, 0.2); }
	.trip-half-booked { background: rgba(6, 182, 212, 0.1); color: var(--primary); border: 1px solid rgba(6, 182, 212, 0.2); }
	.trip-pending-reconfirm { background: rgba(99, 102, 241, 0.1); color: var(--secondary); border: 1px solid rgba(99, 102, 241, 0.2); }
	.trip-confirmed { background: rgba(16, 185, 129, 0.1); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.2); }

	.booking-card-body {
		padding-top: 1.5rem;
	}
	.detail-row {
		display: flex;
		gap: 3rem;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
	}
	.detail-item {
		display: flex;
		flex-direction: column;
	}
	.detail-item .lbl {
		font-size: 0.75rem;
		color: var(--text-muted);
		text-transform: uppercase;
		font-weight: 600;
		margin-bottom: 4px;
	}
	.detail-item .val {
		font-size: 0.95rem;
		font-weight: 500;
	}
	.price-val {
		font-family: var(--font-heading);
		font-weight: 700;
		color: var(--primary);
	}
	.ref-val {
		color: var(--text-muted);
		font-family: monospace;
		font-size: 0.8rem;
		word-break: break-all;
	}

	/* Alerts inside cards */
	.info-alert {
		padding: 1rem 1.25rem;
		border-radius: 8px;
		font-size: 0.85rem;
		line-height: 1.5;
		display: flex;
		align-items: flex-start;
		gap: 12px;
	}
	.info-primary { border: 1px solid rgba(6, 182, 212, 0.2); background: rgba(6, 182, 212, 0.03); color: #a5f3fc; }
	.info-warning { border: 1px solid rgba(245, 158, 11, 0.2); background: rgba(245, 158, 11, 0.03); color: #fde68a; }
	.info-success { border: 1px solid rgba(16, 185, 129, 0.2); background: rgba(16, 185, 129, 0.03); color: #a7f3d0; }
	.info-danger { border: 1px solid rgba(239, 68, 68, 0.2); background: rgba(239, 68, 68, 0.03); color: #fca5a5; }

	.pulse-dot {
		width: 8px;
		height: 8px;
		background-color: var(--primary);
		border-radius: 50%;
		display: inline-block;
		box-shadow: 0 0 10px var(--primary);
		margin-top: 6px;
		flex-shrink: 0;
	}
	.action-alert {
		flex-direction: column;
		gap: 12px;
		align-items: stretch;
	}
	.btn-small {
		padding: 6px 12px;
		font-size: 0.8rem;
		align-self: flex-start;
	}

	.booking-card-footer {
		margin-top: 1.5rem;
		padding-top: 1.25rem;
		border-top: 1px solid var(--border-light);
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
	}
	.btn-question {
		font-size: 0.85rem;
		padding: 8px 16px;
		color: var(--text-secondary);
		border: 1px solid var(--border-light);
		background: rgba(255, 255, 255, 0.02);
		transition: all 0.2s ease;
	}
	.btn-question:hover {
		color: var(--text-primary);
		border-color: var(--primary);
		background: rgba(6, 182, 212, 0.08);
	}

	.cancel-action-group {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	.btn-danger-outline {
		background: rgba(239, 68, 68, 0.05);
		border: 1px solid rgba(239, 68, 68, 0.25);
		color: var(--danger);
		font-size: 0.85rem;
		padding: 8px 16px;
		border-radius: 6px;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}
	.btn-danger-outline:hover {
		background: rgba(239, 68, 68, 0.18);
		border-color: var(--danger);
	}
	.faq-policy-link {
		color: var(--text-muted);
		font-size: 0.8rem;
		text-decoration: underline;
		transition: color 0.2s ease;
		display: inline-flex;
		align-items: center;
		gap: 4px;
	}
	.faq-policy-link:hover {
		color: var(--primary);
	}

	/* Modal Backdrop & Dialog */
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(0, 0, 0, 0.75);
		backdrop-filter: blur(6px);
		z-index: 300;
	}
	.cancel-modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 520px;
		max-width: 92vw;
		background: #0a0f1d;
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: 12px;
		padding: 1.75rem;
		z-index: 310;
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}
	.modal-title-group {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.warning-icon-wrapper {
		width: 42px;
		height: 42px;
		border-radius: 50%;
		background: rgba(239, 68, 68, 0.15);
		border: 1px solid rgba(239, 68, 68, 0.3);
		color: var(--danger);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	.modal-header h3 {
		font-size: 1.25rem;
		font-weight: 700;
		margin: 0;
	}
	.modal-subtitle {
		font-size: 0.8rem;
		color: var(--text-muted);
	}
	.close-modal-btn {
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		padding: 4px;
	}
	.close-modal-btn:hover {
		color: var(--text-primary);
	}

	.modal-body {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.modal-text {
		font-size: 0.95rem;
		color: var(--text-secondary);
		line-height: 1.5;
		margin: 0;
	}
	.refund-notice-card {
		padding: 1rem;
		border-radius: 8px;
		font-size: 0.85rem;
		line-height: 1.5;
	}
	.refund-notice-card.refundable {
		background: rgba(16, 185, 129, 0.08);
		border: 1px solid rgba(16, 185, 129, 0.3);
		color: #a7f3d0;
	}
	.refund-notice-card.non-refundable {
		background: rgba(239, 68, 68, 0.08);
		border: 1px solid rgba(239, 68, 68, 0.3);
		color: #fca5a5;
	}
	.notice-badge {
		display: inline-block;
		font-weight: 700;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: 6px;
	}
	.badge-success { color: #34d399; }
	.badge-danger { color: #f87171; }

	.faq-link-row {
		margin-top: 4px;
	}
	.modal-faq-link {
		font-size: 0.85rem;
		color: var(--primary);
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		margin-top: 0.5rem;
	}

	.empty-state {
		padding: 4rem 2rem;
		text-align: center;
		border: 1px solid var(--border-light);
	}
	.empty-icon {
		color: var(--text-muted);
		margin-bottom: 1rem;
		display: inline-block;
	}
	.empty-state h3 {
		font-size: 1.25rem;
		margin-bottom: 0.5rem;
	}
	.empty-state p {
		color: var(--text-secondary);
		max-width: 400px;
		margin: 0 auto;
		line-height: 1.5;
	}
	.mt-4 {
		margin-top: 1rem;
	}

	@media (max-width: 768px) {
		.dashboard-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1.5rem;
		}
		.header-actions {
			display: flex;
			gap: 1rem;
			width: 100%;
			flex-wrap: wrap;
		}
		.header-actions .btn {
			flex: 1;
			min-width: 130px;
			text-align: center;
		}
		.profile-card {
			flex-direction: column;
			align-items: flex-start;
			padding: 1.5rem;
			gap: 1rem;
		}
		.profile-info {
			gap: 1.5rem;
		}
		.booking-card-header {
			flex-direction: column;
			gap: 1.25rem;
		}
		.status-meta {
			text-align: left;
			justify-content: flex-start;
			gap: 1.5rem;
		}
		.status-group {
			align-items: flex-start;
		}
		.detail-row {
			gap: 1.5rem;
		}
	}
</style>
