<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form }: { data: any; form: any } = $props();

	let savingId = $state<string | null>(null);
	let saveSuccessId = $state<string | null>(null);
	let selectedId = $state<string | null>(null);

	let editingReview = $state<any | null>(null);
	let isAddingReview = $state(false);
	let newReviewDraft = $state({
		name: '',
		location: '',
		trip: '',
		stars: 5,
		avatar: '',
		quote: ''
	});

	let activeNavSection = $state('sec-notifications');
	let highlightedSection = $state<string | null>(null);

	let activeEmailTemplate = $state('');
	let previewIframeSrc = $derived(
		activeEmailTemplate ? `/api/preview-emails?template=${activeEmailTemplate}` : '/api/preview-emails'
	);

	let isRunningTests = $state(false);
	let testResults = $state<any | null>(null);
	let testError = $state<string | null>(null);

	let isFetchingStripe = $state(false);
	let stripeStatusResults = $state<any | null>(null);
	let stripeStatusError = $state<string | null>(null);

	async function runNotificationTests() {
		isRunningTests = true;
		testResults = null;
		testError = null;
		try {
			const res = await fetch('/api/test-notifications');
			const json = await res.json();
			testResults = json;
		} catch (err: any) {
			testError = err.message || 'Failed to run notification tests';
		} finally {
			isRunningTests = false;
		}
	}

	async function fetchStripeStatus() {
		isFetchingStripe = true;
		stripeStatusResults = null;
		stripeStatusError = null;
		try {
			const res = await fetch('/api/debug/stripe');
			const json = await res.json();
			stripeStatusResults = json;
		} catch (err: any) {
			stripeStatusError = err.message || 'Failed to fetch Stripe status';
		} finally {
			isFetchingStripe = false;
		}
	}

	function navigateToSection(secId: string) {
		activeNavSection = secId;
	}

	// Automatically select the first template once settings are loaded
	$effect(() => {
		if (!selectedId && data.settings?.length > 0) {
			selectedId = data.settings[0].id;
		}
	});

	const selectedSetting = $derived(data.settings?.find((s: any) => s.id === selectedId));

	const triggerPlaceholders: Record<string, string[]> = {
		admin_trip_cancellation: ['{customer_name}', '{trip_date}', '{trip_type}', '{cancellation_reason}', '{refund_status_text}', '{dashboard_url}'],
		reservation_pending_match: ['{customer_name}', '{trip_date}', '{trip_type}', '{dashboard_url}'],
		match_detected: ['{customer_name}', '{trip_date}', '{trip_type}', '{dashboard_url}'],
		match_auto_reconfirmed: ['{customer_name}', '{trip_date}', '{trip_type}', '{dashboard_url}'],
		reconfirm_reminder: ['{customer_name}', '{trip_date}', '{trip_type}', '{deadline_time}', '{dashboard_url}'],
		reconfirm_forfeited: ['{customer_name}', '{trip_date}', '{trip_type}'],
		counterpart_forfeited: ['{customer_name}', '{trip_date}', '{trip_type}'],
		captain_blast: ['{trip_type}', '{trip_date}', '{location}', '{accept_url}'],
		captain_confirmed: ['{customer_name}', '{captain_name}', '{meeting_area}', '{trip_date}', '{trip_type}'],
		captain_secured: ['{captain_name}', '{trip_date}', '{trip_type}', '{passenger_list}'],
		captain_details_link: ['{trip_type}', '{trip_date}', '{location}', '{details_url}'],
		matching_timeout: ['{customer_name}', '{trip_date}', '{trip_type}'],
		unmatched_trip_timeout: ['{customer_name}', '{trip_date}', '{trip_type}']
	};

	function formatTriggerName(name: string) {
		return name
			.replace(/_/g, ' ')
			.replace(/\b\w/g, (char) => char.toUpperCase());
	}
</script>

<svelte:head>
	<title>Notification Settings — SplitACharter</title>
</svelte:head>

<div class="admin-header">
	<div>
		<span class="subtitle">Platform Operations</span>
		<h1>Admin Settings</h1>
	</div>
</div>

<!-- Persistent Sticky Navigation Pill Bar -->
<div class="sticky-nav-bar-wrapper">
	<div class="settings-nav-pills glass">
		<button 
			type="button" 
			class="nav-pill-btn" 
			class:active={activeNavSection === 'sec-notifications'} 
			onclick={() => navigateToSection('sec-notifications')}
		>
			🔔 Notifications
		</button>
		<button 
			type="button" 
			class="nav-pill-btn" 
			class:active={activeNavSection === 'sec-trip-types'} 
			onclick={() => navigateToSection('sec-trip-types')}
		>
			⚓ Trip Types
		</button>
		<button 
			type="button" 
			class="nav-pill-btn" 
			class:active={activeNavSection === 'sec-reviews'} 
			onclick={() => navigateToSection('sec-reviews')}
		>
			⭐ Reviews Management
		</button>
		<button 
			type="button" 
			class="nav-pill-btn" 
			class:active={activeNavSection === 'sec-timings'} 
			onclick={() => navigateToSection('sec-timings')}
		>
			⏱️ System Timings & Rules
		</button>
		<button 
			type="button" 
			class="nav-pill-btn" 
			class:active={activeNavSection === 'sec-preview-emails'} 
			onclick={() => navigateToSection('sec-preview-emails')}
		>
			✉️ Email Previews
		</button>
		<button 
			type="button" 
			class="nav-pill-btn" 
			class:active={activeNavSection === 'sec-stripe-status'} 
			onclick={() => { navigateToSection('sec-stripe-status'); if (!stripeStatusResults && !isFetchingStripe) fetchStripeStatus(); }}
		>
			💳 Stripe Status
		</button>
	</div>
</div>


