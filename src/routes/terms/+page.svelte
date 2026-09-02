<script lang="ts">
</script>

<svelte:head>
	<title>Terms & Conditions — SplitACharter</title>
	<meta name="description" content="SplitACharter Terms and Conditions governing reservation deposits, matching, reconfirmation, and charter cancellations." />
</svelte:head>

<div class="legal-wrapper">
	<div class="bg-blur bg-blur-1"></div>
	<div class="bg-blur bg-blur-2"></div>

	<div class="legal-container">
		<header class="legal-header">
			<span class="badge">Legal Agreement</span>
			<h1>Terms & Conditions</h1>
			<p class="last-updated">Last Updated: August 1, 2026</p>
		</header>

		<div class="legal-content glass">
			<section class="legal-section">
				<h2>1. Introduction & Acceptance</h2>
				<p>
					Welcome to <strong>SplitACharter</strong> ("Platform", "we", "us", or "our"). By accessing our website, creating an account, reserving a charter slot, or participating in a shared trip, you agree to be bound by these Terms & Conditions ("Terms"). If you do not agree with any portion of these Terms, you must not use our service.
				</p>
			</section>

			<section class="legal-section">
				<h2>2. Nature of Platform & Fee Structure</h2>
				<p>
					SplitACharter operates as a matching marketplace connecting two independent customer groups seeking to share private boat charters to reduce costs.
				</p>
				<ul>
					<li><strong>Reservation Fee:</strong> SplitACharter charges a non-refundable <strong>$50.00 USD reservation deposit</strong> per customer group upon booking. This fee covers platform matching, notifications, and customer service.</li>
					<li><strong>Captain Charter Payment:</strong> SplitACharter does not collect or process the charter cost itself. The remaining balance for the charter is paid directly by each group to the licensed boat captain on the day of the trip via cash or accepted credit cards.</li>
				</ul>
			</section>

			<section class="legal-section">
				<h2>3. Booking, Matching & State Machine</h2>
				<p>
					Charters on SplitACharter follow a structured trip matching lifecycle:
				</p>
				<ol>
					<li><strong>1-of-2 Group Booked (Half-Booked):</strong> When the first group reserves a date, a trip instance is created. Your deposit is held while waiting for a second group to join.</li>
					<li><strong>2-of-2 Groups Booked (Pending Reconfirmation):</strong> Once a second group books the same date and charter type, a mandatory reconfirmation window is initiated for both groups.</li>
					<li><strong>Reconfirmation Window:</strong> Both groups must explicitly reconfirm attendance via SMS or email link within the designated time window prior to departure.</li>
					<li><strong>Captain Matching:</strong> Once both groups reconfirm, an automated broadcast is sent to eligible licensed captains. The first captain to accept receives the assignment.</li>
				</ol>
			</section>

			<section class="legal-section">
				<h2>4. Reconfirmation & Forfeiture Policy</h2>
				<p>
					Because captains reserve their boats and schedules based on confirmed bookings, strict reconfirmation timelines apply:
				</p>
				<ul>
					<li><strong>Reconfirmed Trips are Non-Refundable:</strong> Once a customer group reconfirms their slot, the $50 reservation fee becomes strictly non-refundable should that group subsequently cancel or fail to appear.</li>
					<li><strong>Failure to Reconfirm:</strong> If a customer fails to reconfirm within the required window, their reservation is forfeited, their $50 deposit is non-refundable, and a strike is issued to their account.</li>
					<li><strong>Counterpart Failure:</strong> If one group reconfirms but the second group fails to reconfirm, the confirming group's $50 deposit is <em>held in credit</em>. The confirming group may transfer their slot to a new trip or request a full manual refund via support.</li>
				</ul>
			</section>

			<section class="legal-section">
				<h2>5. Cancellations & Refunds</h2>
				<div class="table-wrapper">
					<table>
						<thead>
							<tr>
								<th>Scenario</th>
								<th>Deposit Outcome</th>
								<th>Processing</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>Cancel prior to reconfirming trip</td>
								<td>Full $50 Refund</td>
								<td>Automatic to original payment method</td>
							</tr>
							<tr>
								<td>Cancel after reconfirming trip</td>
								<td>Fee Forfeited</td>
								<td>Non-refundable</td>
							</tr>
							<tr>
								<td>No second group found by trip date</td>
								<td>Full $50 Refund</td>
								<td>Automatic to original payment method</td>
							</tr>
							<tr>
								<td>No captain available to accept trip</td>
								<td>Full $50 Refund</td>
								<td>Automatic to original payment method</td>
							</tr>
							<tr>
								<td>Weather Cancellation (Captain call)</td>
								<td>Full $50 Refund</td>
								<td>Processed upon captain notification</td>
							</tr>
						</tbody>
					</table>
				</div>
			</section>

			<section class="legal-section">
				<h2>6. SMS Program Terms &amp; Conditions</h2>
				<p>
					SplitACharter operates an automated transactional SMS notification service to support customer authentication, booking coordination, group matching, and trip reconfirmations.
				</p>
				<ul>
					<li><strong>Program Description &amp; Use Cases:</strong> When you provide your mobile phone number during sign-in (<a href="/login">/login</a>) or reservation checkout (<a href="/checkout">/checkout</a>) and opt in, you may receive SMS messages including:
						<ul>
							<li>One-time password (OTP) verification security codes</li>
							<li>Booking reservation receipts and deposit notifications</li>
							<li>Charter group match status alerts</li>
							<li>Mandatory trip reconfirmation reminders and window deadlines</li>
							<li>Assigned licensed captain contact and meeting information</li>
						</ul>
					</li>
					<li><strong>Opt-In Process:</strong> Customers opt in by entering their mobile phone number on our public website (<a href="/login">https://splitacharter.boats/login</a>) or by selecting the explicit, unchecked-by-default SMS opt-in checkbox during checkout (<a href="/checkout">https://splitacharter.boats/checkout</a>). You can review our full public opt-in workflow and disclosures at <a href="/sms-opt-in">https://splitacharter.boats/sms-opt-in</a>. SMS consent is never required as a condition of purchasing any charter or using email-based booking services.</li>
					<li><strong>Message Frequency:</strong> Message frequency varies depending on your active booking status and upcoming charter schedules (typically 1–4 messages per reservation flow).</li>
					<li><strong>Pricing &amp; Rates:</strong> Message and data rates may apply as determined by your wireless carrier. SplitACharter does not charge any additional mobile fee.</li>
					<li><strong>Opt-Out / Unsubscribe (STOP):</strong> You can cancel SMS notifications at any time by texting <strong>STOP</strong>, <strong>CANCEL</strong>, <strong>UNSUBSCRIBE</strong>, <strong>END</strong>, or <strong>QUIT</strong> in response to any message. You will receive a single confirmation text confirming your opt-out. After opting out, no further text messages will be sent unless you re-subscribe by texting <strong>START</strong> or <strong>UNSTOP</strong>.</li>
					<li><strong>Support &amp; Assistance (HELP):</strong> For assistance with SMS communications, reply <strong>HELP</strong> or <strong>INFO</strong> to any message, or contact our support team at <a href="mailto:info@splitacharter.boats">info@splitacharter.boats</a>.</li>
					<li><strong>Carrier Liability Disclaimer:</strong> Wireless carriers (including but not limited to AT&amp;T, T-Mobile, Verizon) are not liable for delayed, undelivered, or misdirected messages.</li>
					<li><strong>Privacy &amp; Data Sharing:</strong> Your mobile number and SMS consent records are handled strictly under our <a href="/privacy">Privacy Policy</a> and will never be shared, rented, or sold to third parties or affiliates for marketing or promotional purposes.</li>
				</ul>
			</section>

			<section class="legal-section">
				<h2>7. Customer Conduct &amp; Account Suspension</h2>
				<p>
					Customers who accumulate 3 strikes (issued for non-reconfirmation or no-show violations) may have their account permanently suspended from the SplitACharter platform.
				</p>
			</section>

			<section class="legal-section">
				<h2>8. Contact Us</h2>
				<p>
					If you have questions regarding these Terms &amp; Conditions, please contact us at:
				</p>
				<p class="contact-email">
					Email: <a href="mailto:info@splitacharter.boats">info@splitacharter.boats</a>
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
	.legal-section ul, .legal-section ol {
		color: var(--text-secondary);
		padding-left: 1.5rem;
		margin-bottom: 0.75rem;
	}
	.legal-section li {
		margin-bottom: 0.5rem;
	}

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
