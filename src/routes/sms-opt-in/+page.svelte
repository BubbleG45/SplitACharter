<script lang="ts">
</script>

<svelte:head>
	<title>SMS Program & Opt-In Policy — SplitACharter</title>
	<meta
		name="description"
		content="SplitACharter SMS program disclosures, opt-in procedures, message frequency, terms, and opt-out instructions for 10DLC compliance."
	/>
</svelte:head>

<div class="legal-wrapper">
	<div class="bg-blur bg-blur-1"></div>
	<div class="bg-blur bg-blur-2"></div>

	<div class="legal-container">
		<header class="legal-header">
			<span class="badge">Messaging Compliance</span>
			<h1>SMS Program &amp; Opt-In Policy</h1>
			<p class="last-updated">Last Updated: September 1, 2026</p>
		</header>

		<div class="legal-content glass">
			<section class="legal-section">
				<h2>1. Overview of SplitACharter SMS Program</h2>
				<p>
					SplitACharter (<strong>https://splitacharter.boats</strong>) operates an automated transactional text messaging service. This service delivers essential account verification codes, charter booking confirmations, group matching status alerts, and mandatory trip reconfirmation notifications to customers sharing private boat charters.
				</p>
			</section>

			<section class="legal-section">
				<h2>2. How Customers Opt In</h2>
				<p>Customers can opt in to receive SMS notifications through two primary methods on our platform:</p>
				<ol>
					<li>
						<strong>Customer Sign-In (<a href="/login">/login</a>):</strong> Entering a mobile phone number to request a one-time login verification code (OTP).
					</li>
					<li>
						<strong>Reservation Checkout (<a href="/checkout">/checkout</a>):</strong> Explicitly checking the optional, unchecked-by-default SMS opt-in checkbox when completing a shared charter booking.
					</li>
				</ol>
				<p>
					<em>Note: SMS opt-in is entirely optional and is never a mandatory condition of reserving or purchasing a charter on SplitACharter.</em>
				</p>
			</section>

			<!-- Visual representation of the Opt-in Form -->
			<section class="legal-section">
				<h2>3. Visual Representation &amp; Screenshot of the Opt-In Form</h2>
				<p>Below is an uncropped screenshot of the customer profile and SMS opt-in workflow presented during the reservation checkout process on our website (also hosted directly at <a href="/sms-opt-in-proof.png" target="_blank">/sms-opt-in-proof.png</a>):</p>

				<div class="screenshot-container">
					<img src="/sms-opt-in-proof.png" alt="SplitACharter Uncropped SMS Opt-In Form Screenshot" class="screenshot-img" />
				</div>

				<div class="opt-in-mockup glass glow-primary">
					<div class="mockup-header">
						<span class="mockup-step">1</span>
						<h3>Live Form Preview: Profile Details &amp; Notification Preferences</h3>
					</div>

					<div class="mockup-fields">
						<div class="mockup-field">
							<label for="mock-name">Full Name</label>
							<input type="text" id="mock-name" value="Jane Doe" disabled class="mockup-input" />
						</div>

						<div class="mockup-field">
							<label for="mock-phone">Mobile Phone Number</label>
							<input type="tel" id="mock-phone" value="+1 (555) 234-5678" disabled class="mockup-input" />
							<span class="mockup-helper">SMS updates and reconfirmations are sent here</span>
						</div>

						<div class="mockup-field">
							<label for="mock-email">Email Address</label>
							<input type="email" id="mock-email" value="jane.doe@example.com" disabled class="mockup-input" />
						</div>

						<!-- Checkbox area with verbatim disclosure -->
						<div class="mockup-checkbox-row">
							<input type="checkbox" id="mock-sms-optin" class="mockup-checkbox" />
							<label for="mock-sms-optin" class="mockup-checkbox-label">
								I agree to receive transactional SMS notifications from SplitACharter regarding my booking, group match status, and reconfirmation alerts. Message frequency varies based on booking activity. Message and data rates may apply. Reply <strong>HELP</strong> for help or <strong>STOP</strong> to cancel at any time. Consent is not a condition of booking. View <a href="/terms" target="_blank">Terms &amp; Conditions</a> and <a href="/privacy" target="_blank">Privacy Policy</a>.
							</label>
						</div>
					</div>
				</div>
			</section>

			<section class="legal-section">
				<h2>4. Program Disclosures &amp; Message Specifications</h2>
				<div class="table-wrapper">
					<table>
						<thead>
							<tr>
								<th>Item</th>
								<th>Program Specification</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td><strong>Brand / Organization</strong></td>
								<td>SplitACharter (splitacharter.boats)</td>
							</tr>
							<tr>
								<td><strong>Campaign / Use Case</strong></td>
								<td>Customer Care &amp; Account Security (2FA OTP, reservation receipts, group matching alerts, reconfirmation reminders)</td>
							</tr>
							<tr>
								<td><strong>Message Frequency</strong></td>
								<td>Message frequency varies based on user booking activity (typically 1–4 messages per reservation flow).</td>
							</tr>
							<tr>
								<td><strong>Cost &amp; Rates</strong></td>
								<td>Message and data rates may apply depending on your mobile carrier plan. SplitACharter does not charge extra mobile fees.</td>
							</tr>
							<tr>
								<td><strong>Opt-Out Keywords</strong></td>
								<td>Text <strong>STOP</strong>, <strong>CANCEL</strong>, <strong>UNSUBSCRIBE</strong>, <strong>END</strong>, or <strong>QUIT</strong> to unsubscribe immediately.</td>
							</tr>
							<tr>
								<td><strong>Help &amp; Support Keywords</strong></td>
								<td>Text <strong>HELP</strong> or <strong>INFO</strong> for assistance, or email <a href="mailto:info@splitacharter.boats">info@splitacharter.boats</a>.</td>
							</tr>
							<tr>
								<td><strong>Carrier Liability</strong></td>
								<td>Carriers (including AT&amp;T, T-Mobile, Verizon) are not liable for delayed or undelivered messages.</td>
							</tr>
						</tbody>
					</table>
				</div>
			</section>

			<section class="legal-section">
				<h2>5. Strict Privacy &amp; Data Sharing Guarantee</h2>
				<div class="highlight-box glass">
					<p><strong>Mobile Privacy Guarantee:</strong></p>
					<p>
						<strong>Mobile information and SMS opt-in consent data will not be shared, sold, rented, or leased to third parties or affiliates for marketing or promotional purposes under any circumstances.</strong>
					</p>
					<p>
						All data sharing categories exclude text messaging originator opt-in data and consent.
					</p>
				</div>
				<p>
					For complete details on our data protection practices, please review our full <a href="/privacy">Privacy Policy</a>.
				</p>
			</section>

			<section class="legal-section">
				<h2>6. Contact Us</h2>
				<p>If you have any questions regarding our SMS notification program or need customer support, please contact:</p>
				<p class="contact-email">
					Email: <a href="mailto:info@splitacharter.boats">info@splitacharter.boats</a><br />
					Website: <a href="https://www.splitacharter.boats">https://www.splitacharter.boats</a>
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
		background: rgba(6, 182, 212, 0.15);
		color: var(--primary);
		border: 1px solid rgba(6, 182, 212, 0.25);
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
	.legal-section ul,
	.legal-section ol {
		color: var(--text-secondary);
		padding-left: 1.5rem;
		margin-bottom: 0.75rem;
	}
	.legal-section li {
		margin-bottom: 0.5rem;
	}

	.screenshot-container {
		margin: 1.5rem 0;
		border-radius: 12px;
		overflow: hidden;
		border: 1px solid var(--border-light);
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
	}
	.screenshot-img {
		width: 100%;
		height: auto;
		display: block;
	}

	/* Opt-In Mockup Box */
	.opt-in-mockup {
		border: 1px solid rgba(6, 182, 212, 0.35);
		border-radius: 12px;
		padding: 1.75rem;
		background: var(--bg-surface-elevated, rgba(14, 22, 38, 0.6));
		margin: 1.5rem 0;
	}
	.mockup-header {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 1.25rem;
		border-bottom: 1px solid var(--border-light);
		padding-bottom: 0.75rem;
	}
	.mockup-step {
		width: 26px;
		height: 26px;
		background: var(--primary);
		color: #050b14;
		font-weight: 800;
		font-size: 0.85rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.mockup-header h3 {
		font-size: 1.1rem;
		font-weight: 700;
		margin: 0;
		color: var(--text-primary);
	}
	.mockup-fields {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	.mockup-field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.mockup-field label {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-secondary);
	}
	.mockup-input {
		background: var(--input-bg, rgba(255, 255, 255, 0.04));
		border: 1px solid var(--border-light);
		border-radius: 6px;
		padding: 10px 14px;
		color: var(--text-primary);
		font-size: 0.9rem;
	}
	.mockup-helper {
		font-size: 0.78rem;
		color: var(--text-muted);
	}

	.mockup-checkbox-row {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 12px 14px;
		border-radius: 8px;
		background: rgba(6, 182, 212, 0.06);
		border: 1px solid rgba(6, 182, 212, 0.25);
		margin-top: 0.5rem;
	}
	.mockup-checkbox {
		margin-top: 4px;
		cursor: pointer;
		flex-shrink: 0;
		accent-color: var(--primary);
		width: 18px;
		height: 18px;
	}
	.mockup-checkbox-label {
		font-size: 0.84rem;
		color: var(--text-primary);
		line-height: 1.5;
		margin: 0;
	}
	.mockup-checkbox-label a {
		color: var(--primary);
		text-decoration: underline;
		font-weight: 500;
	}

	/* Tables */
	.table-wrapper {
		overflow-x: auto;
		margin-top: 1rem;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
		text-align: left;
	}
	th {
		background: rgba(255, 255, 255, 0.04);
		padding: 10px 14px;
		color: var(--text-primary);
		border-bottom: 1px solid var(--border-light);
		font-weight: 600;
	}
	td {
		padding: 10px 14px;
		border-bottom: 1px solid var(--border-light);
		color: var(--text-secondary);
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

	.contact-email a,
	.legal-section a {
		color: var(--primary);
		text-decoration: none;
		font-weight: 600;
	}
	.contact-email a:hover,
	.legal-section a:hover {
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