{#if form?.message}
	<div class="alert alert-error glass">
		<p>{form.message}</p>
	</div>
{/if}

{#if activeNavSection === 'sec-notifications'}
	<div id="sec-notifications" class="settings-grid">
		<!-- Left Sidebar List -->
		<div class="template-sidebar glass">
			<div class="sidebar-header">
				<h3>Select Template</h3>
			</div>
			<div class="sidebar-list">
				{#each data.settings as setting}
					<button 
						type="button" 
						class="sidebar-item" 
						class:active={selectedId === setting.id}
						onclick={() => selectedId = setting.id}
					>
						<div class="item-title">{formatTriggerName(setting.trigger_name)}</div>
						<div class="item-meta">
							<span class="status-dot" class:enabled={setting.email_enabled || setting.sms_enabled}></span>
							<span class="meta-code">{setting.trigger_name}</span>
						</div>
					</button>
				{/each}
			</div>
		</div>

		<!-- Right Form Editor -->
		<div class="template-detail">
			{#if selectedSetting}
				<div class="template-card glass">
					<div class="card-header">
						<h2>{formatTriggerName(selectedSetting.trigger_name)}</h2>
						<span class="code-ref">{selectedSetting.trigger_name}</span>
					</div>
					
					<form 
						method="POST" 
						action="?/saveTemplate"
						use:enhance={() => {
							savingId = selectedSetting.id;
							saveSuccessId = null;
							return async ({ update, result }) => {
								await update({ reset: false });
								savingId = null;
								if (result.type === 'success') {
									saveSuccessId = selectedSetting.id;
									setTimeout(() => {
										if (saveSuccessId === selectedSetting.id) {
											saveSuccessId = null;
										}
									}, 3000);
								}
							};
						}}
						class="card-body"
					>
						<input type="hidden" name="id" value={selectedSetting.id} />

						<!-- Channel Status Toggles -->
						<div class="channels-row">
							<div class="toggle-group">
								<label class="toggle-label">
									<input 
										type="checkbox" 
										bind:checked={selectedSetting.email_enabled}
									/>
									<span class="toggle-text">Email Channel</span>
								</label>
								<input type="hidden" name="email_enabled" value={selectedSetting.email_enabled ? 'true' : 'false'} />
							</div>

							<div class="toggle-group">
								<label class="toggle-label">
									<input 
										type="checkbox" 
										bind:checked={selectedSetting.sms_enabled}
									/>
									<span class="toggle-text">SMS Channel</span>
								</label>
								<input type="hidden" name="sms_enabled" value={selectedSetting.sms_enabled ? 'true' : 'false'} />
							</div>
						</div>

						<div class="divider"></div>

						<!-- Email Template Editor -->
						<div class="form-group" class:disabled={!selectedSetting.email_enabled}>
							<label for="email-template-{selectedSetting.id}">Email Body Template</label>
							<textarea 
								id="email-template-{selectedSetting.id}" 
								name="email_template" 
								disabled={!selectedSetting.email_enabled}
								rows="5"
								placeholder="Disabled (toggled off)"
								bind:value={selectedSetting.email_template}
							></textarea>
						</div>

						<!-- SMS Template Editor -->
						<div class="form-group" class:disabled={!selectedSetting.sms_enabled}>
							<label for="sms-template-{selectedSetting.id}">SMS Text Template</label>
							<textarea 
								id="sms-template-{selectedSetting.id}" 
								name="sms_template" 
								disabled={!selectedSetting.sms_enabled}
								rows="4"
								placeholder="Disabled (toggled off)"
								bind:value={selectedSetting.sms_template}
							></textarea>
						</div>

						<!-- Placeholders Cheat-sheet -->
						<div class="placeholders-info">
							<span class="info-title">Supported Placeholders:</span>
							<div class="placeholders-chips">
								{#each triggerPlaceholders[selectedSetting.trigger_name] || ['{customer_name}'] as ph}
									<code class="ph-chip">{ph}</code>
								{/each}
							</div>
						</div>

						<div class="card-footer">
							{#if saveSuccessId === selectedSetting.id}
								<span class="status-alert success-msg">
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4 inline">
										<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
									</svg>
									Changes saved!
								</span>
							{/if}

							<button 
								type="submit" 
								class="btn btn-primary"
								disabled={savingId === selectedSetting.id}
							>
								{savingId === selectedSetting.id ? 'Saving...' : 'Save Configuration'}
							</button>
						</div>
					</form>
				</div>
			{:else}
				<div class="empty-state glass">
					<p>Select a notification trigger template from the sidebar list to edit its channels and templates.</p>
				</div>
			{/if}
		</div>
	</div>
{:else if activeNavSection === 'sec-trip-types'}
	<div id="sec-trip-types" class="admin-header section-header">
		<div>
			<span class="subtitle">Operations Configuration</span>
			<h2>Allowed Trip Types</h2>
			<p class="section-desc">Manage the exact categories of charters allowed on the platform.</p>
		</div>
	</div>

	{#if form?.tripTypeMessage}
		<div class="alert alert-error glass">
			<p>{form.tripTypeMessage}</p>
		</div>
	{/if}

	<div class="trip-types-container glass">
		<div class="trip-types-grid">
			<div class="add-type-form">
				<h3>Add New Trip Type</h3>
				<form method="POST" action="?/addTripType" use:enhance class="type-form">
					<div class="form-group">
						<label for="new-trip-type">Trip Type Name</label>
						<input 
							id="new-trip-type" 
							type="text" 
							name="name" 
							placeholder="e.g. Eco Tour" 
							required 
							class="text-input"
						/>
					</div>
					<button type="submit" class="btn btn-primary" style="margin-top: 0.5rem; align-self: flex-start;">Add Trip Type</button>
				</form>
			</div>

			<div class="types-list-section">
				<h3>Active Trip Types ({data.tripTypes?.length || 0})</h3>
				{#if !data.tripTypes || data.tripTypes.length === 0}
					<p class="empty-msg">No trip types defined. The system requires at least one.</p>
				{:else}
					<div class="types-table glass">
						{#each data.tripTypes as type}
							<div class="type-row">
								<span class="type-name">{type.name}</span>
								<form method="POST" action="?/deleteTripType" use:enhance class="delete-form">
									<input type="hidden" name="name" value={type.name} />
									<button 
										type="submit" 
										class="btn-danger-action"
										onclick={(e) => {
											if (!confirm(`Are you sure you want to delete "${type.name}"?`)) {
												e.preventDefault();
											}
										}}
									>
										Delete
									</button>
								</form>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
{:else if activeNavSection === 'sec-reviews'}
	<div id="sec-reviews" class="admin-header section-header">
		<div>
			<span class="subtitle">Content Management</span>
			<h2>Landing Page Reviews</h2>
			<p class="section-desc">Manage guest and captain testimonials displayed in the landing page marquee carousel.</p>
		</div>
</div>

{#if form?.reviewMessage}
	<div class="alert alert-error glass">
		<p>{form.reviewMessage}</p>
	</div>
{/if}

<div class="reviews-mgmt-container glass">
	<div class="reviews-mgmt-header">
		<div>
			<h3>Platform Reviews ({data.reviews?.length || 0})</h3>
			<p class="sub-text">Active reviews will be displayed in the scrolling landing page carousel.</p>
		</div>
		<div class="header-btns">
			{#if !data.reviews || data.reviews.length === 0}
				<form method="POST" action="?/seedReviews" use:enhance>
					<button type="submit" class="btn btn-secondary">
						⚡ Seed 10 Example Reviews to Database
					</button>
				</form>
			{/if}
			<button 
				type="button" 
				class="btn btn-primary" 
				onclick={() => { isAddingReview = true; editingReview = null; }}
			>
				+ Add New Review
			</button>
		</div>
	</div>

	<!-- Live Landing Page Marquee Preview Strip -->
	{#if data.reviews && data.reviews.length > 0}
		<div class="preview-marquee-wrapper">
			<div class="preview-marquee-title">
				<span>👁️ Live Landing Page Marquee Preview (Scrolls on Public Landing Page)</span>
			</div>
			<div class="admin-marquee-container">
				<div class="admin-marquee-track">
					{#each [...data.reviews.filter((r: any) => r.active), ...data.reviews.filter((r: any) => r.active)] as r}
						<div class="review-card preview-card">
							<div class="card-top">
								<div class="author-info">
									<div class="avatar">{r.avatar}</div>
									<div>
										<div class="author-name">{r.name}</div>
										<div class="author-location">{r.location}</div>
									</div>
								</div>
								<div class="stars">
									{'★'.repeat(r.stars)}
								</div>
							</div>
							<p class="quote">"{r.quote}"</p>
							<div class="trip-tag">⚓ {r.trip}</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	<!-- Add New Review Form -->
	{#if isAddingReview}
		<div class="review-form-card glass glow-box">
			<div class="form-card-title">
				<h4>Add New Review</h4>
				<button type="button" class="btn-text-close" onclick={() => isAddingReview = false}>✕ Close</button>
			</div>
			<div class="form-and-preview-split">
				<form method="POST" action="?/addReview" use:enhance={() => {
					return async ({ update, result }) => {
						await update();
						if (result.type === 'success') {
							isAddingReview = false;
						}
					};
				}} class="review-edit-grid">
					<div class="form-group">
						<label for="new-rev-name">Author Name</label>
						<input id="new-rev-name" type="text" name="name" bind:value={newReviewDraft.name} placeholder="e.g. Dave & Sarah M." required class="text-input" />
					</div>
					<div class="form-group">
						<label for="new-rev-location">Location</label>
						<input id="new-rev-location" type="text" name="location" bind:value={newReviewDraft.location} placeholder="e.g. Miami, FL" required class="text-input" />
					</div>
					<div class="form-group">
						<label for="new-rev-trip">Charter / Trip Type</label>
						<select id="new-rev-trip" name="trip" bind:value={newReviewDraft.trip} required class="text-input">
							<option value="" disabled selected>Select a Trip Type...</option>
							{#if data.tripTypes && data.tripTypes.length > 0}
								{#each data.tripTypes as type}
									<option value={type.name}>{type.name}</option>
								{/each}
							{:else}
								<option value="Half-Day Reef Fishing">Half-Day Reef Fishing</option>
								<option value="Full-Day Offshore Deep Sea">Full-Day Offshore Deep Sea</option>
								<option value="Sunset Champagne Cruise">Sunset Champagne Cruise</option>
								<option value="Islamorada Reef Snorkeling">Islamorada Reef Snorkeling</option>
							{/if}
						</select>
					</div>
					<div class="form-group">
						<label for="new-rev-stars">Rating (1-5 Stars)</label>
						<select id="new-rev-stars" name="stars" bind:value={newReviewDraft.stars} class="text-input">
							<option value={5}>5 Stars (★★★★★)</option>
							<option value={4}>4 Stars (★★★★☆)</option>
							<option value={3}>3 Stars (★★★☆☆)</option>
						</select>
					</div>
					<div class="form-group">
						<label for="new-rev-avatar">Avatar Initials</label>
						<input id="new-rev-avatar" type="text" name="avatar" bind:value={newReviewDraft.avatar} placeholder="e.g. DS" class="text-input" maxLength={3} />
					</div>
					<div class="form-group">
						<label for="new-rev-order">Display Order</label>
						<input id="new-rev-order" type="number" name="display_order" value={(data.reviews?.length || 0) + 1} class="text-input" />
					</div>
					<div class="form-group full-width">
						<label for="new-rev-quote">Review Quote</label>
						<textarea id="new-rev-quote" name="quote" rows="3" bind:value={newReviewDraft.quote} placeholder="Write customer review..." required class="text-input"></textarea>
					</div>
					<div class="form-actions full-width">
						<button type="button" class="btn btn-secondary" onclick={() => isAddingReview = false}>Cancel</button>
						<button type="submit" class="btn btn-primary">Save Review</button>
					</div>
				</form>

				<!-- Live Preview Side Box -->
				<div class="live-preview-box">
					<span class="preview-badge">Live Card Preview</span>
					<div class="review-card preview-card-live">
						<div class="card-top">
							<div class="author-info">
								<div class="avatar">{newReviewDraft.avatar || newReviewDraft.name?.substring(0, 2).toUpperCase() || 'AV'}</div>
								<div>
									<div class="author-name">{newReviewDraft.name || 'Author Name'}</div>
									<div class="author-location">{newReviewDraft.location || 'Location, ST'}</div>
								</div>
							</div>
							<div class="stars">
								{'★'.repeat(Number(newReviewDraft.stars) || 5)}
							</div>
						</div>
						<p class="quote">"{newReviewDraft.quote || 'Your customer review quote will render here in real-time.'}"</p>
						<div class="trip-tag">⚓ {newReviewDraft.trip || 'Charter Type'}</div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Existing Reviews Table / List -->
	{#if !data.reviews || data.reviews.length === 0}
		<div class="empty-state glass" style="padding: 2rem; text-align: center;">
			<p>No reviews found in database.</p>
			<form method="POST" action="?/seedReviews" use:enhance style="margin-top: 1rem;">
				<button type="submit" class="btn btn-primary">
					⚡ Seed 10 Example Reviews into Database
				</button>
			</form>
		</div>
	{:else}
		<div class="reviews-list">
			{#each data.reviews as rev}
				{#if editingReview?.id === rev.id}
					<div class="review-form-card glass glow-box inline-edit">
						<div class="form-card-title">
							<h4>Edit Review: {rev.name}</h4>
							<button type="button" class="btn-text-close" onclick={() => editingReview = null}>✕ Cancel</button>
						</div>
						<div class="form-and-preview-split">
							<form method="POST" action="?/updateReview" use:enhance={() => {
								return async ({ update, result }) => {
									await update();
									if (result.type === 'success') {
										editingReview = null;
									}
								};
							}} class="review-edit-grid">
								<input type="hidden" name="id" value={rev.id} />
								<div class="form-group">
									<label for="edit-rev-name-{rev.id}">Author Name</label>
									<input id="edit-rev-name-{rev.id}" type="text" name="name" bind:value={editingReview.name} required class="text-input" />
								</div>
								<div class="form-group">
									<label for="edit-rev-loc-{rev.id}">Location</label>
									<input id="edit-rev-loc-{rev.id}" type="text" name="location" bind:value={editingReview.location} required class="text-input" />
								</div>
								<div class="form-group">
									<label for="edit-rev-trip-{rev.id}">Charter / Trip Type</label>
									<select id="edit-rev-trip-{rev.id}" name="trip" bind:value={editingReview.trip} required class="text-input">
										{#if data.tripTypes && data.tripTypes.length > 0}
											{#each data.tripTypes as type}
												<option value={type.name}>{type.name}</option>
											{/each}
										{:else}
											<option value="Half-Day Reef Fishing">Half-Day Reef Fishing</option>
											<option value="Full-Day Offshore Deep Sea">Full-Day Offshore Deep Sea</option>
											<option value="Sunset Champagne Cruise">Sunset Champagne Cruise</option>
											<option value="Islamorada Reef Snorkeling">Islamorada Reef Snorkeling</option>
										{/if}
									</select>
								</div>
								<div class="form-group">
									<label for="edit-rev-stars-{rev.id}">Rating (1-5 Stars)</label>
									<select id="edit-rev-stars-{rev.id}" name="stars" bind:value={editingReview.stars} class="text-input">
										<option value={5}>5 Stars (★★★★★)</option>
										<option value={4}>4 Stars (★★★★☆)</option>
										<option value={3}>3 Stars (★★★☆☆)</option>
									</select>
								</div>
								<div class="form-group">
									<label for="edit-rev-avatar-{rev.id}">Avatar Initials</label>
									<input id="edit-rev-avatar-{rev.id}" type="text" name="avatar" bind:value={editingReview.avatar} class="text-input" />
								</div>
								<div class="form-group">
									<label for="edit-rev-order-{rev.id}">Display Order</label>
									<input id="edit-rev-order-{rev.id}" type="number" name="display_order" bind:value={editingReview.display_order} class="text-input" />
								</div>
								<div class="form-group full-width">
									<label for="edit-rev-quote-{rev.id}">Review Quote</label>
									<textarea id="edit-rev-quote-{rev.id}" name="quote" rows="3" bind:value={editingReview.quote} required class="text-input"></textarea>
								</div>
								<div class="form-group">
									<label class="toggle-label">
										<input type="checkbox" name="active_checkbox" bind:checked={editingReview.active} />
										<span>Active on Landing Page</span>
									</label>
									<input type="hidden" name="active" value={editingReview.active ? 'true' : 'false'} />
								</div>
								<div class="form-actions full-width">
									<button type="button" class="btn btn-secondary" onclick={() => editingReview = null}>Cancel</button>
									<button type="submit" class="btn btn-primary">Update Review</button>
								</div>
							</form>

							<!-- Live Preview Side Box for Editing -->
							<div class="live-preview-box">
								<span class="preview-badge">Live Card Preview</span>
								<div class="review-card preview-card-live">
									<div class="card-top">
										<div class="author-info">
											<div class="avatar">{editingReview.avatar || editingReview.name?.substring(0, 2).toUpperCase() || 'AV'}</div>
											<div>
												<div class="author-name">{editingReview.name || 'Author Name'}</div>
												<div class="author-location">{editingReview.location || 'Location, ST'}</div>
											</div>
										</div>
										<div class="stars">
											{'★'.repeat(Number(editingReview.stars) || 5)}
										</div>
									</div>
									<p class="quote">"{editingReview.quote || 'Quote preview...'}"</p>
									<div class="trip-tag">⚓ {editingReview.trip || 'Charter Type'}</div>
								</div>
							</div>
						</div>
					</div>
				{:else}
					<div class="review-row" class:inactive={!rev.active}>
						<div class="review-main-info">
							<div class="rev-avatar">{rev.avatar}</div>
							<div class="rev-text-details">
								<div class="rev-author">
									<span class="rev-name">{rev.name}</span>
									<span class="rev-loc">• {rev.location}</span>
									<span class="rev-stars">{'★'.repeat(rev.stars)}</span>
									{#if !rev.active}
										<span class="status-badge inactive">Hidden</span>
									{:else}
										<span class="status-badge active">Active</span>
									{/if}
								</div>
								<p class="rev-quote">"{rev.quote}"</p>
								<div class="rev-trip-tag">⚓ {rev.trip}</div>
							</div>
						</div>
						<div class="review-actions">
							<button 
								type="button" 
								class="btn-action-edit"
								onclick={() => { editingReview = { ...rev }; isAddingReview = false; }}
							>
								Edit
							</button>
							<form method="POST" action="?/toggleReviewActive" use:enhance class="inline-form">
								<input type="hidden" name="id" value={rev.id} />
								<input type="hidden" name="active" value={rev.active ? 'false' : 'true'} />
								<button type="submit" class="btn-action-toggle">
									{rev.active ? 'Hide' : 'Show'}
								</button>
							</form>
							<form method="POST" action="?/deleteReview" use:enhance class="inline-form">
								<input type="hidden" name="id" value={rev.id} />
								<button 
									type="submit" 
									class="btn-danger-action"
									onclick={(e) => {
										if (!confirm(`Are you sure you want to delete this review by ${rev.name}?`)) {
											e.preventDefault();
										}
									}}
								>
									Delete
								</button>
							</form>
						</div>
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</div>
{:else if activeNavSection === 'sec-timings'}


	<div id="sec-timings" class="admin-header section-header">
		<div>
			<span class="subtitle">System Reference</span>
			<h2>System Timings & Background Rules</h2>
			<p class="section-desc">Centralized reference for automated reconfirmation schedules, captain priority windows, and broadcast trigger rules.</p>
		</div>
	</div>

	<div class="timings-grid">
		<!-- Reconfirmation Windows Card -->
		<div class="timing-card glass">
			<div class="timing-card-header">
				<div class="timing-icon">⏳</div>
				<div>
					<h3>Customer Reconfirmation Windows</h3>
					<p class="sub-text">Rules governing group reconfirmation deadlines and automated reminders.</p>
				</div>
			</div>
			<div class="timing-table-wrapper">
				<table class="timing-table">
					<thead>
						<tr>
							<th>Time Until Trip</th>
							<th>Reconfirmation Window</th>
							<th>Automated Reminders</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td><span class="tier-tag tier-blue">&gt; 72 Hours</span></td>
							<td><strong>24 Hours</strong></td>
							<td>At 12h remaining &amp; 2h remaining</td>
						</tr>
						<tr>
							<td><span class="tier-tag tier-amber">48 – 72 Hours</span></td>
							<td><strong>12 Hours</strong></td>
							<td>At 6h remaining &amp; 2h remaining</td>
						</tr>
						<tr>
							<td><span class="tier-tag tier-red">&lt; 24 Hours</span></td>
							<td><strong>2 Hours</strong> (or remaining time)</td>
							<td>At 1h remaining</td>
						</tr>
					</tbody>
				</table>
			</div>
			<div class="card-footer-note">
				ℹ️ <strong>Rule:</strong> If a group fails to reconfirm within their window, their $50 reservation fee is <em>forfeited</em> and a strike is issued. The partner group's fee is <em>held</em> for re-matching.
			</div>
		</div>

		<!-- Captain Promo Code Priority Card -->
		<div class="timing-card glass">
			<div class="timing-card-header">
				<div class="timing-icon">👑</div>
				<div>
					<h3>Captain Promo Code Priority Windows</h3>
					<p class="sub-text">Exclusive head-start duration given to referring captains before general SMS broadcast.</p>
				</div>
			</div>
			<div class="timing-table-wrapper">
				<table class="timing-table">
					<thead>
						<tr>
							<th>Time Until Trip</th>
							<th>Exclusive Priority Head Start</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td><span class="tier-tag tier-purple">&gt; 7 Days Out</span></td>
							<td><strong>12 Hours</strong> exclusive priority</td>
						</tr>
						<tr>
							<td><span class="tier-tag tier-blue">3 – 7 Days Out</span></td>
							<td><strong>6 Hours</strong> exclusive priority</td>
						</tr>
						<tr>
							<td><span class="tier-tag tier-amber">48 – 72 Hours Out</span></td>
							<td><strong>2 Hours</strong> exclusive priority</td>
						</tr>
						<tr>
							<td><span class="tier-tag tier-red">&lt; 48 Hours Out</span></td>
							<td><strong>30 Minutes</strong> exclusive priority</td>
						</tr>
					</tbody>
				</table>
			</div>
			<div class="card-footer-note">
				ℹ️ <strong>Rule:</strong> If the referring captain does not claim the trip within their priority window, the automated text blast fires to all eligible captains.
			</div>
		</div>

		<!-- Half-Booked Upgrade Prompts & Captain Blast Card -->
		<div class="timing-card glass full-width-card">
			<div class="timing-card-header">
				<div class="timing-icon">⚡</div>
				<div>
					<h3>Upgrade Prompts &amp; Captain Blast Automation</h3>
					<p class="sub-text">Automated triggers executed by Inngest background workers.</p>
				</div>
			</div>
			<div class="automation-rules-grid">
				<div class="rule-box">
					<div class="rule-title">
						<span class="rule-badge">Prompt 1</span>
						<h4>72 Hours Pre-Trip</h4>
					</div>
					<p>First prompt sent to Group 1 offering to buy out the remaining half to guarantee the trip if unmatched.</p>
				</div>
				<div class="rule-box">
					<div class="rule-title">
						<span class="rule-badge">Prompt 2</span>
						<h4>48 Hours Pre-Trip</h4>
					</div>
					<p>Final prompt sent to Group 1 to buy out the open slot before the charter listing closes.</p>
				</div>
				<div class="rule-box accent-box">
					<div class="rule-title">
						<span class="rule-badge auto-badge">Auto-Blast</span>
						<h4>Instant Captain Text Blast</h4>
					</div>
					<p>Fires automatically the instant both groups confirm (2-of-2 reconfirmed) or priority window expires. <strong>No admin gate required.</strong></p>
				</div>
			</div>
		</div>
	</div>
{:else if activeNavSection === 'sec-preview-emails'}
	<div id="sec-preview-emails" class="admin-header section-header">
		<div>
			<span class="subtitle">Developer Tools</span>
			<h2>Email Template Previews</h2>
			<p class="section-desc">Live preview container for email templates rendered from <code>/api/preview-emails</code>.</p>
		</div>
		<div>
			<a href="/api/preview-emails" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">
				↗ Open /api/preview-emails in New Tab
			</a>
		</div>
	</div>

	<div class="api-preview-container glass">
		<div class="api-preview-toolbar">
			<span class="toolbar-label">Select Template to Preview:</span>
			<div class="template-selector-pills">
				<button 
					type="button" 
					class="selector-pill" 
					class:active={activeEmailTemplate === ''} 
					onclick={() => activeEmailTemplate = ''}
				>
					📋 Index / All Templates
				</button>
				<button 
					type="button" 
					class="selector-pill" 
					class:active={activeEmailTemplate === 'auth_magic_link'} 
					onclick={() => activeEmailTemplate = 'auth_magic_link'}
				>
					🔑 Auth Magic Link
				</button>
				{#each data.settings as setting}
					{#if setting.email_template}
						<button 
							type="button" 
							class="selector-pill" 
							class:active={activeEmailTemplate === setting.trigger_name} 
							onclick={() => activeEmailTemplate = setting.trigger_name}
						>
							✉️ {formatTriggerName(setting.trigger_name)}
						</button>
					{/if}
				{/each}
			</div>
		</div>
		<div class="iframe-preview-wrapper">
			<iframe 
				src={previewIframeSrc} 
				title="Email Template Preview" 
				class="preview-iframe"
			></iframe>
		</div>
	</div>
{:else if activeNavSection === 'sec-stripe-status'}
	<div id="sec-stripe-status" class="admin-header section-header">
		<div>
			<span class="subtitle">System Diagnostics</span>
			<h2>Stripe API & Account Status</h2>
			<p class="section-desc">Live status, environment mode (Live vs Test/Sandbox), and account ownership details from <code>/api/debug/stripe</code>.</p>
		</div>
		<div>
			<a href="/api/debug/stripe" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">
				↗ Direct Endpoint (/api/debug/stripe)
			</a>
		</div>
	</div>

	<div class="test-runner-container glass">
		<div class="test-runner-header">
			<div>
				<h3>Stripe Connection & Account Summary</h3>
				<p class="sub-text">Overview of Stripe environment mode, account owner, and key setup.</p>
			</div>
			<button 
				type="button" 
				class="btn btn-primary"
				disabled={isFetchingStripe}
				onclick={fetchStripeStatus}
			>
				{isFetchingStripe ? '⏳ Refreshing...' : '🔄 Refresh Status'}
			</button>
		</div>

		{#if isFetchingStripe}
			<div class="test-status-box loading glass">
				<p>Connecting to Stripe API and retrieving account details...</p>
			</div>
		{:else if stripeStatusError}
			<div class="test-status-box error glass">
				<span class="status-icon">❌</span>
				<div>
					<h4>Failed to Connect to Stripe API</h4>
					<p>{stripeStatusError}</p>
				</div>
			</div>
		{:else if stripeStatusResults}
			<!-- Summary Cards Grid -->
			<div class="stripe-summary-grid">
				<div class="stripe-summary-card glass">
					<span class="card-meta-label">ENVIRONMENT MODE</span>
					<div class="card-main-val">
						{#if stripeStatusResults.stripe?.account?.isLive}
							<span class="mode-badge mode-live">🔴 Live / Production Mode</span>
						{:else if stripeStatusResults.stripe?.account?.isMock}
							<span class="mode-badge mode-mock">🛠️ Mock / Unconfigured</span>
						{:else}
							<span class="mode-badge mode-test">🧪 Test / Sandbox Mode</span>
						{/if}
					</div>
					<p class="card-desc">
						{#if stripeStatusResults.stripe?.account?.isLive}
							Real payments and charges are active on this account.
						{:else if stripeStatusResults.stripe?.account?.isMock}
							Using development fallback mock keys.
						{:else}
							Test credit cards allowed. No real money will be charged.
						{/if}
					</p>
				</div>

				<div class="stripe-summary-card glass">
					<span class="card-meta-label">ACCOUNT OWNER / BUSINESS</span>
					<div class="card-main-val owner-name">
						{stripeStatusResults.stripe?.account?.accountOwner || stripeStatusResults.stripe?.account?.businessName || 'N/A'}
					</div>
					<p class="card-desc">
						Account ID: <code>{stripeStatusResults.stripe?.account?.accountId || 'Not Connected'}</code>
						{#if stripeStatusResults.stripe?.account?.email}
							<br />Email: <code>{stripeStatusResults.stripe?.account?.email}</code>
						{/if}
					</p>
				</div>

				<div class="stripe-summary-card glass">
					<span class="card-meta-label">CHARGES & PAYOUTS</span>
					<div class="card-main-val">
						{#if stripeStatusResults.stripe?.account?.chargesEnabled}
							<span class="status-pill status-active">✅ Charges Enabled</span>
						{:else}
							<span class="status-pill status-disabled">⚠️ Charges Disabled</span>
						{/if}
					</div>
					<p class="card-desc">
						Payouts: {stripeStatusResults.stripe?.account?.payoutsEnabled ? 'Enabled ✅' : 'Disabled / Restricted ⚠️'}
						<br />
						Country: {stripeStatusResults.stripe?.account?.country?.toUpperCase() || 'US'}
					</p>
				</div>

				<div class="stripe-summary-card glass">
					<span class="card-meta-label">PUBLISHABLE KEY CONFIG</span>
					<div class="card-main-val">
						{#if stripeStatusResults.stripe?.publishableKeyConfigured}
							<span class="status-pill status-active">Configured ({stripeStatusResults.stripe?.publishableKeyPrefix})</span>
						{:else}
							<span class="status-pill status-disabled">Missing / Placeholder</span>
						{/if}
					</div>
					<p class="card-desc">Prefix matches loaded environment credentials.</p>
				</div>
			</div>

			<div class="test-results-output" style="margin-top: 1.5rem;">
				<span class="output-label">Raw Diagnostic Response:</span>
				<pre class="json-code"><code>{JSON.stringify(stripeStatusResults, null, 2)}</code></pre>
			</div>
		{/if}

		<div class="iframe-preview-wrapper" style="margin-top: 1.5rem;">
			<div class="iframe-title">Live Endpoint View: <code>/api/debug/stripe</code></div>
			<iframe 
				src="/api/debug/stripe" 
				title="Stripe Status Direct View" 
				class="preview-iframe"
				style="height: 300px;"
			></iframe>
		</div>
	</div>
{/if}

<style>

	.api-preview-container, .test-runner-container {
		border: 1px solid var(--border-light);
		padding: 1.5rem;
		border-radius: 12px;
		background: var(--input-bg);
		margin-bottom: 4rem;
	}
	.api-preview-toolbar {
		margin-bottom: 1.25rem;
	}
	.toolbar-label {
		display: block;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-secondary);
		margin-bottom: 0.5rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.template-selector-pills {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.selector-pill {
		background: var(--bg-surface);
		color: var(--text-secondary);
		border: 1px solid var(--border-light);
		font-size: 0.82rem;
		padding: 6px 14px;
		border-radius: 20px;
		cursor: pointer;
		transition: all 0.2s ease;
	}
	.selector-pill:hover {
		color: var(--text-primary);
		border-color: var(--primary);
	}
	.selector-pill.active {
		background: var(--input-focus-bg);
		color: var(--primary);
		border-color: var(--border-glow);
		font-weight: 600;
	}
	.iframe-preview-wrapper {
		border: 1px solid var(--border-light);
		border-radius: 8px;
		overflow: hidden;
		background: var(--bg-base);
	}
	.iframe-title {
		padding: 0.5rem 1rem;
		font-size: 0.85rem;
		color: var(--text-secondary);
		border-bottom: 1px solid var(--border-light);
		background: var(--bg-surface);
	}
	.preview-iframe {
		width: 100%;
		height: 650px;
		border: none;
		background: var(--bg-base);
	}
	.test-runner-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
		gap: 1rem;
	}
	.test-status-box {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.25rem;
		border-radius: 8px;
		border: 1px solid var(--border-light);
		margin-bottom: 1.25rem;
	}
	.test-status-box.success {
		border-color: rgba(34, 197, 94, 0.4);
		background: rgba(34, 197, 94, 0.08);
	}
	.test-status-box.error {
		border-color: rgba(239, 68, 68, 0.4);
		background: rgba(239, 68, 68, 0.08);
	}
	.test-status-box.loading {
		border-color: rgba(56, 189, 248, 0.4);
		background: rgba(56, 189, 248, 0.08);
	}
	.status-icon {
		font-size: 1.5rem;
	}
	.test-results-output {
		background: var(--bg-base);
		border: 1px solid var(--border-light);
		border-radius: 8px;
		padding: 1rem;
		margin-bottom: 1.5rem;
	}
	.stripe-summary-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 1rem;
		margin-bottom: 1.5rem;
	}
	.stripe-summary-card {
		padding: 1.25rem;
		border-radius: 10px;
		border: 1px solid var(--border-light);
		background: var(--bg-surface);
	}
	.card-meta-label {
		display: block;
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--text-secondary);
		letter-spacing: 0.05em;
		margin-bottom: 0.5rem;
	}
	.card-main-val {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 0.4rem;
	}
	.owner-name {
		word-break: break-word;
	}
	.card-desc {
		font-size: 0.82rem;
		color: var(--text-secondary);
		margin: 0;
		line-height: 1.4;
	}
	.mode-badge {
		display: inline-block;
		padding: 4px 12px;
		border-radius: 20px;
		font-size: 0.85rem;
		font-weight: 600;
	}
	.mode-live {
		background: rgba(239, 68, 68, 0.15);
		color: #ef4444;
		border: 1px solid rgba(239, 68, 68, 0.3);
	}
	.mode-test {
		background: rgba(56, 189, 248, 0.15);
		color: var(--primary);
		border: 1px solid var(--border-glow);
	}
	.mode-mock {
		background: rgba(245, 158, 11, 0.15);
		color: #f59e0b;
		border: 1px solid rgba(245, 158, 11, 0.3);
	}
	.status-pill {
		font-size: 0.88rem;
		font-weight: 600;
	}
	.status-pill.status-active {
		color: #22c55e;
	}
	.status-pill.status-disabled {
		color: #ef4444;
	}
	.output-label {
		display: block;
		font-size: 0.8rem;
		color: var(--text-secondary);
		margin-bottom: 0.5rem;
		font-family: monospace;
	}
	.json-code {
		margin: 0;
		color: var(--text-primary);
		font-size: 0.88rem;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.reviews-mgmt-container {
		border: 1px solid var(--border-light);
		padding: 2rem;
		border-radius: 8px;
		background: var(--input-bg);
		margin-bottom: 4rem;
	}
	.reviews-mgmt-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}
	.reviews-mgmt-header h3 {
		font-size: 1.2rem;
		font-weight: 700;
		color: var(--text-primary);
	}
	.review-form-card {
		padding: 1.5rem;
		border: 1px solid var(--border-light);
		border-radius: 8px;
		background: var(--bg-surface);
		margin-bottom: 1.5rem;
	}
	.form-card-title {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		border-bottom: 1px solid var(--border-light);
		padding-bottom: 0.5rem;
	}
	.form-card-title h4 {
		font-size: 1.05rem;
		font-weight: 700;
		color: var(--primary);
	}
	.btn-text-close {
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		font-size: 0.85rem;
	}
	.btn-text-close:hover {
		color: var(--text-primary);
	}
	.review-edit-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}
	.review-edit-grid .full-width {
		grid-column: 1 / -1;
	}
	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}
	.reviews-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.review-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.25rem;
		background: var(--bg-surface);
		border: 1px solid var(--border-light);
		border-radius: 8px;
		gap: 1.5rem;
		transition: background 0.2s ease;
	}
	.review-row:hover {
		background: var(--input-focus-bg);
	}
	.review-row.inactive {
		opacity: 0.55;
	}
	.review-main-info {
		display: flex;
		gap: 1rem;
		align-items: flex-start;
		flex: 1;
	}
	.rev-avatar {
		width: 42px;
		height: 42px;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--primary), var(--secondary));
		color: #fff;
		font-weight: 700;
		font-size: 0.9rem;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	.rev-text-details {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.rev-author {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.rev-name {
		font-weight: 700;
		color: var(--text-primary);
		font-size: 0.95rem;
	}
	.rev-loc {
		color: var(--text-secondary);
		font-size: 0.85rem;
	}
	.rev-stars {
		color: var(--accent);
		font-size: 0.85rem;
	}
	.status-badge {
		font-size: 0.7rem;
		font-weight: 700;
		padding: 2px 6px;
		border-radius: 4px;
		text-transform: uppercase;
	}
	.status-badge.active {
		background: rgba(16, 185, 129, 0.15);
		color: var(--success);
		border: 1px solid rgba(16, 185, 129, 0.3);
	}
	.status-badge.inactive {
		background: rgba(148, 163, 184, 0.15);
		color: var(--text-muted);
		border: 1px solid rgba(148, 163, 184, 0.3);
	}
	.rev-quote {
		font-size: 0.9rem;
		color: var(--text-secondary);
		font-style: italic;
		line-height: 1.4;
	}
	.rev-trip-tag {
		font-size: 0.75rem;
		color: var(--primary);
		font-weight: 600;
	}
	.review-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}
	.inline-form {
		display: inline;
	}
	.btn-action-edit {
		background: rgba(56, 189, 248, 0.1);
		color: #38bdf8;
		border: 1px solid rgba(56, 189, 248, 0.25);
		font-size: 0.8rem;
		padding: 4px 10px;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s;
	}
	.btn-action-edit:hover {
		background: #38bdf8;
		color: #000;
	}
	.btn-action-toggle {
		background: rgba(255, 255, 255, 0.05);
		color: var(--text-secondary);
		border: 1px solid var(--border-light);
		font-size: 0.8rem;
		padding: 4px 10px;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s;
	}
	.btn-action-toggle:hover {
		background: rgba(255, 255, 255, 0.1);
		color: var(--text-primary);
	}

	.divider-main {
		margin: 4rem 0 3rem 0;
		height: 1px;
		background: linear-gradient(90deg, transparent, var(--border-light), transparent);
	}
	.section-header {
		margin-bottom: 1.5rem;
	}
	.section-header h2 {
		font-size: 1.75rem;
		font-weight: 800;
		margin-top: 0.25rem;
	}
	.section-desc {
		font-size: 0.95rem;
		color: var(--text-secondary);
		margin-top: 0.25rem;
	}
	.trip-types-container {
		border: 1px solid var(--border-light);
		padding: 2.5rem;
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.01);
		margin-bottom: 4rem;
	}
	.trip-types-grid {
		display: grid;
		grid-template-columns: 1fr 2fr;
		gap: 3rem;
	}
	.trip-types-grid h3 {
		font-size: 1.15rem;
		font-weight: 700;
		margin-bottom: 1rem;
		color: var(--text-primary);
	}
	.type-form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	.text-input {
		width: 100%;
		padding: 10px 12px;
		font-size: 0.9rem;
		background: var(--input-bg);
		border: 1px solid var(--border-light);
		border-radius: 6px;
		color: var(--text-primary);
		font-family: var(--font-body);
		transition: border-color 0.2s;
	}
	.text-input:focus {
		border-color: var(--primary);
		outline: none;
	}
	.types-table {
		border: 1px solid var(--border-light);
		border-radius: 6px;
		overflow: hidden;
		max-height: 400px;
		overflow-y: auto;
	}
	.type-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1.5rem;
		border-bottom: 1px solid var(--border-light);
		transition: background-color 0.2s;
	}
	.type-row:last-child {
		border-bottom: none;
	}
	.type-row:hover {
		background: rgba(255, 255, 255, 0.02);
	}
	.type-name {
		font-weight: 600;
		font-size: 0.95rem;
		color: var(--text-primary);
	}
	.empty-msg {
		color: var(--text-muted);
		font-style: italic;
		font-size: 0.9rem;
	}
	.btn-danger-action {
		background: rgba(239, 68, 68, 0.1);
		color: var(--danger);
		border: 1px solid rgba(239, 68, 68, 0.2);
		font-size: 0.8rem;
		padding: 4px 10px;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s;
	}
	.btn-danger-action:hover {
		background: var(--danger);
		color: #fff;
		border-color: var(--danger);
	}

	.admin-header {
		margin-bottom: 2.5rem;
	}
	.subtitle {
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 1.5px;
		color: var(--primary);
		font-weight: 700;
	}
	.admin-header h1 {
		font-size: 2.25rem;
		font-weight: 800;
		letter-spacing: -0.5px;
		margin-top: 0.25rem;
	}

	.settings-grid {
		display: grid;
		grid-template-columns: 280px 1fr;
		gap: 2rem;
		margin-bottom: 3rem;
		align-items: start;
	}

	/* Sidebar Styles */
	.template-sidebar {
		border: 1px solid var(--border-light);
		border-radius: 8px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}
	.sidebar-header {
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid var(--border-light);
		background: rgba(255, 255, 255, 0.02);
	}
	.sidebar-header h3 {
		font-size: 1rem;
		font-weight: 700;
		margin: 0;
		color: var(--text-primary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	.sidebar-list {
		display: flex;
		flex-direction: column;
		max-height: 550px;
		overflow-y: auto;
	}
	.sidebar-item {
		width: 100%;
		text-align: left;
		padding: 0.6rem 1rem;
		background: transparent;
		border: none;
		border-bottom: 1px solid var(--border-light);
		border-radius: 0;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 4px;
		transition: all 0.2s ease;
	}
	.sidebar-item:last-child {
		border-bottom: none;
	}
	.sidebar-item:hover {
		background: rgba(255, 255, 255, 0.03);
	}
	.sidebar-item.active {
		background: rgba(6, 182, 212, 0.08);
		border-left: 3px solid var(--primary);
		padding-left: calc(1rem - 3px);
	}
	.item-title {
		font-weight: 600;
		font-size: 0.88rem;
		color: var(--text-primary);
	}
	.sidebar-item.active .item-title {
		color: var(--primary);
	}
	.item-meta {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.72rem;
		color: var(--text-muted);
	}
	.meta-code {
		font-family: monospace;
	}
	.status-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: rgba(239, 68, 68, 0.4);
		border: 1px solid rgba(239, 68, 68, 0.6);
		display: inline-block;
		flex-shrink: 0;
	}
	.status-dot.enabled {
		background: var(--success);
		box-shadow: 0 0 8px var(--success);
		border-color: rgba(16, 185, 129, 0.5);
	}

	.template-detail {
		display: flex;
		flex-direction: column;
	}

	.empty-state {
		padding: 3rem;
		text-align: center;
		border-radius: 8px;
		border: 1px dashed var(--border-light);
		color: var(--text-muted);
	}

	.template-card {
		border: 1px solid var(--border-light);
		display: flex;
		flex-direction: column;
	}
	.card-header {
		padding: 1.5rem 2rem;
		border-bottom: 1px solid var(--border-light);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.card-header h2 {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text-primary);
	}
	.code-ref {
		font-family: monospace;
		font-size: 0.75rem;
		color: var(--text-muted);
		background: rgba(255, 255, 255, 0.03);
		padding: 2px 8px;
		border-radius: 4px;
		border: 1px solid var(--border-light);
	}

	.card-body {
		padding: 2rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		flex-grow: 1;
	}

	.channels-row {
		display: flex;
		gap: 2rem;
	}
	.toggle-group {
		display: flex;
		align-items: center;
	}
	.toggle-label {
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	.toggle-label input[type="checkbox"] {
		width: 18px;
		height: 18px;
		cursor: pointer;
		accent-color: var(--primary);
	}

	.divider {
		height: 1px;
		background: var(--border-light);
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
		transition: opacity 0.2s ease;
	}
	.form-group.disabled {
		opacity: 0.4;
	}
	.form-group label {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-secondary);
	}
	.form-group textarea {
		width: 100%;
		padding: 10px 12px;
		font-size: 0.9rem;
		line-height: 1.5;
		resize: vertical;
		font-family: var(--font-body);
	}

	.placeholders-info {
		background: rgba(255, 255, 255, 0.01);
		border: 1px solid var(--border-light);
		padding: 1rem;
		border-radius: 6px;
	}
	.info-title {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-secondary);
		display: block;
		margin-bottom: 8px;
	}
	.placeholders-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.ph-chip {
		font-size: 0.72rem;
		color: var(--primary);
		background: rgba(6, 182, 212, 0.05);
		border: 1px solid rgba(6, 182, 212, 0.12);
		padding: 2px 6px;
		border-radius: 4px;
	}

	.card-footer {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 1rem;
		margin-top: auto;
		padding-top: 1rem;
	}
	.status-alert {
		font-size: 0.85rem;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 4px;
	}
	.success-msg {
		color: var(--success);
	}

	.btn {
		font-size: 0.9rem;
		padding: 8px 16px;
	}

	.alert-error {
		padding: 1rem;
		margin-bottom: 2rem;
		border-radius: 6px;
		border: 1px solid rgba(239, 68, 68, 0.2);
		color: var(--danger);
	}

	.sub-text {
		font-size: 0.85rem;
		color: var(--text-secondary);
		margin-top: 0.25rem;
	}
	.header-btns {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}
	.form-and-preview-split {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 1.5rem;
		align-items: start;
	}
	.live-preview-box {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		background: var(--input-bg);
		border: 1px dashed var(--border-light);
		border-radius: 8px;
	}
	.preview-badge {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--primary);
	}
	.review-card {
		width: 100%;
		background: var(--glass-bg);
		border: 1px solid var(--border-light);
		border-radius: 12px;
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.card-top {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}
	.author-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.avatar {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--primary), var(--secondary));
		color: #ffffff;
		font-weight: 700;
		font-size: 0.8rem;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	.author-name {
		font-size: 0.9rem;
		font-weight: 700;
		color: var(--text-primary);
		line-height: 1.2;
	}
	.author-location {
		font-size: 0.75rem;
		color: var(--text-secondary);
	}
	.stars {
		display: flex;
		gap: 2px;
		color: var(--accent);
		font-size: 0.85rem;
	}
	.quote {
		font-size: 0.85rem;
		line-height: 1.4;
		color: var(--text-secondary);
		font-style: italic;
	}
	.trip-tag {
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--primary);
		background: rgba(6, 182, 212, 0.1);
		padding: 4px 8px;
		border-radius: 6px;
		align-self: flex-start;
	}
	.preview-marquee-wrapper {
		background: var(--bg-surface);
		border: 1px solid var(--border-light);
		border-radius: 8px;
		padding: 1rem;
		margin-bottom: 1.5rem;
	}
	.preview-marquee-title {
		font-size: 0.8rem;
		font-weight: 700;
		color: #38bdf8;
		margin-bottom: 0.75rem;
	}
	.admin-marquee-container {
		width: 100%;
		overflow: hidden;
		mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
		-webkit-mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
	}
	.admin-marquee-track {
		display: flex;
		gap: 1rem;
		width: max-content;
		animation: adminMarquee 35s linear infinite;
	}
	.admin-marquee-container:hover .admin-marquee-track {
		animation-play-state: paused;
	}
	.preview-card {
		width: 280px;
		flex-shrink: 0;
	}
	@keyframes adminMarquee {
		0% { transform: translateX(0%); }
		100% { transform: translateX(-50%); }
	}
	.sticky-nav-bar-wrapper {
		position: relative;
		padding: 0.75rem 0;
		margin-bottom: 2rem;
		border-bottom: 1px solid var(--border-light);
	}
	.settings-nav-pills {
		display: flex;
		gap: 0.75rem;
		padding: 0.4rem 0.6rem;
		border: 1px solid var(--border-light);
		border-radius: 30px;
		background: var(--bg-surface);
		width: max-content;
		max-width: 100%;
		flex-wrap: wrap;
		box-shadow: var(--glass-shadow);
	}
	.nav-pill-btn {
		background: transparent;
		color: var(--text-secondary);
		border: 1px solid transparent;
		font-size: 0.88rem;
		font-weight: 600;
		padding: 8px 18px;
		border-radius: 20px;
		cursor: pointer;
		transition: all 0.2s ease;
	}
	.nav-pill-btn:hover {
		color: var(--text-primary);
		background: var(--input-focus-bg);
	}
	.nav-pill-btn.active {
		background: var(--input-focus-bg);
		color: var(--primary);
		border-color: var(--border-glow);
		box-shadow: 0 0 12px var(--border-glow);
	}
	.section-pulse-highlight {
		animation: sectionPulse 2s cubic-bezier(0.4, 0, 0.2, 1);
		border-radius: 12px;
	}
	@keyframes sectionPulse {
		0% {
			outline: 3px solid var(--primary);
			box-shadow: 0 0 30px rgba(56, 189, 248, 0.5);
		}
		100% {
			outline: 3px solid transparent;
			box-shadow: 0 0 0 rgba(56, 189, 248, 0);
		}
	}
	.timings-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
		gap: 1.5rem;
		margin-bottom: 3rem;
	}
	.timing-card {
		border: 1px solid var(--border-light);
		background: var(--input-bg);
		border-radius: 12px;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	.full-width-card {
		grid-column: 1 / -1;
	}
	.timing-card-header {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	.timing-icon {
		font-size: 1.75rem;
		background: var(--bg-surface);
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 10px;
		border: 1px solid var(--border-light);
	}
	.timing-card-header h3 {
		margin: 0;
		font-size: 1.15rem;
		color: var(--text-primary);
	}
	.sub-text {
		margin: 0;
		font-size: 0.85rem;
		color: var(--text-secondary);
	}
	.timing-table-wrapper {
		overflow-x: auto;
	}
	.timing-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}
	.timing-table th, .timing-table td {
		padding: 0.75rem 1rem;
		text-align: left;
		border-bottom: 1px solid var(--border-light);
	}
	.timing-table th {
		color: var(--text-secondary);
		font-weight: 600;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.tier-tag {
		display: inline-block;
		padding: 0.25rem 0.6rem;
		border-radius: 6px;
		font-size: 0.8rem;
		font-weight: 600;
	}
	.tier-blue { background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }
	.tier-amber { background: rgba(251, 191, 36, 0.15); color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.3); }
	.tier-red { background: rgba(248, 113, 113, 0.15); color: #f87171; border: 1px solid rgba(248, 113, 113, 0.3); }
	.tier-purple { background: rgba(192, 132, 252, 0.15); color: #c084fc; border: 1px solid rgba(192, 132, 252, 0.3); }

	.card-footer-note {
		font-size: 0.85rem;
		color: var(--text-secondary);
		background: var(--bg-surface);
		padding: 0.75rem 1rem;
		border-radius: 8px;
		border-left: 3px solid var(--primary);
	}
	.automation-rules-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 1rem;
	}
	.rule-box {
		background: var(--bg-surface);
		border: 1px solid var(--border-light);
		padding: 1.25rem;
		border-radius: 10px;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.rule-box.accent-box {
		border-color: rgba(56, 189, 248, 0.4);
		background: rgba(56, 189, 248, 0.05);
	}
	.rule-title {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.rule-title h4 {
		margin: 0;
		font-size: 0.95rem;
		color: var(--text-primary);
	}
	.rule-badge {
		font-size: 0.75rem;
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
		background: var(--input-bg);
		color: var(--text-secondary);
		font-weight: 600;
		border: 1px solid var(--border-light);
	}
	.auto-badge {
		background: rgba(56, 189, 248, 0.2);
		color: #38bdf8;
		border-color: rgba(56, 189, 248, 0.4);
	}
	.rule-box p {
		margin: 0;
		font-size: 0.85rem;
		color: var(--text-secondary);
		line-height: 1.4;
	}
	@media (max-width: 992px) {
		.settings-grid {
			grid-template-columns: 1fr;
		}
		.form-and-preview-split {
			grid-template-columns: 1fr;
		}
		.timings-grid {
			grid-template-columns: 1fr;
		}
	}
</style>

