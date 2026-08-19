<script lang="ts">
	let { data } = $props();

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

	const strikeCount = $derived(data.profile?.strike_count ?? 3);
	const isFlagged = $derived(data.profile?.flagged ?? false);
</script>

<svelte:head>
	<title>Account Locked — SplitACharter</title>
	<meta name="description" content="Your SplitACharter customer account has been locked due to strike policy limits." />
</svelte:head>

<div class="locked-wrapper">
	<div class="bg-blur bg-blur-1"></div>
	<div class="bg-blur bg-blur-2"></div>

	<div class="locked-container">
		<div class="locked-card glass">
			<div class="icon-badge">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="lock-icon">
					<path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
				</svg>
			</div>

			<span class="status-pill">Account Suspended</span>
			<h1>Account Access Restricted</h1>
			<p class="summary-text">
				Your SplitACharter account has reached the maximum strike threshold and is currently restricted from booking new shared boat charters.
			</p>

			{#if data.isLoggedIn && data.profile}
				<div class="status-details glass">
					<div class="detail-row">
						<span class="detail-label">Account Name</span>
						<span class="detail-val">{data.profile.name || 'Customer'}</span>
					</div>
					<div class="detail-row">
						<span class="detail-label">Email Address</span>
						<span class="detail-val">{data.profile.email || 'None on file'}</span>
					</div>
					{#if data.profile.phone}
						<div class="detail-row">
							<span class="detail-label">Phone Number</span>
							<span class="detail-val">{formatPhoneNumber(data.profile.phone)}</span>
						</div>
					{/if}
					<div class="detail-row highlight-row">
						<span class="detail-label">Current Status</span>
						<span class="detail-val status-strike-badge">
							{#if isFlagged && strikeCount < 3}
								Account Flagged / Suspended
							{:else}
								{strikeCount} / 3 Strikes (Limit Reached)
							{/if}
						</span>
					</div>
				</div>
			{/if}

			<div class="explanation-box glass">
				<h3>
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="info-icon">
						<path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
					</svg>
					Why is my account locked?
				</h3>
				<p>
					SplitACharter pairs small independent groups to share private boat charters. To guarantee reliability for our captains and partner groups, customers must reconfirm attendance within their specified confirmation window when a match is found.
				</p>
				<p>
					A strike is automatically recorded when a customer fails to complete reconfirmation or misses a scheduled trip. Once an account accumulates <strong>3 strikes</strong>, booking capabilities are paused to prevent unexpected vacancies and protect fellow charter splitters.
				</p>
			</div>

			<div class="support-box glass">
				<div class="support-content">
					<h4>Need Help or Wish to Appeal?</h4>
					<p>
						If you believe a strike was issued in error (for example, due to cell network outages during a reconfirmation window, severe weather, or duplicate profile linking), our support team is available to review your account history.
					</p>
					<a
						href="mailto:support@splitacharter.boats?subject=Account%20Suspension%20Review%20Request%20-%20{encodeURIComponent(data.profile?.email || '')}&body=Hello%20SplitACharter%20Support,%0A%0AI%20would%20like%20to%20request%20a%20review%20of%20my%20account%20lock%20status.%0A%0AAccount%20Email:%20{encodeURIComponent(data.profile?.email || '')}%0AAccount%20Name:%20{encodeURIComponent(data.profile?.name || '')}%0A%0ADetails:%0A"
						class="btn btn-primary btn-support"
					>
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="btn-icon">
							<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
						</svg>
						<span>Contact Support at support@splitacharter.boats</span>
					</a>
				</div>
			</div>

			<div class="actions-group">
				<a href="/dashboard" class="btn btn-secondary">
					View Customer Dashboard
				</a>
				<a href="/terms" class="btn btn-outline">
					Review Terms & Cancellation Rules
				</a>
				<a href="/browse" class="btn btn-outline">
					Browse Charters (Read-Only)
				</a>
				{#if data.isLoggedIn}
					<form action="/login?/signOut" method="POST" class="signout-form">
						<button type="submit" class="btn-text">
							Sign Out
						</button>
					</form>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.locked-wrapper {
		min-height: 90vh;
		position: relative;
		overflow: hidden;
		background: var(--bg-base);
		color: var(--text-primary);
		padding: 4rem 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.bg-blur {
		position: absolute;
		border-radius: 50%;
		filter: blur(150px);
		z-index: 1;
		pointer-events: none;
		opacity: 0.14;
	}

	.bg-blur-1 {
		background: var(--danger);
		width: 500px;
		height: 500px;
		top: 5%;
		right: 15%;
	}

	.bg-blur-2 {
		background: var(--primary);
		width: 450px;
		height: 450px;
		bottom: 10%;
		left: 10%;
	}

	.locked-container {
		max-width: 680px;
		width: 100%;
		position: relative;
		z-index: 2;
	}

	.locked-card {
		padding: 3rem 2.5rem;
		border-radius: 20px;
		border: 1px solid var(--border-light);
		box-shadow: var(--glass-shadow);
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.icon-badge {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		background: rgba(239, 68, 68, 0.15);
		border: 1px solid rgba(239, 68, 68, 0.35);
		color: var(--danger);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 1.25rem;
	}

	.lock-icon {
		width: 32px;
		height: 32px;
	}

	.status-pill {
		display: inline-block;
		background: rgba(239, 68, 68, 0.15);
		color: var(--danger);
		border: 1px solid rgba(239, 68, 68, 0.3);
		padding: 0.3rem 0.85rem;
		border-radius: 9999px;
		font-size: 0.78rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 1rem;
	}

	h1 {
		font-size: 2rem;
		font-weight: 700;
		margin-bottom: 0.75rem;
		color: var(--text-primary);
	}

	.summary-text {
		font-size: 1.05rem;
		color: var(--text-secondary);
		line-height: 1.6;
		margin-bottom: 2rem;
		max-width: 540px;
	}

	.status-details {
		width: 100%;
		padding: 1.25rem 1.5rem;
		border-radius: 12px;
		border: 1px solid var(--border-light);
		margin-bottom: 1.75rem;
		text-align: left;
		background: var(--input-bg);
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.55rem 0;
		font-size: 0.92rem;
		border-bottom: 1px solid var(--border-light);
	}

	.detail-row:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.detail-label {
		color: var(--text-secondary);
		font-weight: 500;
	}

	.detail-val {
		color: var(--text-primary);
		font-weight: 600;
	}

	.status-strike-badge {
		background: rgba(239, 68, 68, 0.15);
		color: var(--danger);
		border: 1px solid rgba(239, 68, 68, 0.3);
		padding: 0.2rem 0.6rem;
		border-radius: 6px;
		font-size: 0.82rem;
	}

	.explanation-box {
		width: 100%;
		padding: 1.5rem;
		border-radius: 12px;
		border: 1px solid var(--border-light);
		margin-bottom: 1.75rem;
		text-align: left;
		background: var(--glass-bg);
	}

	.explanation-box h3 {
		font-size: 1.05rem;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
		color: var(--text-primary);
	}

	.info-icon {
		width: 20px;
		height: 20px;
		color: var(--primary);
		flex-shrink: 0;
	}

	.explanation-box p {
		font-size: 0.9rem;
		color: var(--text-secondary);
		line-height: 1.6;
		margin-bottom: 0.75rem;
	}

	.explanation-box p:last-child {
		margin-bottom: 0;
	}

	.support-box {
		width: 100%;
		padding: 1.5rem;
		border-radius: 12px;
		border: 1px solid var(--border-light);
		margin-bottom: 2rem;
		text-align: left;
		background: var(--input-bg);
	}

	.support-content h4 {
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: var(--text-primary);
	}

	.support-content p {
		font-size: 0.88rem;
		color: var(--text-secondary);
		line-height: 1.5;
		margin-bottom: 1.25rem;
	}

	.btn-support {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.6rem;
		width: 100%;
		padding: 0.85rem 1.25rem;
		font-size: 0.95rem;
		font-weight: 600;
		text-decoration: none;
	}

	.btn-icon {
		width: 18px;
		height: 18px;
	}

	.actions-group {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		width: 100%;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.75rem 1.25rem;
		border-radius: 8px;
		font-size: 0.92rem;
		font-weight: 600;
		text-decoration: none;
		transition: all 0.2s ease;
		cursor: pointer;
		border: none;
	}

	.btn-primary {
		background: var(--primary);
		color: #ffffff;
	}

	.btn-primary:hover {
		background: var(--primary-hover);
		transform: translateY(-1px);
	}

	.btn-secondary {
		background: var(--bg-surface-elevated);
		color: var(--text-primary);
		border: 1px solid var(--border-light);
	}

	.btn-secondary:hover {
		background: var(--border-light);
		transform: translateY(-1px);
	}

	.btn-outline {
		background: transparent;
		color: var(--text-secondary);
		border: 1px solid var(--border-light);
	}

	.btn-outline:hover {
		color: var(--text-primary);
		border-color: var(--text-muted);
		background: var(--input-bg);
	}

	.signout-form {
		margin-top: 0.5rem;
	}

	.btn-text {
		background: none;
		border: none;
		color: var(--text-muted);
		font-size: 0.88rem;
		cursor: pointer;
		text-decoration: underline;
		transition: color 0.2s ease;
	}

	.btn-text:hover {
		color: var(--danger);
	}

	@media (max-width: 640px) {
		.locked-card {
			padding: 2rem 1.25rem;
		}

		h1 {
			font-size: 1.6rem;
		}

		.summary-text {
			font-size: 0.95rem;
		}
	}
</style>
