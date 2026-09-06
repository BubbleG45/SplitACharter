<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import PhotoCarousel from '$lib/components/PhotoCarousel.svelte';

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

	// Carousel Management States
	let editingSlide = $state<any | null>(null);
	let isAddingSlide = $state(false);
	let newSlideDraft = $state({
		title: '',
		caption: '',
		image_url: '',
		link_url: '',
		link_text: '',
		display_order: 1,
		object_position: 'center'
	});
	let addSlideMode = $state<'file' | 'url'>('file');
	let addSlidePreview = $state<string | null>(null);
	let addSlideError = $state<string | null>(null);

	let editSlideMode = $state<'keep' | 'file' | 'url'>('keep');
	let editSlidePreview = $state<string | null>(null);
	let editSlideError = $state<string | null>(null);

	const positionOptions = [
		{ id: 'center', label: '↔️ Center (Balanced)', value: 'center' },
		{ id: 'top', label: '⬆️ Top Focus (Keep sky / masts)', value: 'top' },
		{ id: 'bottom', label: '⬇️ Bottom Focus (Keep deck / water)', value: 'bottom' },
		{ id: 'left', label: '⬅️ Left Focus', value: 'left center' },
		{ id: 'right', label: '➡️ Right Focus', value: 'right center' }
	];

	function startAddSlide() {
		isAddingSlide = true;
		editingSlide = null;
		addSlidePreview = null;
		addSlideError = null;
		newSlideDraft = {
			title: '',
			caption: '',
			image_url: '',
			link_url: '',
			link_text: '',
			display_order: (data.carouselSlides?.length || 0) + 1,
			object_position: 'center'
		};
		setTimeout(() => {
			const el = document.getElementById('slide-form-anchor');
			if (el) {
				el.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
		}, 60);
	}

	function startEditSlide(slide: any) {
		editingSlide = { ...slide, object_position: slide.object_position || 'center' };
		isAddingSlide = false;
		editSlideMode = 'keep';
		editSlidePreview = null;
		editSlideError = null;
		setTimeout(() => {
			const el = document.getElementById('slide-form-anchor');
			if (el) {
				el.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
		}, 60);
	}

	function handleAddImageChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		addSlideError = null;
		if (!file) {
			addSlidePreview = null;
			return;
		}
		const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/jpg'];
		if (!allowed.includes(file.type)) {
			addSlideError = 'Invalid image format. Allowed: JPG, PNG, WEBP, AVIF.';
			target.value = '';
			addSlidePreview = null;
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			addSlideError = 'File size exceeds 5MB limit.';
			target.value = '';
			addSlidePreview = null;
			return;
		}
		addSlidePreview = URL.createObjectURL(file);
	}

	function handleEditImageChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		editSlideError = null;
		if (!file) {
			editSlidePreview = null;
			return;
		}
		const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/jpg'];
		if (!allowed.includes(file.type)) {
			editSlideError = 'Invalid image format. Allowed: JPG, PNG, WEBP, AVIF.';
			target.value = '';
			editSlidePreview = null;
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			editSlideError = 'File size exceeds 5MB limit.';
			target.value = '';
			editSlidePreview = null;
			return;
		}
		editSlidePreview = URL.createObjectURL(file);
	}

	let activeNavSection = $state('sec-notifications');
	let highlightedSection = $state<string | null>(null);

	// Parse tab query parameter on route load/change
	$effect(() => {
		const tab = $page.url.searchParams.get('tab');
		if (tab) {
			activeNavSection = tab;
		}
	});

	// Change Log search state and derived parser for non-technical display
	let changelogSearch = $state('');

	interface ChangelogItem {
		title: string;
		description: string;
	}

	interface ChangelogCategory {
		name: string;
		items: ChangelogItem[];
	}

	interface ChangelogSection {
		title: string;
		categories: ChangelogCategory[];
	}

	const parsedChangelog = $derived.by(() => {
		const raw = data.changelogRaw || '';
		if (!raw) return [];

		const sections: ChangelogSection[] = [];
		let currentSection: ChangelogSection | null = null;
		let currentCategory: ChangelogCategory | null = null;

		const lines = raw.split('\n');
		for (let line of lines) {
			line = line.trim();
			if (!line || line === '---' || line.startsWith('# ')) continue;

			if (line.startsWith('## ')) {
				const title = line.replace(/^##\s+/, '').trim();
				currentSection = { title, categories: [] };
				sections.push(currentSection);
				currentCategory = null;
			} else if (line.startsWith('### ')) {
				const catName = line.replace(/^###\s+/, '').trim();
				if (!currentSection) {
					currentSection = { title: '🚀 Platform Updates', categories: [] };
					sections.push(currentSection);
				}
				currentCategory = { name: catName, items: [] };
				currentSection.categories.push(currentCategory);
			} else if (line.startsWith('- ')) {
				if (!currentSection) {
					currentSection = { title: '🚀 Platform Updates', categories: [] };
					sections.push(currentSection);
				}
				if (!currentCategory) {
					currentCategory = { name: '📌 Feature Updates', categories: [] } as any;
					currentCategory = { name: '📌 Feature Updates', items: [] };
					currentSection.categories.push(currentCategory);
				}

				const boldMatch = line.match(/^-\s+\*\*([^*]+)\*\*:\s*(.*)$/);
				if (boldMatch) {
					currentCategory.items.push({
						title: boldMatch[1].trim(),
						description: boldMatch[2].trim()
					});
				} else {
					const plainText = line.replace(/^-\s+/, '').trim();
					currentCategory.items.push({
						title: 'General Update',
						description: plainText
					});
				}
			}
		}

		return sections
			.map(sec => ({
				...sec,
				categories: sec.categories.filter(cat => cat.items.length > 0)
			}))
			.filter(sec => sec.categories.length > 0);
	});

	let activeEmailTemplate = $state('');
	let previewIframeSrc = $derived(
		activeEmailTemplate ? `/api/preview-emails?template=${activeEmailTemplate}` : '/api/preview-emails'
	);

	onMount(() => {
		function handleMessage(event: MessageEvent) {
			if (event.data && event.data.type === 'EMAIL_TEMPLATE_SELECTED') {
				if (typeof event.data.template === 'string') {
					activeEmailTemplate = event.data.template;
				}
			}
		}
		window.addEventListener('message', handleMessage);
		return () => {
			window.removeEventListener('message', handleMessage);
		};
	});

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

	let settings = $state<any[]>([]);

	$effect(() => {
		if (data.settings) {
			settings = data.settings.map((s: any) => ({
				...s,
				email_template: s.email_template ?? '',
				sms_template: s.sms_template ?? ''
			}));
		}
	});

	// Automatically select the first template once settings are loaded
	$effect(() => {
		if (!selectedId && settings.length > 0) {
			selectedId = settings[0].id;
		}
	});

	const selectedSetting = $derived(settings.find((s: any) => s.id === selectedId));

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
			class:active={activeNavSection === 'sec-preview-emails'} 
			onclick={() => navigateToSection('sec-preview-emails')}
		>
			✉️ Email Previews
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
			class:active={activeNavSection === 'sec-carousel'} 
			onclick={() => navigateToSection('sec-carousel')}
		>
			📸 Photo Carousel
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
			class:active={activeNavSection === 'sec-stripe-status'} 
			onclick={() => { navigateToSection('sec-stripe-status'); if (!stripeStatusResults && !isFetchingStripe) fetchStripeStatus(); }}
		>
			💳 Stripe Status
		</button>
		<button 
			type="button" 
			class="nav-pill-btn" 
			class:active={activeNavSection === 'sec-changelog'} 
			onclick={() => navigateToSection('sec-changelog')}
		>
			🚀 Site Updates & Change Log
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
				{#each settings as setting}
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
{:else if activeNavSection === 'sec-carousel'}
	<div id="sec-carousel" class="admin-header section-header">
		<div>
			<span class="subtitle">Content Management</span>
			<h2>Home Page Photo Carousel</h2>
			<p class="section-desc">Manage photos, titles, captions, and links displayed in the interactive showcase on the home page.</p>
		</div>
	</div>

	{#if form?.carouselMessage}
		<div class="alert alert-error glass">
			<p>{form.carouselMessage}</p>
		</div>
	{/if}

	{#if addSlideError}
		<div class="alert alert-error glass">
			<p>{addSlideError}</p>
		</div>
	{/if}

	{#if editSlideError}
		<div class="alert alert-error glass">
			<p>{editSlideError}</p>
		</div>
	{/if}

	<div class="carousel-mgmt-container glass">
		<div class="carousel-mgmt-header">
			<div>
				<h3>Carousel Slides ({data.carouselSlides?.length || 0})</h3>
				<p class="sub-text">Active slides appear in the auto-playing showcase directly on the home page.</p>
			</div>
			<div class="header-btns">
				{#if !data.carouselSlides || data.carouselSlides.length === 0}
					<form method="POST" action="?/seedCarouselSlides" use:enhance>
						<button type="submit" class="btn btn-secondary">
							⚡ Seed 4 Starter Slides
						</button>
					</form>
				{/if}
				<button 
					type="button" 
					class="btn btn-primary" 
					onclick={startAddSlide}
				>
					+ Add New Photo Slide
				</button>
			</div>
		</div>

		<!-- Live Public Carousel Preview -->
		{#if data.carouselSlides && data.carouselSlides.length > 0}
			<div class="preview-carousel-wrapper">
				<div class="preview-carousel-header">
					<span>👁️ Live Home Page Carousel Preview (Interactive)</span>
				</div>
				<div class="admin-carousel-preview-box">
					<PhotoCarousel slides={data.carouselSlides.filter((s: any) => s.active)} />
				</div>
			</div>
		{/if}

		<!-- Scroll Anchor for Add/Edit Forms -->
		<div id="slide-form-anchor" class="slide-form-anchor-marker"></div>

		<!-- Add Slide Form -->
		{#if isAddingSlide}
			<div class="slide-form-card glass glow-box">
				<div class="form-card-title">
					<h4>Add New Carousel Slide</h4>
					<button type="button" class="btn-text-close" onclick={() => isAddingSlide = false}>✕ Close</button>
				</div>

				<!-- Photo Sizing & Composition Guidelines -->
				<div class="photo-guidelines-box glass">
					<div class="guidelines-title">
						<span class="icon">📐</span>
						<strong>Recommended Photo Specifications & Framing</strong>
					</div>
					<ul class="guidelines-list">
						<li><strong>Recommended Aspect Ratio:</strong> <code>16:9</code> landscape (e.g. <code>1920 × 1080px</code> or <code>1280 × 720px</code>).</li>
						<li><strong>Orientation:</strong> Horizontal photos look best across desktop and mobile. Avoid tall/vertical photos.</li>
						<li><strong>Prevent Cut-Offs:</strong> If your subject (boat masts, sky, or deck) is cut off, use the <em>Focal Repositioning</em> buttons below to adjust the vertical crop!</li>
						<li><strong>File Limits:</strong> JPEG, PNG, or WebP up to 5MB.</li>
					</ul>
				</div>

				<form
					method="POST"
					action="?/addCarouselSlide"
					enctype="multipart/form-data"
					use:enhance={() => {
						return async ({ update, result }) => {
							await update();
							if (result.type === 'success') {
								isAddingSlide = false;
								addSlidePreview = null;
							}
						};
					}}
					class="slide-edit-form"
				>
					<div class="slide-edit-grid">
						<div class="form-group full-width">
							<label for="slide-title">Slide Title</label>
							<input id="slide-title" type="text" name="title" bind:value={newSlideDraft.title} placeholder="e.g. Sunset Catamaran Sailing" required class="text-input" />
						</div>

						<div class="form-group full-width">
							<label for="slide-caption">Slide Caption / Description</label>
							<textarea id="slide-caption" name="caption" rows="2" bind:value={newSlideDraft.caption} placeholder="e.g. Watch the legendary Key West sunset from the water without paying for an entire private yacht alone." required class="text-input"></textarea>
						</div>

						<!-- Image Source Selection -->
						<div class="form-group full-width">
							<span class="field-label-text">Photo Source</span>
							<div class="source-mode-toggle">
								<button
									type="button"
									class="mode-toggle-btn"
									class:active={addSlideMode === 'file'}
									onclick={() => { addSlideMode = 'file'; }}
								>
									📁 Upload Image File
								</button>
								<button
									type="button"
									class="mode-toggle-btn"
									class:active={addSlideMode === 'url'}
									onclick={() => { addSlideMode = 'url'; }}
								>
									🔗 External Image URL
								</button>
							</div>
						</div>

						{#if addSlideMode === 'file'}
							<div class="form-group full-width">
								<label for="slide-file">Select Image File (Max 5MB • JPG, PNG, WEBP, AVIF)</label>
								<input
									id="slide-file"
									type="file"
									name="image_file"
									accept="image/jpeg,image/png,image/webp,image/avif,image/jpg"
									onchange={handleAddImageChange}
									class="text-input file-input"
								/>
							</div>
						{:else}
							<div class="form-group full-width">
								<label for="slide-url">Image Web URL</label>
								<input
									id="slide-url"
									type="url"
									name="image_url"
									bind:value={newSlideDraft.image_url}
									placeholder="https://images.unsplash.com/..."
									class="text-input"
								/>
							</div>
						{/if}

						<!-- Image Focal Repositioning -->
						<div class="form-group full-width">
							<span class="field-label-text">Photo Focal Repositioning (Crop Alignment)</span>
							<p class="field-hint">Choose which portion of the image stays visible when cropped to the 16:9 carousel.</p>
							<div class="focal-options-grid">
								{#each positionOptions as opt}
									<button
										type="button"
										class="focal-opt-btn"
										class:active={newSlideDraft.object_position === opt.value}
										onclick={() => { newSlideDraft.object_position = opt.value; }}
									>
										{opt.label}
									</button>
								{/each}
							</div>
							<input type="hidden" name="object_position" value={newSlideDraft.object_position} />
						</div>

						{#if addSlidePreview || (addSlideMode === 'url' && newSlideDraft.image_url)}
							<div class="form-group full-width">
								<span class="field-label-text">Live Image Preview (Repositioned to {newSlideDraft.object_position})</span>
								<div class="image-upload-preview preview-aspect-16-9">
									<img
										src={addSlidePreview || newSlideDraft.image_url}
										alt="Preview"
										class="upload-preview-thumb"
										style="object-position: {newSlideDraft.object_position};"
									/>
								</div>
							</div>
						{/if}

						<div class="form-group">
							<label for="slide-link-url">Button Link Destination (Optional)</label>
							<input id="slide-link-url" type="text" name="link_url" bind:value={newSlideDraft.link_url} placeholder="e.g. /browse?type=Sunset%20Cruise" class="text-input" />
						</div>

						<div class="form-group">
							<label for="slide-link-text">Button Label (Optional)</label>
							<input id="slide-link-text" type="text" name="link_text" bind:value={newSlideDraft.link_text} placeholder="e.g. Explore Sunset Cruises" class="text-input" />
						</div>

						<div class="form-group">
							<label for="slide-order">Display Order</label>
							<input id="slide-order" type="number" name="display_order" bind:value={newSlideDraft.display_order} class="text-input" />
						</div>

						<div class="form-group full-width form-checkbox-group">
							<label class="checkbox-label">
								<input type="checkbox" name="active" value="true" checked />
								<span>Active (Visible on public home page immediately)</span>
							</label>
						</div>

						<div class="form-actions full-width">
							<button type="button" class="btn btn-secondary" onclick={() => isAddingSlide = false}>Cancel</button>
							<button type="submit" class="btn btn-primary">Save Slide</button>
						</div>
					</div>
				</form>
			</div>
		{/if}

		<!-- Edit Slide Form -->
		{#if editingSlide}
			<div class="slide-form-card glass glow-box editing-pulse">
				<div class="form-card-title">
					<h4>✏️ Editing Carousel Slide: {editingSlide.title}</h4>
					<button type="button" class="btn-text-close" onclick={() => editingSlide = null}>✕ Close</button>
				</div>

				<!-- Photo Sizing & Composition Guidelines -->
				<div class="photo-guidelines-box glass">
					<div class="guidelines-title">
						<span class="icon">📐</span>
						<strong>Recommended Photo Specifications & Framing</strong>
					</div>
					<ul class="guidelines-list">
						<li><strong>Recommended Aspect Ratio:</strong> <code>16:9</code> landscape (e.g. <code>1920 × 1080px</code> or <code>1280 × 720px</code>).</li>
						<li><strong>Orientation:</strong> Horizontal photos look best across desktop and mobile. Avoid tall/vertical photos.</li>
						<li><strong>Prevent Cut-Offs:</strong> If your subject is getting cut off, choose a <em>Focal Repositioning</em> alignment below to adjust the crop!</li>
						<li><strong>File Limits:</strong> JPEG, PNG, or WebP up to 5MB.</li>
					</ul>
				</div>

				<form
					method="POST"
					action="?/updateCarouselSlide"
					enctype="multipart/form-data"
					use:enhance={() => {
						return async ({ update, result }) => {
							await update();
							if (result.type === 'success') {
								editingSlide = null;
								editSlidePreview = null;
							}
						};
					}}
					class="slide-edit-form"
				>
					<input type="hidden" name="id" value={editingSlide.id} />
					<div class="slide-edit-grid">
						<div class="form-group full-width">
							<label for="edit-slide-title">Slide Title</label>
							<input id="edit-slide-title" type="text" name="title" bind:value={editingSlide.title} required class="text-input" />
						</div>

						<div class="form-group full-width">
							<label for="edit-slide-caption">Slide Caption / Description</label>
							<textarea id="edit-slide-caption" name="caption" rows="2" bind:value={editingSlide.caption} required class="text-input"></textarea>
						</div>

						<!-- Edit Image Options -->
						<div class="form-group full-width">
							<span class="field-label-text">Slide Photo</span>
							<div class="source-mode-toggle">
								<button
									type="button"
									class="mode-toggle-btn"
									class:active={editSlideMode === 'keep'}
									onclick={() => { editSlideMode = 'keep'; }}
								>
									🖼️ Keep Current Image
								</button>
								<button
									type="button"
									class="mode-toggle-btn"
									class:active={editSlideMode === 'file'}
									onclick={() => { editSlideMode = 'file'; }}
								>
									📁 Upload New File
								</button>
								<button
									type="button"
									class="mode-toggle-btn"
									class:active={editSlideMode === 'url'}
									onclick={() => { editSlideMode = 'url'; }}
								>
									🔗 Change URL
								</button>
							</div>
						</div>

						{#if editSlideMode === 'keep'}
							<input type="hidden" name="image_url" value={editingSlide.image_url} />
							<div class="form-group full-width">
								<span class="field-label-text">Current Image Preview (Alignment: {editingSlide.object_position || 'center'})</span>
								<div class="image-upload-preview preview-aspect-16-9">
									<img src={editingSlide.image_url} alt={editingSlide.title} class="upload-preview-thumb" style="object-position: {editingSlide.object_position || 'center'};" />
								</div>
							</div>
						{:else if editSlideMode === 'file'}
							<input type="hidden" name="image_url" value={editingSlide.image_url} />
							<div class="form-group full-width">
								<label for="edit-slide-file">Select New Image File (Max 5MB • JPG, PNG, WEBP, AVIF)</label>
								<input
									id="edit-slide-file"
									type="file"
									name="image_file"
									accept="image/jpeg,image/png,image/webp,image/avif,image/jpg"
									onchange={handleEditImageChange}
									class="text-input file-input"
								/>
							</div>
							{#if editSlidePreview}
								<div class="form-group full-width">
									<span class="field-label-text">New Image Preview (Alignment: {editingSlide.object_position || 'center'})</span>
									<div class="image-upload-preview preview-aspect-16-9">
										<img src={editSlidePreview} alt="New upload preview" class="upload-preview-thumb" style="object-position: {editingSlide.object_position || 'center'};" />
									</div>
								</div>
							{/if}
						{:else}
							<div class="form-group full-width">
								<label for="edit-slide-url">New Image Web URL</label>
								<input
									id="edit-slide-url"
									type="url"
									name="image_url"
									bind:value={editingSlide.image_url}
									class="text-input"
									required
								/>
							</div>
							{#if editingSlide.image_url}
								<div class="form-group full-width">
									<span class="field-label-text">URL Image Preview (Alignment: {editingSlide.object_position || 'center'})</span>
									<div class="image-upload-preview preview-aspect-16-9">
										<img src={editingSlide.image_url} alt="URL Preview" class="upload-preview-thumb" style="object-position: {editingSlide.object_position || 'center'};" />
									</div>
								</div>
							{/if}
						{/if}

						<!-- Image Focal Repositioning -->
						<div class="form-group full-width">
							<span class="field-label-text">Photo Focal Repositioning (Crop Alignment)</span>
							<p class="field-hint">Choose which portion of the image stays visible when cropped to the 16:9 carousel.</p>
							<div class="focal-options-grid">
								{#each positionOptions as opt}
									<button
										type="button"
										class="focal-opt-btn"
										class:active={(editingSlide.object_position || 'center') === opt.value}
										onclick={() => { editingSlide.object_position = opt.value; }}
									>
										{opt.label}
									</button>
								{/each}
							</div>
							<input type="hidden" name="object_position" value={editingSlide.object_position || 'center'} />
						</div>

						<div class="form-group">
							<label for="edit-slide-link-url">Button Link Destination</label>
							<input id="edit-slide-link-url" type="text" name="link_url" bind:value={editingSlide.link_url} class="text-input" />
						</div>

						<div class="form-group">
							<label for="edit-slide-link-text">Button Label</label>
							<input id="edit-slide-link-text" type="text" name="link_text" bind:value={editingSlide.link_text} class="text-input" />
						</div>

						<div class="form-group">
							<label for="edit-slide-order">Display Order</label>
							<input id="edit-slide-order" type="number" name="display_order" bind:value={editingSlide.display_order} class="text-input" />
						</div>

						<div class="form-group full-width form-checkbox-group">
							<label class="checkbox-label">
								<input type="checkbox" name="active" value="true" bind:checked={editingSlide.active} />
								<span>Active (Visible on public home page)</span>
							</label>
						</div>

						<div class="form-actions full-width">
							<button type="button" class="btn btn-secondary" onclick={() => editingSlide = null}>Cancel</button>
							<button type="submit" class="btn btn-primary">Update Slide</button>
						</div>
					</div>
				</form>
			</div>
		{/if}

		<!-- Slides Management List -->
		<div class="slides-card-list">
			{#if !data.carouselSlides || data.carouselSlides.length === 0}
				<div class="empty-placeholder">
					<p>No photo carousel slides found in the database.</p>
				</div>
			{:else}
				{#each data.carouselSlides as slide (slide.id)}
					<div class="slide-mgmt-card glass" class:inactive-card={!slide.active}>
						<div class="slide-card-thumb-col">
							<img
								src={slide.image_url}
								alt={slide.title}
								class="slide-mgmt-thumb"
								style="object-position: {slide.object_position || 'center'};"
								onerror={(e) => {
									const img = e.currentTarget as HTMLImageElement;
									if (!img.src.includes('photo-1544551763-46a013bb70d5')) {
										img.src = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1600&q=80';
									}
								}}
							/>
							<div class="slide-order-tag">#{slide.display_order}</div>
						</div>

						<div class="slide-card-details-col">
							<div class="slide-details-top">
								<h4 class="slide-card-title">{slide.title}</h4>
								<span class="badge" class:badge-active={slide.active} class:badge-inactive={!slide.active}>
									{slide.active ? '● Live' : '○ Hidden'}
								</span>
								{#if slide.object_position && slide.object_position !== 'center'}
									<span class="badge badge-focal">Crop: {slide.object_position}</span>
								{/if}
							</div>

							<p class="slide-card-caption">{slide.caption}</p>

							{#if slide.link_url}
								<div class="slide-card-link-badge">
									🔗 <strong>{slide.link_text || 'Link'}:</strong> {slide.link_url}
								</div>
							{/if}
						</div>

						<div class="slide-card-actions-col">
							<!-- Active Toggle -->
							<form method="POST" action="?/toggleCarouselActive" use:enhance>
								<input type="hidden" name="id" value={slide.id} />
								<input type="hidden" name="active" value={slide.active ? 'false' : 'true'} />
								<button
									type="submit"
									class="btn-toggle-switch"
									class:active-toggle={slide.active}
									title={slide.active ? 'Click to hide slide' : 'Click to show slide'}
								>
									{slide.active ? 'Enabled' : 'Disabled'}
								</button>
							</form>

							<button
								type="button"
								class="btn btn-secondary btn-sm"
								onclick={() => startEditSlide(slide)}
							>
								Edit
							</button>

							<form method="POST" action="?/deleteCarouselSlide" use:enhance>
								<input type="hidden" name="id" value={slide.id} />
								<button
									type="submit"
									class="btn-danger-action"
									onclick={(e) => {
										if (!confirm(`Are you sure you want to delete "${slide.title}"?`)) {
											e.preventDefault();
										}
									}}
								>
									Delete
								</button>
							</form>
						</div>
					</div>
				{/each}
			{/if}
		</div>
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
				{#each settings as setting}
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

<!-- Section 7: Site Updates & Plain English Change Log -->
{#if activeNavSection === 'sec-changelog'}
	<div id="sec-changelog" class="changelog-container">
		<div class="changelog-header-card glass">
			<div class="changelog-header-info">
				<span class="changelog-badge">Plain English Update History</span>
				<h2>Platform Improvements & Site Activity Log</h2>
				<p>Review all features, design enhancements, bug fixes, and system tools added to SplitACharter in clear, plain language.</p>
			</div>
			<div class="changelog-search-box">
				<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon">
					<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
				</svg>
				<input
					type="text"
					placeholder="Search features (e.g. Stripe, Captain, SMS, Refund)..."
					bind:value={changelogSearch}
					class="changelog-search-input"
				/>
				{#if changelogSearch}
					<button type="button" class="btn-clear-search" onclick={() => changelogSearch = ''}>✕</button>
				{/if}
			</div>
		</div>

		{#if parsedChangelog.length === 0}
			<div class="glass no-updates-card">
				<p>No change log data currently available.</p>
			</div>
		{:else}
			{#each parsedChangelog as section}
				<div class="changelog-section-block">
					<h3 class="changelog-month-title">{section.title}</h3>
					<div class="changelog-categories-grid">
						{#each section.categories as category}
							{@const matchingItems = category.items.filter(item => 
								!changelogSearch.trim() || 
								item.title.toLowerCase().includes(changelogSearch.toLowerCase()) || 
								item.description.toLowerCase().includes(changelogSearch.toLowerCase())
							)}
							{#if matchingItems.length > 0}
								<div class="changelog-category-card glass">
									<div class="category-card-header">
										<h3>{category.name}</h3>
										<span class="category-count">{matchingItems.length} update{matchingItems.length === 1 ? '' : 's'}</span>
									</div>
									<div class="category-items-list">
										{#each matchingItems as item}
											<div class="changelog-item-row">
												<div class="item-icon-dot"></div>
												<div class="item-content">
													<h4 class="item-title">{item.title}</h4>
													<p class="item-desc">{item.description}</p>
												</div>
											</div>
										{/each}
									</div>
								</div>
							{/if}
						{/each}
					</div>
				</div>
			{/each}
		{/if}
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

	/* Carousel Management Styles */
	.carousel-mgmt-container {
		border: 1px solid var(--border-light);
		padding: 2rem;
		border-radius: 12px;
		background: var(--input-bg);
		margin-bottom: 4rem;
	}
	.carousel-mgmt-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		flex-wrap: wrap;
		gap: 1rem;
	}
	.carousel-mgmt-header h3 {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0 0 0.25rem 0;
	}
	.preview-carousel-wrapper {
		margin-bottom: 2.5rem;
		background: var(--bg-surface);
		border: 1px solid var(--border-light);
		border-radius: 16px;
		padding: 1.5rem;
	}
	.preview-carousel-header {
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--primary);
		margin-bottom: 1rem;
	}
	.admin-carousel-preview-box {
		max-width: 900px;
		margin: 0 auto;
	}
	.slide-form-anchor-marker {
		scroll-margin-top: 100px;
	}
	.photo-guidelines-box {
		padding: 1rem 1.25rem;
		border-radius: 10px;
		background: rgba(37, 99, 235, 0.06);
		border: 1px solid rgba(37, 99, 235, 0.2);
		margin-bottom: 1.5rem;
	}
	.guidelines-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.95rem;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}
	.guidelines-list {
		margin: 0;
		padding-left: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.85rem;
		color: var(--text-secondary);
		line-height: 1.45;
	}
	.guidelines-list code {
		background: var(--bg-base);
		padding: 1px 5px;
		border-radius: 4px;
		border: 1px solid var(--border-light);
		color: var(--primary);
		font-size: 0.8rem;
	}
	.field-hint {
		font-size: 0.8rem;
		color: var(--text-muted);
		margin: -0.25rem 0 0.5rem 0;
		line-height: 1.35;
	}
	.focal-options-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.focal-opt-btn {
		padding: 6px 12px;
		font-size: 0.8rem;
		font-weight: 600;
		border-radius: 6px;
		background: var(--bg-base);
		border: 1px solid var(--border-light);
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.2s ease;
	}
	.focal-opt-btn:hover {
		border-color: var(--primary);
		color: var(--text-primary);
	}
	.focal-opt-btn.active {
		background: var(--primary);
		color: #ffffff;
		border-color: var(--primary);
		box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);
	}
	.preview-aspect-16-9 {
		aspect-ratio: 16 / 9;
		max-width: 480px;
		max-height: 270px;
		width: 100%;
		background: #000000;
	}
	.slide-form-card {
		padding: 1.75rem;
		border: 1px solid var(--border-light);
		border-radius: 12px;
		background: var(--bg-surface);
		margin-bottom: 2rem;
		transition: all 0.3s ease;
	}
	.editing-pulse {
		border-color: var(--primary) !important;
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.35), var(--glass-shadow) !important;
		animation: editGlow 1.2s ease-in-out;
	}
	@keyframes editGlow {
		0% {
			transform: scale(0.99);
			box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.5);
		}
		50% {
			transform: scale(1);
			box-shadow: 0 0 0 10px rgba(37, 99, 235, 0.2);
		}
		100% {
			box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.35);
		}
	}
	.badge-focal {
		background: rgba(56, 189, 248, 0.12);
		color: #38bdf8;
		border: 1px solid rgba(56, 189, 248, 0.25);
		font-size: 0.7rem;
		padding: 2px 6px;
	}
	.slide-edit-form {
		width: 100%;
	}
	.slide-edit-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.25rem;
	}
	.slide-edit-grid .full-width {
		grid-column: 1 / -1;
	}
	.field-label-text {
		display: block;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-secondary);
		margin-bottom: 0.5rem;
	}
	.source-mode-toggle {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}
	.mode-toggle-btn {
		padding: 6px 14px;
		font-size: 0.85rem;
		font-weight: 600;
		border-radius: 6px;
		background: var(--bg-base);
		border: 1px solid var(--border-light);
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.2s ease;
	}
	.mode-toggle-btn.active {
		background: var(--primary);
		color: #ffffff;
		border-color: var(--primary);
	}
	.file-input {
		padding: 8px 12px;
		cursor: pointer;
	}
	.image-upload-preview {
		margin-top: 0.5rem;
		border-radius: 8px;
		overflow: hidden;
		max-width: 320px;
		max-height: 180px;
		border: 1px solid var(--border-light);
	}
	.upload-preview-thumb {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.form-checkbox-group {
		margin-top: 0.25rem;
	}
	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		cursor: pointer;
		font-size: 0.9rem;
		color: var(--text-primary);
	}
	.checkbox-label input[type="checkbox"] {
		width: 18px;
		height: 18px;
		cursor: pointer;
	}
	.slides-card-list {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	.slide-mgmt-card {
		display: flex;
		align-items: center;
		padding: 1.25rem;
		border-radius: 12px;
		border: 1px solid var(--border-light);
		background: var(--bg-surface);
		gap: 1.5rem;
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
	}
	.slide-mgmt-card:hover {
		border-color: var(--primary);
	}
	.slide-mgmt-card.inactive-card {
		opacity: 0.6;
	}
	.slide-card-thumb-col {
		position: relative;
		width: 140px;
		height: 90px;
		flex-shrink: 0;
		border-radius: 8px;
		overflow: hidden;
		border: 1px solid var(--border-light);
	}
	.slide-mgmt-thumb {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.slide-order-tag {
		position: absolute;
		top: 4px;
		left: 4px;
		background: rgba(15, 23, 42, 0.8);
		backdrop-filter: blur(4px);
		color: #ffffff;
		font-size: 0.75rem;
		font-weight: 700;
		padding: 2px 6px;
		border-radius: 4px;
	}
	.slide-card-details-col {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.slide-details-top {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.slide-card-title {
		font-size: 1.15rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0;
	}
	.badge-active {
		background: rgba(34, 197, 94, 0.15);
		color: #22c55e;
		border: 1px solid rgba(34, 197, 94, 0.3);
		font-size: 0.75rem;
		font-weight: 700;
		padding: 2px 8px;
		border-radius: 9999px;
	}
	.badge-inactive {
		background: rgba(148, 163, 184, 0.15);
		color: #94a3b8;
		border: 1px solid rgba(148, 163, 184, 0.3);
		font-size: 0.75rem;
		font-weight: 700;
		padding: 2px 8px;
		border-radius: 9999px;
	}
	.slide-card-caption {
		font-size: 0.9rem;
		color: var(--text-secondary);
		margin: 0;
		line-height: 1.4;
	}
	.slide-card-link-badge {
		font-size: 0.8rem;
		color: var(--primary);
		margin-top: 0.25rem;
	}
	.slide-card-actions-col {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-shrink: 0;
	}
	.btn-toggle-switch {
		padding: 6px 12px;
		font-size: 0.8rem;
		font-weight: 600;
		border-radius: 6px;
		cursor: pointer;
		background: rgba(148, 163, 184, 0.15);
		color: var(--text-secondary);
		border: 1px solid var(--border-light);
		transition: all 0.2s ease;
	}
	.btn-toggle-switch.active-toggle {
		background: rgba(34, 197, 94, 0.15);
		color: #22c55e;
		border-color: rgba(34, 197, 94, 0.3);
	}
	.btn-sm {
		padding: 6px 14px;
		font-size: 0.85rem;
	}
	@media (max-width: 768px) {
		.slide-mgmt-card {
			flex-direction: column;
			align-items: flex-start;
		}
		.slide-card-thumb-col {
			width: 100%;
			height: 160px;
		}
		.slide-edit-grid {
			grid-template-columns: 1fr;
		}
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
		padding: 0.5rem 0;
		margin-bottom: 2rem;
	}
	.settings-nav-pills {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		padding: 0.6rem 0.75rem;
		border: 1px solid var(--border-light);
		border-radius: 16px;
		background: var(--bg-surface);
		width: 100%;
		box-shadow: var(--glass-shadow);
	}
	.settings-nav-pills::-webkit-scrollbar {
		display: none;
	}
	.nav-pill-btn {
		background: transparent;
		color: var(--text-secondary);
		border: 1px solid transparent;
		font-size: 0.88rem;
		font-weight: 600;
		padding: 8px 16px;
		border-radius: 20px;
		cursor: pointer;
		transition: all 0.2s ease;
		display: inline-flex;
		align-items: center;
		gap: 6px;
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

	.nav-pill-btn {
		white-space: nowrap;
		flex-shrink: 0;
	}

	/* Site Updates & Change Log Section Styling */
	.changelog-container {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}
	.changelog-header-card {
		padding: 1.75rem;
		border-radius: 16px;
		border: 1px solid var(--border-light);
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1.5rem;
		background: var(--glass-bg);
	}
	.changelog-badge {
		display: inline-block;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 1.2px;
		color: var(--primary);
		font-weight: 700;
		margin-bottom: 0.4rem;
	}
	.changelog-header-info h2 {
		margin: 0 0 0.4rem 0;
		font-size: 1.65rem;
		font-weight: 800;
	}
	.changelog-header-info p {
		margin: 0;
		font-size: 0.925rem;
		color: var(--text-secondary);
	}
	.changelog-search-box {
		position: relative;
		display: flex;
		align-items: center;
		min-width: 280px;
		flex: 1;
		max-width: 400px;
	}
	.changelog-search-box .search-icon {
		position: absolute;
		left: 14px;
		color: var(--text-secondary);
		pointer-events: none;
	}
	.changelog-search-input {
		width: 100%;
		padding: 10px 38px 10px 42px;
		border-radius: 10px;
		background: var(--input-bg);
		border: 1px solid var(--border-light);
		color: var(--text-primary);
		font-size: 0.9rem;
		transition: all 0.2s ease;
	}
	.changelog-search-input:focus {
		border-color: var(--primary);
		box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
	}
	.btn-clear-search {
		position: absolute;
		right: 12px;
		background: transparent;
		border: none;
		color: var(--text-secondary);
		cursor: pointer;
		font-size: 0.9rem;
		padding: 2px 6px;
	}
	.changelog-section-block {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	.changelog-month-title {
		font-size: 1.35rem;
		font-weight: 800;
		margin: 0;
		color: var(--text-primary);
		letter-spacing: -0.3px;
	}
	.changelog-categories-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: 1.25rem;
	}
	.changelog-category-card {
		padding: 1.5rem;
		border-radius: 14px;
		border: 1px solid var(--border-light);
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		background: var(--bg-surface);
	}
	.category-card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--border-light);
	}
	.category-card-header h3 {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--text-primary);
	}
	.category-count {
		font-size: 0.75rem;
		font-weight: 700;
		padding: 0.2rem 0.6rem;
		border-radius: 20px;
		background: rgba(56, 189, 248, 0.12);
		color: var(--primary);
		border: 1px solid rgba(56, 189, 248, 0.25);
	}
	.category-items-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.changelog-item-row {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
	}
	.item-icon-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--primary);
		margin-top: 6px;
		flex-shrink: 0;
		box-shadow: 0 0 8px var(--primary);
	}
	.item-content {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.item-title {
		margin: 0;
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--text-primary);
		line-height: 1.35;
	}
	.item-desc {
		margin: 0;
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}
	.no-updates-card {
		padding: 2.5rem;
		text-align: center;
		border-radius: 12px;
		color: var(--text-secondary);
	}
	@media (max-width: 768px) {
		.changelog-header-card {
			padding: 1.25rem;
			flex-direction: column;
			align-items: stretch;
		}
		.changelog-search-box {
			min-width: 100%;
			max-width: 100%;
		}
		.changelog-categories-grid {
			grid-template-columns: 1fr;
		}
	}
</style>

