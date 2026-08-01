<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	// Step states
	/* svelte-ignore state_referenced_locally */
	let name = $state(data.profile?.name || '');
	/* svelte-ignore state_referenced_locally */
	let phone = $state(data.profile?.phone || '');
	/* svelte-ignore state_referenced_locally */
	let email = $state(data.profile?.email || data.userEmail || '');
	/* svelte-ignore state_referenced_locally */
	let smsOptIn = $state(data.profile?.sms_opt_in || false);
	/* svelte-ignore state_referenced_locally */
	let howHeard = $state(data.profile?.how_heard || '');
	
	/* svelte-ignore state_referenced_locally */
	let groupSize = $state(data.initialGroupSize || 1);
	let certFields = $state({
		certified: true,
		level: '',
		agency: '',
		lastDive: '',
		freediveCertified: false,
		freediveAgency: ''
	});
	
	let commitment = $state(false);
	let liability = $state(false);
	
	// Mock card inputs
	let cardNumber = $state('');
	let expiry = $state('');
	let cvc = $state('');
	let paymentOutcome = $state('success');
	let submitting = $state(false);

	const isScubaTrip = $derived(
		data.listing.trip_type.toLowerCase().includes('scuba')
	);

	const isFreediveTrip = $derived(
		data.listing.trip_type.toLowerCase().includes('freedive')
	);
</script>

<svelte:head>
	<title>Checkout — SplitACharter</title>
</svelte:head>

