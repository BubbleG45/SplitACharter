<script lang="ts">
	import { enhance } from '$app/forms';
	let { data } = $props();
</script>

<svelte:head>
	<title>Admin Dashboard — SplitACharter</title>
</svelte:head>

<div class="dashboard-header">
	<div>
		<span class="subtitle">SplitACharter Operations</span>
		<h1>Dashboard</h1>
	</div>
	<div class="date-badge glass">
		<span class="dot"></span>
		System Active
	</div>
</div>

<!-- Stats Grid -->
<div class="stats-grid">
	<div class="stat-card glass glass-interactive">
		<div class="icon-wrapper primary-glow">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
				<path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
			</svg>
		</div>
		<div class="stat-content">
			<span class="stat-label">Listing Templates</span>
			<span class="stat-val">{data.stats.listingsCount}</span>
		</div>
		<a href="/admin/listings" class="card-link" aria-label="View Listing Templates"></a>
	</div>

	<div class="stat-card glass glass-interactive">
		<div class="icon-wrapper secondary-glow">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
				<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124l-.09-1.443m-1.443-4.5a2.25 2.25 0 00-2.25-2.25H4.833t-2.25 2.25m13.5 0H4.833M15 9.75a2.25 2.25 0 00-2.25-2.25H4.833" />
			</svg>
		</div>
		<div class="stat-content">
			<span class="stat-label">Trip Instances</span>
			<span class="stat-val">{data.stats.tripsCount}</span>
		</div>
		<a href="/admin/trips" class="card-link" aria-label="View Trip Instances"></a>
	</div>

	<div class="stat-card glass glass-interactive">
		<div class="icon-wrapper success-glow">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.214.139a3.407 3.407 0 003.572 0l.214-.139a3.408 3.408 0 013.572 0l.214.139a3.407 3.407 0 003.572 0l.214-.139a3.408 3.408 0 013.572 0" />
			</svg>
		</div>
		<div class="stat-content">
			<span class="stat-label">Total Bookings</span>
			<span class="stat-val">{data.stats.bookingsCount}</span>
		</div>
		<a href="/admin/bookings" class="card-link" aria-label="View Bookings"></a>
	</div>

	<div class="stat-card glass glass-interactive">
		<div class="icon-wrapper accent-glow">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
			</svg>
		</div>
		<div class="stat-content">
			<span class="stat-label">Captains</span>
			<span class="stat-val">{data.stats.captainsCount}</span>
		</div>
		<a href="/admin/captains" class="card-link" aria-label="View Captains"></a>
	</div>
</div>

<!-- Welcome Panel -->
<div class="welcome-panel glass glow-primary" style="margin-bottom: 2.5rem;">
	<div class="welcome-content">
		<h2>Welcome to SplitACharter Management</h2>
		<p>Manage listing templates, oversee matching status, assign captains, and monitor payments. Connect a remote Supabase project and run migrations to enable real-time operational data tracking.</p>
		<div class="action-buttons">
			<a href="/admin/listings/new" class="btn btn-primary">Create Listing Template</a>
			<a href="/admin/listings" class="btn btn-secondary">Manage Listings</a>
		</div>
	</div>
	<div class="decoration">
		<div class="circle circle-1"></div>
		<div class="circle circle-2"></div>
	</div>
</div>

