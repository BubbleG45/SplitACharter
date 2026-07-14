<script lang="ts">
	import { enhance } from '$app/forms';

	let { data } = $props();

	function formatDate(dateStr: string) {
		const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
		return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', options);
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
					<span class="value">{data.profile?.phone || 'Not provided'}</span>
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
									<span class="trip-date">{formatDate(trip.date)}</span>
									<h3>{template.trip_type}</h3>
									<span class="trip-loc">{template.location} — {template.meeting_area}</span>
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
										<span class="status-badge trip-{trip.status}">
											{#if trip.status === 'open'}
												0 of 2 Booked
											{:else if trip.status === 'half-booked'}
												1 of 2 Booked (Half-Booked)
											{:else if trip.status === 'pending-reconfirm'}
												2 of 2 Booked (Pending Reconfirmation)
											{:else}
												{trip.status}
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
										<span class="val ref-val">{booking.id.substring(0, 8)}...</span>
									</div>
								</div>

								<!-- Action/Helper Info boxes based on status -->
								{#if booking.status === 'paid' && trip.status === 'half-booked'}
									<div class="info-alert info-primary glass">
										<span class="pulse-dot"></span>
										<p><strong>Waiting for a second group to join.</strong> Once another group books this date, both groups will receive a text and email request to reconfirm. If no group joins by the trip date, your deposit is automatically refunded.</p>
									</div>
								{:else if booking.status === 'paid' && trip.status === 'pending-reconfirm'}
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
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</section>
	</div>
</div>

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
