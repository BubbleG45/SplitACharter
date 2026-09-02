<script lang="ts">
</script>

<footer class="site-footer">
	<div class="footer-container">
		<div class="footer-grid">
			<div class="footer-brand">
				<a href="/" class="brand-logo">
					<span class="logo-accent">Split</span>ACharter
				</a>
				<p class="brand-tagline">
					Split the cost of private boat charters. Connect with another small group and share unforgettable fishing, diving, and sunset charters.
				</p>
			</div>

			<div class="footer-nav-col">
				<h3>Platform</h3>
				<ul>
					<li><a href="/">Home</a></li>
					<li><a href="/browse">Browse Charters</a></li>
					<li><a href="/how-it-works">How It Works</a></li>
					<li><a href="/dashboard">Customer Portal</a></li>
				</ul>
			</div>

			<div class="footer-nav-col">
				<h3>Legal & Policies</h3>
				<ul>
					<li><a href="/terms">Terms & Conditions</a></li>
					<li><a href="/privacy">Privacy Policy</a></li>
					<li><a href="/sms-opt-in">SMS Program &amp; Opt-In</a></li>
					<li><a href="/how-it-works#cancellation-policy">Cancellation & Refund Policy</a></li>
				</ul>
			</div>

			<div class="footer-nav-col">
				<h3>Support</h3>
				<p class="support-info">
					Have questions about a trip or matching? Reach out to our support team:
				</p>
				<a href="mailto:info@splitacharter.boats" class="support-email-link">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
						<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
					</svg>
					info@splitacharter.boats
				</a>
			</div>
		</div>

		<div class="footer-bottom">
			<p>&copy; {new Date().getFullYear()} SplitACharter. All rights reserved.</p>
			<div class="footer-bottom-links">
				<a href="/terms">Terms</a>
				<span class="dot">&bull;</span>
				<a href="/privacy">Privacy</a>
			</div>
		</div>
	</div>
</footer>

<style>
	.site-footer {
		background: var(--bg-surface);
		border-top: 1px solid var(--border-light);
		color: var(--text-primary);
		padding: 4rem 2rem 2rem 2rem;
		position: relative;
		z-index: 10;
	}

	.footer-container {
		max-width: 1200px;
		margin: 0 auto;
	}

	.footer-grid {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr 1.5fr;
		gap: 3rem;
		margin-bottom: 3.5rem;
	}

	.brand-logo {
		font-family: var(--font-heading);
		font-size: 1.5rem;
		font-weight: 800;
		text-decoration: none;
		color: var(--text-primary);
		display: inline-block;
		margin-bottom: 1rem;
	}
	.logo-accent {
		color: var(--primary);
	}
	.brand-tagline {
		color: var(--text-secondary);
		font-size: 0.9rem;
		line-height: 1.6;
		max-width: 340px;
	}

	.footer-nav-col h3 {
		font-size: 0.95rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--text-primary);
		margin-bottom: 1.25rem;
	}
	.footer-nav-col ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.footer-nav-col a {
		color: var(--text-secondary);
		text-decoration: none;
		font-size: 0.9rem;
		transition: color 0.2s ease;
	}
	.footer-nav-col a:hover {
		color: var(--primary);
	}

	.support-info {
		color: var(--text-secondary);
		font-size: 0.88rem;
		line-height: 1.5;
		margin-bottom: 1rem;
	}
	.support-email-link {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		color: var(--primary);
		text-decoration: none;
		font-weight: 600;
		font-size: 0.9rem;
		padding: 8px 12px;
		background: rgba(6, 182, 212, 0.08);
		border: 1px solid rgba(6, 182, 212, 0.2);
		border-radius: 6px;
		transition: all 0.2s ease;
	}
	.support-email-link:hover {
		background: rgba(6, 182, 212, 0.16);
		border-color: var(--primary);
	}

	.footer-bottom {
		border-top: 1px solid var(--border-light);
		padding-top: 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.85rem;
		color: var(--text-muted);
	}
	.footer-bottom-links {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.footer-bottom-links a {
		color: var(--text-muted);
		text-decoration: none;
		transition: color 0.2s ease;
	}
	.footer-bottom-links a:hover {
		color: var(--text-primary);
	}
	.dot {
		color: var(--border-light);
	}

	@media (max-width: 900px) {
		.footer-grid {
			grid-template-columns: 1fr 1fr;
			gap: 2rem;
		}
		.footer-brand {
			grid-column: 1 / -1;
		}
	}
	@media (max-width: 600px) {
		.footer-grid {
			grid-template-columns: 1fr;
		}
		.footer-bottom {
			flex-direction: column;
			gap: 1rem;
			text-align: center;
		}
	}
</style>