<!-- Operations Rows -->
<div class="operations-grid">
	<!-- Recent Activity -->
	<div class="ops-card glass">
		<div class="card-header">
			<h2>Recent Activity</h2>
		</div>
		<div class="card-body">
			{#if data.recentBookings.length === 0}
				<p class="empty-state">No recent bookings recorded.</p>
			{:else}
				<div class="activity-list">
					{#each data.recentBookings as booking (booking.id)}
						{@const customer = (Array.isArray(booking.customers) ? booking.customers[0] : booking.customers) as any}
						{@const trip = (Array.isArray(booking.trip_instances) ? booking.trip_instances[0] : booking.trip_instances) as any}
						{@const template = trip ? ((Array.isArray(trip.listing_templates) ? trip.listing_templates[0] : trip.listing_templates) as any) : null}

						<div class="activity-item">
							<div class="meta">
								<span class="name">{customer?.name || 'Customer'}</span>
								<span class="time">{new Date(booking.created_at).toLocaleDateString()}</span>
							</div>
							<div class="desc">
								Booked <strong>{booking.group_size} Pax</strong> on 
								{template?.trip_type || 'Unknown'} ({trip?.date})
							</div>
							<div class="badge status-badge booking-{booking.status}">{booking.status}</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Weather Review Queue -->
	<div class="ops-card glass">
		<div class="card-header">
			<h2>Weather Watch (Next 7 Days)</h2>
		</div>
		<div class="card-body">
			{#if data.upcomingTrips.length === 0}
				<p class="empty-state">No active trips scheduled in the next 7 days.</p>
			{:else}
				<div class="weather-list">
					{#each data.upcomingTrips as trip (trip.id)}
						{@const template = (Array.isArray(trip.listing_templates) ? trip.listing_templates[0] : trip.listing_templates) as any}
						<div class="weather-item">
							<div class="info">
								<span class="date">{new Date(trip.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
								<span class="details">{template?.trip_type} — {template?.location}</span>
								<span class="badge status-badge trip-{trip.status}">{trip.status}</span>
							</div>
							
							<form 
								method="POST" 
								action="?/weatherCancel" 
								use:enhance
								class="inline-form"
							>
								<input type="hidden" name="tripId" value={trip.id} />
								<button 
									type="submit" 
									class="btn btn-danger btn-xs"
									onclick={() => !confirm(`Cancel trip on ${trip.date} for weather safety? This will fully refund all passengers.`)}
								>
									Weather Cancel
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
	.dashboard-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 2.5rem;
	}
	.subtitle {
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 1.5px;
		color: var(--primary);
		font-weight: 700;
	}
	.dashboard-header h1 {
		font-size: 2.5rem;
		font-weight: 800;
		letter-spacing: -0.5px;
		margin-top: 0.25rem;
	}
	.date-badge {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 16px;
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--text-secondary);
	}
	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background-color: var(--success);
		box-shadow: 0 0 10px var(--success);
		display: inline-block;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2.5rem;
	}
	.stat-card {
		padding: 1.5rem;
		display: flex;
		align-items: center;
		gap: 1.25rem;
		position: relative;
	}
	.card-link {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 5;
	}
	.icon-wrapper {
		width: 50px;
		height: 50px;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.primary-glow {
		background: rgba(6, 182, 212, 0.1);
		color: var(--primary);
		border: 1px solid rgba(6, 182, 212, 0.2);
	}
	.secondary-glow {
		background: rgba(99, 102, 241, 0.1);
		color: var(--secondary);
		border: 1px solid rgba(99, 102, 241, 0.2);
	}
	.success-glow {
		background: rgba(16, 185, 129, 0.1);
		color: var(--success);
		border: 1px solid rgba(16, 185, 129, 0.2);
	}
	.accent-glow {
		background: rgba(245, 158, 11, 0.1);
		color: var(--accent);
		border: 1px solid rgba(245, 158, 11, 0.2);
	}
	.stat-content {
		display: flex;
		flex-direction: column;
	}
	.stat-label {
		font-size: 0.85rem;
		color: var(--text-secondary);
		font-weight: 500;
	}
	.stat-val {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--text-primary);
		line-height: 1.2;
		font-family: var(--font-heading);
	}

	.welcome-panel {
		padding: 3rem;
		position: relative;
		overflow: hidden;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.welcome-content {
		max-width: 60%;
		z-index: 2;
	}
	.welcome-content h2 {
		font-size: 1.75rem;
		font-weight: 700;
		margin-bottom: 1rem;
		letter-spacing: -0.3px;
	}
	.welcome-content p {
		color: var(--text-secondary);
		line-height: 1.6;
		margin-bottom: 1.75rem;
	}
	.action-buttons {
		display: flex;
		gap: 1rem;
	}
	.btn {
		text-decoration: none;
		font-size: 0.95rem;
	}

	.decoration {
		position: absolute;
		right: 0;
		top: 0;
		bottom: 0;
		width: 40%;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
	}
	.circle {
		position: absolute;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--primary), var(--secondary));
		opacity: 0.15;
		filter: blur(20px);
	}
	.circle-1 {
		width: 150px;
		height: 150px;
		right: 10%;
		top: 10%;
	}
	.circle-2 {
		width: 200px;
		height: 200px;
		right: -5%;
		bottom: -10%;
	}

	.operations-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		margin-bottom: 3rem;
	}
	.ops-card {
		border: 1px solid var(--border-light);
	}
	.ops-card .card-header {
		padding: 1.25rem 2rem;
		border-bottom: 1px solid var(--border-light);
	}
	.ops-card .card-header h2 {
		font-size: 1.15rem;
		font-weight: 700;
		color: var(--text-primary);
	}
	.ops-card .card-body {
		padding: 1.5rem 2rem;
	}

	.activity-list, .weather-list {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	.activity-item {
		display: flex;
		flex-direction: column;
		gap: 6px;
		border-bottom: 1px solid var(--border-light);
		padding-bottom: 1rem;
	}
	.activity-item:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}
	.activity-item .meta {
		display: flex;
		justify-content: space-between;
		font-size: 0.8rem;
		color: var(--text-muted);
	}
	.activity-item .meta .name {
		font-weight: 600;
		color: var(--text-secondary);
	}
	.activity-item .desc {
		font-size: 0.9rem;
		color: var(--text-primary);
	}

	.weather-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--border-light);
	}
	.weather-item:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}
	.weather-item .info {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.weather-item .info .date {
		font-weight: 700;
		color: var(--danger);
		font-size: 0.9rem;
	}
	.weather-item .info .details {
		font-size: 0.85rem;
		color: var(--text-secondary);
	}

	.badge {
		font-size: 0.75rem;
		padding: 2px 8px;
		border-radius: 4px;
		font-weight: 600;
		display: inline-block;
		width: fit-content;
		text-transform: capitalize;
	}
	.status-badge.booking-paid { background: rgba(16, 185, 129, 0.1); color: var(--success); }
	.status-badge.booking-awaiting-reconfirm { background: rgba(99, 102, 241, 0.1); color: var(--secondary); }
	.status-badge.booking-reconfirmed { background: rgba(6, 182, 212, 0.1); color: var(--primary); }
	.status-badge.booking-held { background: rgba(239, 68, 68, 0.1); color: var(--danger); }
	.status-badge.booking-canceled, .status-badge.booking-forfeited { background: rgba(255, 255, 255, 0.05); color: var(--text-muted); }

	.status-badge.trip-half-booked { background: rgba(6, 182, 212, 0.1); color: var(--primary); }
	.status-badge.trip-pending-reconfirm { background: rgba(99, 102, 241, 0.1); color: var(--secondary); }
	.status-badge.trip-confirmed { background: rgba(16, 185, 129, 0.1); color: var(--success); }

	.btn-danger {
		background: rgba(239, 68, 68, 0.1);
		color: var(--danger);
		border: 1px solid rgba(239, 68, 68, 0.2);
	}
	.btn-danger:hover {
		background: rgba(239, 68, 68, 0.2);
	}
	.btn-xs {
		padding: 4px 8px;
		font-size: 0.75rem;
	}
	.inline-form {
		display: inline-block;
	}
	.empty-state {
		color: var(--text-muted);
		font-style: italic;
		font-size: 0.85rem;
		text-align: center;
		padding: 1rem 0;
	}

	@media (max-width: 768px) {
		.operations-grid {
			grid-template-columns: 1fr;
		}
		.welcome-panel {
			padding: 2rem;
			flex-direction: column;
		}
		.welcome-content {
			max-width: 100%;
		}
		.decoration {
			display: none;
		}
	}
</style>
