<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

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

	let activeTab = $state<'notifications' | 'trip-types' | 'reviews'>('notifications');

	$effect(() => {
		const tabFromUrl = $page.url.searchParams.get('tab');
		if (tabFromUrl === 'trip-types' || tabFromUrl === 'reviews' || tabFromUrl === 'notifications') {
			activeTab = tabFromUrl;
		} else if (data.activeTab === 'trip-types' || data.activeTab === 'reviews' || data.activeTab === 'notifications') {
			activeTab = data.activeTab;
		}

		if (!selectedId && data.settings?.length > 0) {
			selectedId = data.settings[0].id;
		}
	});

	function switchTab(tab: 'notifications' | 'trip-types' | 'reviews') {
		activeTab = tab;
		const url = new URL(window.location.href);
		url.searchParams.set('tab', tab);
		goto(url.pathname + url.search, { replaceState: true, keepFocus: true, noScroll: true });
	}

	const selectedSetting = $derived(data.settings?.find((s: any) => s.id === selectedId));

	const triggerPlaceholders: Record<string, string[]> = {
		admin_trip_cancellation: ['{customer_name}', '{trip_date}', '{trip_type}', '{cancellation_reason}', '{refund_status_text}', '{dashboard_url}'],
		reservation_pending_match: ['{customer_name}', '{trip_date}', '{trip_type}', '{dashboard_url}'],
		match_detected: ['{customer_name}', '{trip_date}', '{trip_type}', '{dashboard_url}'],
		match_auto_reconfirmed: ['{customer_name}', '{trip_date}', '{trip_type}', '{dashboard_url}'],
		reconfirm_reminder: ['{customer_name}', '{trip_date}', '{deadline_time}', '{dashboard_url}'],
		reconfirm_forfeited: ['{customer_name}', '{trip_date}'],
		counterpart_forfeited: ['{customer_name}', '{trip_date}'],
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
	<title>Admin Settings — SplitACharter</title>
</svelte:head>

<div class="admin-header">
	<div class="header-titles">
		<span class="subtitle">Platform Operations</span>
		<h1>Admin Settings</h1>
	</div>

	<!-- Modern Sub-Navigation Settings Tab Bar -->
	<div class="settings-subnav glass">
		<button 
			type="button" 
			class="subnav-tab" 
			class:active={activeTab === 'notifications'} 
			onclick={() => switchTab('notifications')}
		>
			<span class="tab-icon">🔔</span>
			<span class="tab-label">Notifications</span>
			{#if data.settings?.length}
				<span class="tab-badge">{data.settings.length}</span>
			{/if}
		</button>
		<button 
			type="button" 
			class="subnav-tab" 
			class:active={activeTab === 'trip-types'} 
			onclick={() => switchTab('trip-types')}
		>
			<span class="tab-icon">⚓</span>
			<span class="tab-label">Trip Types</span>
			{#if data.tripTypes?.length}
				<span class="tab-badge">{data.tripTypes.length}</span>
			{/if}
		</button>
		<button 
			type="button" 
			class="subnav-tab" 
			class:active={activeTab === 'reviews'} 
			onclick={() => switchTab('reviews')}
		>
			<span class="tab-icon">⭐</span>
			<span class="tab-label">Landing Reviews</span>
			{#if data.reviews?.length}
				<span class="tab-badge">{data.reviews.length}</span>
			{/if}
		</button>
	</div>
</div>

{#if activeTab === 'notifications'}
	{#if form?.message}
		<div class="alert alert-error glass">
			<p>{form.message}</p>
		</div>
	{/if}

	<div class="settings-grid">
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
						action="?/saveTemplate&tab=notifications"
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
{:else if activeTab === 'trip-types'}
	<div class="section-header">
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
				<form method="POST" action="?/addTripType&tab=trip-types" use:enhance class="type-form">
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
								<form method="POST" action="?/deleteTripType&tab=trip-types" use:enhance class="delete-form">
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
{:else if activeTab === 'reviews'}
	<div class="section-header">
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
					<form method="POST" action="?/seedReviews&tab=reviews" use:enhance>
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
					<form method="POST" action="?/addReview&tab=reviews" use:enhance={() => {
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
								<option value="" disabled selected={!newReviewDraft.trip}>Select base Trip Type...</option>
								{#each data.availableTripTypes || [] as typeName}
									<option value={typeName}>{typeName}</option>
								{/each}
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
				<form method="POST" action="?/seedReviews&tab=reviews" use:enhance style="margin-top: 1rem;">
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
								<form method="POST" action="?/updateReview&tab=reviews" use:enhance={() => {
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
											{#if editingReview.trip && !(data.availableTripTypes || []).includes(editingReview.trip)}
												<option value={editingReview.trip}>{editingReview.trip}</option>
											{/if}
											{#each data.availableTripTypes || [] as typeName}
												<option value={typeName}>{typeName}</option>
											{/each}
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
								<form method="POST" action="?/toggleReviewActive&tab=reviews" use:enhance class="inline-form">
									<input type="hidden" name="id" value={rev.id} />
									<input type="hidden" name="active" value={rev.active ? 'false' : 'true'} />
									<button type="submit" class="btn-action-toggle">
										{rev.active ? 'Hide' : 'Show'}
									</button>
								</form>
								<form method="POST" action="?/deleteReview&tab=reviews" use:enhance class="inline-form">
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
{/if}

<style>
	.admin-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		margin-bottom: 2rem;
		gap: 1.5rem;
		flex-wrap: wrap;
	}
	.header-titles {
		display: flex;
		flex-direction: column;
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
	.settings-subnav {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		padding: 5px;
		background: rgba(15, 23, 42, 0.7);
		border: 1px solid var(--border-light);
		border-radius: 12px;
	}
	.subnav-tab {
		display: flex;
		align-items: center;
		gap: 8px;
		background: transparent;
		color: var(--text-secondary);
		border: 1px solid transparent;
		font-size: 0.88rem;
		font-weight: 600;
		padding: 8px 16px;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
		font-family: var(--font-body);
	}
	.subnav-tab:hover {
		color: var(--text-primary);
		background: rgba(255, 255, 255, 0.05);
	}
	.subnav-tab.active {
		background: rgba(56, 189, 248, 0.15);
		color: #38bdf8;
		border-color: rgba(56, 189, 248, 0.35);
		box-shadow: 0 0 16px rgba(56, 189, 248, 0.2);
	}
	.tab-icon {
		font-size: 1rem;
	}
	.tab-badge {
		font-size: 0.72rem;
		font-weight: 700;
		padding: 2px 7px;
		border-radius: 10px;
		background: rgba(255, 255, 255, 0.08);
		color: var(--text-secondary);
	}
	.subnav-tab.active .tab-badge {
		background: rgba(56, 189, 248, 0.25);
		color: #38bdf8;
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

	.reviews-mgmt-container {
		border: 1px solid var(--border-light);
		padding: 2rem;
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.01);
		margin-bottom: 2rem;
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
		background: rgba(15, 23, 42, 0.6);
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
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid var(--border-light);
		border-radius: 8px;
		gap: 1.5rem;
		transition: background 0.2s ease;
	}
	.review-row:hover {
		background: rgba(255, 255, 255, 0.04);
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
		color: #f8fafc;
		font-size: 0.95rem;
	}
	.rev-loc {
		color: var(--text-secondary);
		font-size: 0.85rem;
	}
	.rev-stars {
		color: #f59e0b;
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
		color: #cbd5e1;
		font-style: italic;
		line-height: 1.4;
	}
	.rev-trip-tag {
		font-size: 0.75rem;
		color: #38bdf8;
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

	.trip-types-container {
		border: 1px solid var(--border-light);
		padding: 2.5rem;
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.01);
		margin-bottom: 2rem;
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
		background: rgba(0, 0, 0, 0.2);
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

	.settings-grid {
		display: grid;
		grid-template-columns: 280px 1fr;
		gap: 2rem;
		margin-bottom: 2rem;
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
		background: rgba(0, 0, 0, 0.3);
		border: 1px dashed rgba(56, 189, 248, 0.3);
		border-radius: 8px;
	}
	.preview-badge {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: #38bdf8;
	}
	.review-card {
		width: 100%;
		background: #111a2e;
		border: 1px solid rgba(255, 255, 255, 0.08);
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
		color: #f1f5f9;
		line-height: 1.2;
	}
	.author-location {
		font-size: 0.75rem;
		color: var(--text-secondary);
	}
	.stars {
		display: flex;
		gap: 2px;
		color: #f59e0b;
		font-size: 0.85rem;
	}
	.quote {
		font-size: 0.85rem;
		line-height: 1.4;
		color: #cbd5e1;
		font-style: italic;
	}
	.trip-tag {
		font-size: 0.72rem;
		font-weight: 600;
		color: #38bdf8;
		background: rgba(56, 189, 248, 0.1);
		padding: 4px 8px;
		border-radius: 6px;
		align-self: flex-start;
	}
	.preview-marquee-wrapper {
		background: #090f1d;
		border: 1px solid rgba(56, 189, 248, 0.2);
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

	@media (max-width: 992px) {
		.admin-header {
			flex-direction: column;
			align-items: flex-start;
		}
		.settings-subnav {
			width: 100%;
			overflow-x: auto;
		}
		.subnav-tab {
			flex: 1;
			justify-content: center;
		}
		.settings-grid {
			grid-template-columns: 1fr;
		}
		.form-and-preview-split {
			grid-template-columns: 1fr;
		}
	}
</style>
