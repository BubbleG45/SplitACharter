<script lang="ts">
</script>

<svelte:head>
	<title>Privacy Policy — SplitACharter</title>
	<meta name="description" content="SplitACharter Privacy Policy outlining how personal information and SMS opt-in details are securely collected, used, and protected." />
</svelte:head>

<div class="legal-wrapper">
	<div class="bg-blur bg-blur-1"></div>
	<div class="bg-blur bg-blur-2"></div>

	<div class="legal-container">
		<header class="legal-header">
			<span class="badge">Privacy Practices</span>
			<h1>Privacy Policy</h1>
			<p class="last-updated">Last Updated: August 1, 2026</p>
		</header>

		<div class="legal-content glass">
			<section class="legal-section">
				<h2>1. Overview</h2>
				<p>
					At <strong>SplitACharter</strong>, protecting your privacy and safeguarding your personal information is fundamental to our platform. This Privacy Policy explains what personal data we collect, how we use it, how we protect it, and your rights regarding your information.
				</p>
			</section>

			<section class="legal-section">
				<h2>2. Information We Collect</h2>
				<p>We collect information necessary to facilitate shared charter bookings, authentication, and notifications:</p>
				<ul>
					<li><strong>Account & Contact Information:</strong> Full name, email address, and mobile phone number provided during passwordless sign-in or reservation checkout.</li>
					<li><strong>Reservation & Booking Details:</strong> Group size, selected dates, trip location preferences, and Scuba certification details (when applicable for diving charters).</li>
					<li><strong>Payment Information:</strong> Payment processing is handled securely by our payment partner, <strong>Stripe</strong>. SplitACharter does not store full credit card numbers or sensitive CVV security codes on our servers.</li>
					<li><strong>Technical & Usage Data:</strong> IP address, device type, browser information, and session tokens managed securely via Supabase Auth (`@supabase/ssr`).</li>
				</ul>
			</section>

			<section class="legal-section">
				<h2>3. How We Use Your Information</h2>
				<p>We strictly use your personal data for operational marketplace functionality:</p>
				<ol>
					<li>Authenticating your account via email magic links and SMS OTP codes.</li>
					<li>Matching your group with a second compatible customer group for your selected charter date.</li>
					<li>Sending automated reconfirmation requests, deadline alerts, and charter match status updates.</li>
					<li>Connecting matched groups with their assigned licensed boat captain.</li>
					<li>Processing reservation deposits and automated refunds.</li>
				</ol>
			</section>

			<section class="legal-section">
				<h2>4. Strict SMS Privacy & Consent Disclosure</h2>
				<div class="highlight-box glass">
					<p>
						<strong>Mobile Phone & SMS Opt-In Privacy Guarantee:</strong>
					</p>
					<p>
						No mobile phone numbers, SMS opt-in consent, or personal information collected via our platform will be shared, sold, rented, or leased to third parties or affiliates for marketing or promotional purposes.
					</p>
				</div>
				<p>
					Transactional SMS messages sent via our provider (Twilio) are strictly limited to booking verifications, OTP login codes, reconfirmation notifications, and captain assignment updates. You may opt out of SMS communications at any time by replying <strong>STOP</strong> to any text message.
				</p>
			</section>

			<section class="legal-section">
				<h2>5. Third-Party Service Providers</h2>
				<p>We share data with trusted infrastructure providers solely as required to operate our service:</p>
				<ul>
					<li><strong>Supabase:</strong> Managed database hosting and secure authentication.</li>
					<li><strong>Stripe:</strong> Payment intent processing and customer payment record management.</li>
					<li><strong>Twilio:</strong> Delivery of transactional SMS notifications and OTP verification codes.</li>
					<li><strong>Resend:</strong> Delivery of transactional email magic links and booking notifications.</li>
					<li><strong>Inngest:</strong> Reliable background processing for reconfirmation timers and workflow scheduling.</li>
				</ul>
			</section>

			<section class="legal-section">
				<h2>6. Data Security & Retention</h2>
				<p>
					We implement industry-standard encryption protocols (TLS/HTTPS in transit and AES-256 at rest) to protect your personal information. We retain personal data only as long as necessary to maintain active account records, support booking histories, and comply with tax and legal requirements.
				</p>
			</section>

			<section class="legal-section">
				<h2>7. Your Rights & Data Requests</h2>
				<p>You have the right to access, update, or request the deletion of your personal profile data at any time. You can update your name directly on your customer dashboard or contact us to delete your account record.</p>
			</section>

			<section class="legal-section">
				<h2>8. Contact Us</h2>
				<p>
					For privacy-related inquiries, data requests, or support, please reach out to us at:
				</p>
				<p class="contact-email">
					Email: <a href="mailto:info@splitacharter.com">info@splitacharter.com</a>
				</p>
			</section>
		</div>
	</div>
</div>

<style>
	.legal-wrapper {
		min-height: 100vh;
		position: relative;
		overflow: hidden;
		background: var(--bg-base);
		color: var(--text-primary);
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

	.legal-container {
		max-width: 860px;
		margin: 0 auto;
		position: relative;
		z-index: 2;
	}

	.legal-header {
		text-align: center;
		margin-bottom: 3rem;
	}
	.badge {
		font-size: 0.8rem;
		padding: 4px 12px;
		border-radius: 4px;
		background: rgba(16, 185, 129, 0.15);
		color: var(--success);
		border: 1px solid rgba(16, 185, 129, 0.25);
		font-weight: 600;
		display: inline-block;
		margin-bottom: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	.legal-header h1 {
		font-size: 2.75rem;
		font-weight: 800;
		letter-spacing: -0.8px;
		margin-bottom: 0.5rem;
	}
	.last-updated {
		font-size: 0.9rem;
		color: var(--text-muted);
	}

	.legal-content {
		border: 1px solid var(--border-light);
		padding: 3rem;
		display: flex;
		flex-direction: column;
		gap: 2.5rem;
		line-height: 1.7;
		font-size: 0.98rem;
	}

	.legal-section h2 {
		font-size: 1.35rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 1rem;
		letter-spacing: -0.3px;
	}
	.legal-section p {
		color: var(--text-secondary);
		margin-bottom: 0.75rem;
	}
	.legal-section ul, .legal-section ol {
		color: var(--text-secondary);
		padding-left: 1.5rem;
		margin-bottom: 0.75rem;
	}
	.legal-section li {
		margin-bottom: 0.5rem;
	}

	.highlight-box {
		padding: 1.25rem 1.5rem;
		border-radius: 8px;
		border: 1px solid rgba(6, 182, 212, 0.3);
		background: rgba(6, 182, 212, 0.06);
		color: var(--text-primary);
		margin: 1rem 0;
	}
	.highlight-box p {
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}
	.highlight-box p:last-child {
		margin-bottom: 0;
	}

	.contact-email a {
		color: var(--primary);
		text-decoration: none;
		font-weight: 600;
	}
	.contact-email a:hover {
		text-decoration: underline;
	}

	@media (max-width: 768px) {
		.legal-wrapper {
			padding: 2rem 1rem;
		}
		.legal-content {
			padding: 1.5rem;
		}
		.legal-header h1 {
			font-size: 2rem;
		}
	}
</style>