<div class="checkout-wrapper">
	<div class="bg-blur bg-blur-1"></div>
	<div class="bg-blur bg-blur-2"></div>

	<div class="checkout-container">
		<header class="checkout-header">
			<a href="/browse/{data.listing.id}" class="back-link">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
				</svg>
				<span>Back to Details</span>
			</a>
			<h1>Book Your Charter Slot</h1>
			<p class="subtitle">Complete your profile, specify group size, and make your reservation deposit.</p>
		</header>

		{#if form?.message}
			<div class="alert alert-danger glass">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 alert-icon">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
				</svg>
				<span>{form.message}</span>
			</div>
		{/if}

		<div class="checkout-grid">
			<!-- Main Form -->
			<div class="form-panel glass">
				<form
					method="POST"
					action="?/checkout&templateId={data.listing.id}&date={data.date}"
					use:enhance={() => {
						submitting = true;
						return async ({ update }) => {
							await update();
							submitting = false;
						};
					}}
					class="checkout-form"
				>
					<!-- Hidden inputs for calculated fields -->
					<input type="hidden" name="templateId" value={data.listing.id} />
					<input type="hidden" name="date" value={data.date} />
					<input type="hidden" name="tripInstanceId" value={data.tripInstanceId || ''} />
					<input type="hidden" name="sms_opt_in" value={String(smsOptIn)} />
					<input type="hidden" name="commitment" value={String(commitment)} />
					<input type="hidden" name="liability" value={String(liability)} />
					<input type="hidden" name="certification_fields" value={JSON.stringify(
						isScubaTrip ? {
							type: 'scuba',
							certified: true,
							level: certFields.level,
							agency: certFields.agency,
							lastDive: certFields.lastDive
						} : isFreediveTrip ? {
							type: 'freedive',
							freediveCertified: certFields.freediveCertified,
							freediveAgency: certFields.freediveAgency
						} : null
					)} />
					<input type="hidden" name="payment_outcome" value={paymentOutcome} />

					<!-- Section 1: Customer Profile -->
					<section class="form-section">
						<div class="section-title">
							<span class="step-badge">1</span>
							<h2>Profile Details</h2>
						</div>
						<p class="section-desc">We need some basic info to set up your profile and coordinate matches.</p>

						<div class="inputs-grid">
							<div class="form-group">
								<label for="name">Full Name</label>
								<input
									type="text"
									id="name"
									name="name"
									autocomplete="name"
									bind:value={name}
									placeholder="e.g., John Doe"
									required
								/>
							</div>

							<div class="form-group">
								<label for="phone">Phone Number</label>
								<input
									type="tel"
									id="phone"
									name="phone"
									autocomplete="tel"
									inputmode="tel"
									bind:value={phone}
									placeholder="e.g., +15551234567"
									required
								/>
								<span class="input-helper">SMS updates are sent here</span>
							</div>

							<div class="form-group">
								<label for="email">Email Address</label>
								<input
									type="email"
									id="email"
									name="email"
									autocomplete="email"
									bind:value={email}
									placeholder="e.g., john@example.com"
									required
								/>
								<span class="input-helper">Booking & receipt confirmations sent here</span>
							</div>

							<div class="form-group full-width">
								<label for="how_heard">How Did You Hear About Us?</label>
								<select id="how_heard" name="how_heard" bind:value={howHeard} required>
									<option value="" disabled selected>Select an option...</option>
									<option value="Google Search">Google Search</option>
									<option value="Friend/Word of Mouth">Friend/Word of Mouth</option>
									<option value="Social Media">Social Media</option>
									<option value="Captain Referral">Captain Referral</option>
									<option value="Other">Other</option>
								</select>
							</div>

							<div class="form-group full-width checkbox-row">
								<input
									type="checkbox"
									id="sms_opt_in"
									bind:checked={smsOptIn}
								/>
								<label for="sms_opt_in">
									Opt-in to SMS notifications. You must consent to receive transaction alerts, booking match updates, and reconfirmation text notifications.
								</label>
							</div>
						</div>
					</section>

					<!-- Section 2: Booking details -->
					<section class="form-section">
						<div class="section-title">
							<span class="step-badge">2</span>
							<h2>Booking Details</h2>
						</div>
						<p class="section-desc">Specify group parameters and accept our split-cost policies.</p>

						<div class="inputs-grid">
							<div class="form-group full-width">
								<label for="group_size">Your Group Size (Number of Passengers)</label>
								<div class="group-size-wrapper">
									<input
										type="number"
										id="group_size"
										name="group_size"
										min="1"
										max={data.maxAvailablePassengers}
										bind:value={groupSize}
										required
									/>
									<span class="pax-cap" class:pax-cap-full={data.maxAvailablePassengers <= 0}>
										{data.maxAvailablePassengers > 0 ? `Max Available: ${data.maxAvailablePassengers} Pax` : 'Fully Booked'}
									</span>
								</div>
								{#if data.maxAvailablePassengers <= 0}
									<span class="input-helper error-text">This charter is already at full capacity for the selected date.</span>
								{:else if groupSize > data.maxAvailablePassengers}
									<span class="input-helper error-text">Group size ({groupSize}) exceeds the max available open seats ({data.maxAvailablePassengers}) for this charter.</span>
								{:else}
									<span class="input-helper info-text">
										ℹ️ {#if data.isJoiningExisting}Joining an existing charter group! Up to {data.maxAvailablePassengers} open {data.maxAvailablePassengers === 1 ? 'seat is' : 'seats are'} available for your group.{:else}Group signups are capped at 4 passengers to encourage group matching and split charter costs evenly.{/if}
									</span>
								{/if}
							</div>

							<!-- Conditional Certification Fields -->
							{#if isScubaTrip}
								<div class="form-group full-width cert-fields-panel glass">
									<div class="cert-panel-header">
										<div class="header-title-group">
											<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 icon-accent">
												<path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
											</svg>
											<h4>SCUBA Certification Details</h4>
										</div>
										<span class="required-tag">Required for Checkout</span>
									</div>
									<p class="panel-subtitle">This is a Scuba Diving charter. Please provide your group's certification details to proceed.</p>
									<div class="cert-inputs">
										<div class="form-group">
											<label for="cert-level">Certification Level <span class="req-star">*</span></label>
											<input
												type="text"
												id="cert-level"
												placeholder="e.g. Open Water, Advanced"
												bind:value={certFields.level}
												required
											/>
										</div>
										<div class="form-group">
											<label for="cert-agency">Certifying Agency <span class="req-star">*</span></label>
											<input
												type="text"
												id="cert-agency"
												placeholder="e.g. PADI, NAUI, SSI"
												bind:value={certFields.agency}
												required
											/>
										</div>
										<div class="form-group full-width">
											<label for="cert-last">Date of Last Dive (Optional)</label>
											<input
												type="text"
												id="cert-last"
												placeholder="e.g. June 2026"
												bind:value={certFields.lastDive}
											/>
										</div>
									</div>
									<p class="cert-disclaimer-note">ℹ️ <strong>Note:</strong> Proof of certification may be required by your captain prior to departure.</p>
								</div>
							{:else if isFreediveTrip}
								<div class="form-group full-width cert-fields-panel glass">
									<div class="cert-panel-header">
										<div class="header-title-group">
											<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 icon-info">
												<path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
											</svg>
											<h4>Freediving Certification Info</h4>
										</div>
										<span class="optional-tag">Optional / Encouraged</span>
									</div>
									<p class="panel-subtitle">Help your captain prepare by confirming your group's freediving background (optional).</p>
									<div class="checkbox-row mb-3 mt-2">
										<input
											type="checkbox"
											id="freediveCertified"
											bind:checked={certFields.freediveCertified}
										/>
										<label for="freediveCertified"><strong>Is your group Freedive certified?</strong></label>
									</div>
									<div class="cert-inputs">
										<div class="form-group full-width">
											<label for="freedive-agency">Certifying Agency (Optional)</label>
											<input
												type="text"
												id="freedive-agency"
												placeholder="e.g. FII, PADI Freediver, SSI"
												bind:value={certFields.freediveAgency}
											/>
										</div>
									</div>
									<p class="cert-disclaimer-note">ℹ️ <strong>Note:</strong> Proof of certification may be required by your captain prior to departure.</p>
								</div>
							{/if}

							<div class="form-group full-width checkbox-row agreement-row">
								<input
									type="checkbox"
									id="commitment"
									bind:checked={commitment}
									required
								/>
								<label for="commitment">
									I understand that when a match is found, I will have a limited <strong>Reconfirmation Window</strong> (between 2 to 24 hours depending on the date) to verify my attendance. Failure to reconfirm results in forfeiting my $50 deposit.
								</label>
							</div>

							<div class="waiver-box glass">
								<h4>Participant Release & Assumption of Risk</h4>
								<p>
									By completing this booking, I acknowledge that marine excursions, sea-angling, open water transit, and snorkeling involve inherent risks, including but not limited to changing weather, sea states, slippery vessel decks, marine life encounters, and vessel motion. 
								</p>
								<p>
									I agree to comply with all safety briefings, vessel regulations, and life preserver wear requirements directed by the licensed Captain. I certify that I am in appropriate physical health for this excursion.
								</p>
								<p>
									I hereby release and hold harmless SplitACharter, its vessel operators, and contracted captains from all claims, liability, or injury arising from my participation, except in cases of gross negligence.
								</p>
							</div>

							<div class="form-group full-width checkbox-row agreement-row">
								<input
									type="checkbox"
									id="liability"
									bind:checked={liability}
									required
								/>
								<label for="liability">
									I have read and agree to the Participant Release & Assumption of Risk Agreement, general terms, and Captain's safety policies.
								</label>
							</div>
						</div>
					</section>

					<!-- Section 3: Payment Section -->
					<section class="form-section">
						<div class="section-title">
							<span class="step-badge">3</span>
							<h2>Reservation Fee</h2>
						</div>
						<p class="section-desc">A $50.00 non-refundable reservation deposit is collected via Stripe to secure your slot.</p>

						<div class="mock-card-panel glass">
							<div class="sandbox-badge">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
									<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								Stripe Sandbox Mode
							</div>

							<div class="form-group">
								<label for="card-number">Card Number</label>
								<input
									type="text"
									id="card-number"
									name="cc-number"
									autocomplete="cc-number"
									inputmode="numeric"
									bind:value={cardNumber}
									placeholder="4242 4242 4242 4242"
									class="card-input"
								/>
							</div>

							<div class="card-extra-row">
								<div class="form-group">
									<label for="card-expiry">Expiration</label>
									<input
										type="text"
										id="card-expiry"
										name="cc-exp"
										autocomplete="cc-exp"
										inputmode="numeric"
										bind:value={expiry}
										placeholder="MM/YY (e.g. 12/28)"
										class="card-input"
									/>
								</div>
								<div class="form-group">
									<label for="card-cvc">CVC</label>
									<input
										type="text"
										id="card-cvc"
										name="cc-csc"
										autocomplete="cc-csc"
										inputmode="numeric"
										bind:value={cvc}
										placeholder="123"
										class="card-input"
									/>
								</div>
							</div>

							<div class="form-group" style="margin-top: 1rem; text-align: left;">
								<label for="payment-outcome" style="display: block; margin-bottom: 0.5rem; font-size: 0.8rem; color: var(--text-secondary); font-weight: 600;">Sandbox Payment Outcome</label>
								<select id="payment-outcome" bind:value={paymentOutcome} class="card-input" style="cursor: pointer; background: var(--input-bg); border: 1px solid var(--border-light); border-radius: 4px; padding: 0.6rem; color: var(--text-primary); width: 100%;">
									<option value="success" style="background: var(--bg-surface); color: var(--success); font-weight: bold;">✔ Success (Approved)</option>
									<option value="fail" style="background: var(--bg-surface); color: var(--danger); font-weight: bold;">❌ Failure (Card Declined)</option>
								</select>
							</div>
						</div>
					</section>

					<div class="form-actions">
						<button
							type="submit"
							class="btn btn-primary btn-large w-full btn-submit-checkout"
							disabled={submitting || groupSize > data.maxAvailablePassengers || data.maxAvailablePassengers <= 0}
						>
							{#if submitting}
								<svg class="spinner-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle class="spinner-track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="spinner-head" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								<span>Processing Deposit & Booking...</span>
							{:else}
								Simulate Deposit & Book Slot
							{/if}
						</button>
					</div>
				</form>
			</div>

			<!-- Sidebar Summary Panel -->
			<div class="summary-panel glass">
				<h3>Reservation Summary</h3>
				<div class="divider"></div>

				<div class="summary-item">
					<span class="summary-label">Trip Type</span>
					<span class="summary-val">{data.listing.trip_type}</span>
				</div>
				<div class="summary-item">
					<span class="summary-label">Location</span>
					<span class="summary-val">{data.listing.location}</span>
				</div>
				<div class="summary-item">
					<span class="summary-label">Date Selected</span>
					<span class="summary-val date-highlight">{data.date}</span>
				</div>

				<div class="divider"></div>

				<div class="share-box">
					{#if data.isJoiningExisting}
						<div class="share-badge">Cost Share Active</div>
						<p class="share-info">
							You are joining an existing group! The total charter price ($600-$800) is split 50/50. 
							You will pay your half ($300-$400) directly to the Captain on the day of the trip.
						</p>
					{:else}
						<div class="share-badge pending">Cost Share Pending</div>
						<p class="share-info">
							You are starting a new charter instance. Once a second group joins and reconfirms, 
							the trip will lock in. If no match is found, your $50 fee is fully refunded.
						</p>
					{/if}
				</div>

				<div class="divider"></div>

				<div class="due-row">
					<span>Due Now (Stripe Deposit):</span>
					<span class="due-amount">$50.00</span>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.checkout-wrapper {
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

	.checkout-container {
		max-width: 1200px;
		margin: 0 auto;
		width: 100%;
		z-index: 2;
		position: relative;
	}

	.checkout-header {
		margin-bottom: 3rem;
	}
	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		color: var(--text-secondary);
		text-decoration: none;
		font-size: 0.9rem;
		font-weight: 500;
		margin-bottom: 1.5rem;
		transition: color 0.2s ease;
	}
	.back-link:hover {
		color: var(--text-primary);
	}
	.checkout-header h1 {
		font-size: clamp(1.75rem, 5vw, 2.5rem);
		font-weight: 800;
		letter-spacing: -0.7px;
		margin-bottom: 0.5rem;
	}
	.subtitle {
		font-size: 1.05rem;
		color: var(--text-secondary);
		max-width: 600px;
		line-height: 1.5;
	}

	.alert {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 2rem;
		font-size: 0.95rem;
	}
	.alert-danger {
		background: rgba(239, 68, 68, 0.12);
		border: 1px solid rgba(239, 68, 68, 0.2);
		color: #fca5a5;
	}
	.alert-icon {
		flex-shrink: 0;
	}

	.checkout-grid {
		display: grid;
		grid-template-columns: 1.7fr 1.3fr;
		gap: 2.5rem;
		align-items: start;
	}

	/* Left side Form panel */
	.form-panel {
		padding: 2.5rem;
		border: 1px solid var(--border-light);
	}
	.form-section {
		border-bottom: 1px solid var(--border-light);
		padding-bottom: 2.5rem;
		margin-bottom: 2.5rem;
	}
	.form-section:last-of-type {
		border-bottom: none;
		padding-bottom: 0;
		margin-bottom: 0;
	}
	.section-title {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 0.5rem;
	}
	.step-badge {
		background: linear-gradient(135deg, var(--primary), var(--secondary));
		width: 28px;
		height: 28px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 0.9rem;
		font-family: var(--font-heading);
		flex-shrink: 0;
	}
	.section-title h2 {
		font-size: 1.35rem;
		font-weight: 700;
	}
	.section-desc {
		font-size: 0.85rem;
		color: var(--text-secondary);
		margin-bottom: 1.5rem;
		line-height: 1.5;
	}

	.inputs-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.25rem;
	}
	.form-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.full-width {
		grid-column: span 2;
	}
	label {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-secondary);
	}
	.input-helper {
		font-size: 0.75rem;
		color: var(--text-muted);
		margin-top: -4px;
	}

	.checkbox-row {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		flex-direction: row;
		padding: 4px 0;
	}
	.checkbox-row input {
		margin-top: 3px;
		cursor: pointer;
		flex-shrink: 0;
	}
	.checkbox-row label {
		font-size: 0.85rem;
		color: var(--text-secondary);
		line-height: 1.5;
		cursor: pointer;
		font-weight: 400;
	}

	.agreement-row {
		margin-top: 0.5rem;
	}
	.agreement-row label {
		font-size: 0.8rem;
		color: var(--text-secondary);
	}

	.group-size-wrapper {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.75rem 1rem;
	}
	.group-size-wrapper input {
		width: 100px;
	}
	.pax-cap {
		font-weight: 600;
		color: var(--primary);
		font-size: 0.9rem;
	}
	.pax-cap-full {
		color: #ef4444;
	}
	.error-text {
		color: #fca5a5 !important;
		font-weight: 600;
	}

	/* Certification panel styles */
	.cert-fields-panel {
		padding: 1.5rem;
		border: 1px solid var(--border-light);
		background: rgba(15, 23, 42, 0.4);
		border-radius: 12px;
		margin-bottom: 1.5rem;
	}
	.cert-panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 0.5rem;
		flex-wrap: wrap;
	}
	.header-title-group {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.header-title-group h4 {
		font-size: 1.05rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0;
	}
	.required-tag {
		background: rgba(239, 68, 68, 0.15);
		color: #f87171;
		border: 1px solid rgba(239, 68, 68, 0.3);
		padding: 3px 8px;
		border-radius: 12px;
		font-size: 0.72rem;
		font-weight: 600;
	}
	.optional-tag {
		background: rgba(99, 102, 241, 0.15);
		color: var(--secondary);
		border: 1px solid rgba(99, 102, 241, 0.3);
		padding: 3px 8px;
		border-radius: 12px;
		font-size: 0.72rem;
		font-weight: 600;
	}
	.panel-subtitle {
		font-size: 0.82rem;
		color: var(--text-secondary);
		margin-bottom: 1rem;
		line-height: 1.4;
	}
	.req-star {
		color: #f87171;
		font-weight: 700;
	}
	.mb-3 {
		margin-bottom: 0.75rem;
	}
	.mt-2 {
		margin-top: 0.5rem;
	}
	.cert-inputs {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.25rem;
		border-top: 1px dashed var(--border-light);
		padding-top: 1.25rem;
	}
	.cert-disclaimer-note {
		font-size: 0.8rem;
		color: var(--text-muted);
		background: rgba(255, 255, 255, 0.03);
		padding: 8px 12px;
		border-radius: 6px;
		border: 1px solid var(--border-light);
		margin-top: 1rem;
		line-height: 1.4;
	}

	/* Stripe Sandbox form styling */
	.mock-card-panel {
		padding: 1.5rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid var(--border-light);
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		position: relative;
	}
	.sandbox-badge {
		position: absolute;
		right: 1.5rem;
		top: 1.5rem;
		background: rgba(16, 185, 129, 0.12);
		color: var(--success);
		border: 1px solid rgba(16, 185, 129, 0.2);
		font-size: 0.75rem;
		padding: 4px 10px;
		border-radius: 20px;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 4px;
	}
	.card-input {
		background: rgba(255, 255, 255, 0.02) !important;
		color: var(--text-muted) !important;
		letter-spacing: 1px;
	}
	.card-extra-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.25rem;
	}

	.form-actions {
		margin-top: 2.5rem;
	}
	.btn-submit-checkout {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.65rem;
		transition: all 0.2s ease;
	}
	.btn-submit-checkout:disabled {
		opacity: 0.7;
		cursor: not-allowed;
		pointer-events: none;
		box-shadow: none;
		transform: none;
	}
	.spinner-icon {
		width: 1.25rem;
		height: 1.25rem;
		animation: spin 0.8s linear infinite;
	}
	.spinner-track {
		opacity: 0.25;
	}
	.spinner-head {
		opacity: 0.9;
	}
	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	/* Sidebar Summary panel */
	.summary-panel {
		padding: 2rem;
		border: 1px solid var(--border-light);
	}
	.summary-panel h3 {
		font-size: 1.25rem;
		font-weight: 700;
		margin-bottom: 1.25rem;
	}
	.divider {
		height: 1px;
		background-color: var(--border-light);
		margin: 1.25rem 0;
	}
	.summary-item {
		display: flex;
		justify-content: space-between;
		font-size: 0.95rem;
		margin-bottom: 0.75rem;
	}
	.summary-label {
		color: var(--text-secondary);
	}
	.summary-val {
		font-weight: 600;
		color: var(--text-primary);
		text-align: right;
	}
	.date-highlight {
		color: var(--primary);
	}

	.share-box {
		background: rgba(255, 255, 255, 0.02);
		padding: 1.25rem;
		border-radius: 8px;
		border: 1px solid var(--border-light);
	}
	.share-badge {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		color: var(--primary);
		margin-bottom: 8px;
		letter-spacing: 0.5px;
	}
	.share-badge.pending {
		color: var(--accent);
	}
	.share-info {
		font-size: 0.8rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}

	.due-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 1.05rem;
		font-weight: 600;
	}
	.due-amount {
		font-family: var(--font-heading);
		font-size: 1.5rem;
		font-weight: 800;
		color: var(--primary);
	}

	.waiver-box {
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid var(--border-light);
		padding: 1rem;
		border-radius: 6px;
		max-height: 120px;
		overflow-y: auto;
		font-size: 0.8rem;
		line-height: 1.45;
		color: var(--text-secondary);
		margin-bottom: 1.25rem;
		width: 100%;
		text-align: left;
	}
	.waiver-box h4 {
		margin-top: 0;
		margin-bottom: 0.5rem;
		color: var(--text-primary);
		font-weight: 700;
		font-size: 0.85rem;
	}
	.waiver-box p {
		margin-bottom: 0.5rem;
	}
	.waiver-box p:last-child {
		margin-bottom: 0;
	}

	@media (max-width: 992px) {
		.checkout-grid {
			grid-template-columns: 1fr;
			gap: 1.75rem;
		}
		.summary-panel {
			order: -1;
		}
	}
	@media (max-width: 576px) {
		.checkout-wrapper {
			padding: 1.75rem 1rem;
		}
		.checkout-header {
			margin-bottom: 1.75rem;
		}
		.form-panel, .summary-panel {
			padding: 1.25rem 1rem;
		}
		.inputs-grid {
			grid-template-columns: 1fr;
			gap: 1rem;
		}
		.cert-inputs {
			grid-template-columns: 1fr;
			gap: 1rem;
		}
		.full-width {
			grid-column: span 1;
		}
		.card-extra-row {
			grid-template-columns: 1fr;
			gap: 1rem;
		}
		.mock-card-panel {
			padding: 1.25rem 1rem;
		}
		.sandbox-badge {
			position: static;
			align-self: flex-start;
			margin-bottom: 0.5rem;
		}
		input, select {
			font-size: 1rem !important;
		}
	}

	@media (max-width: 380px) {
		.checkout-wrapper {
			padding: 1.25rem 0.5rem;
		}
		.form-panel, .summary-panel {
			padding: 1rem 0.75rem;
		}
	}
</style>
