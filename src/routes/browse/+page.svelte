<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import CustomSelect from '$lib/components/CustomSelect.svelte';
	import CustomMultiSelect from '$lib/components/CustomMultiSelect.svelte';

	let { data } = $props();

	function parseTripTypesParam(paramVal: string | null): string[] {
		if (!paramVal || paramVal === 'all') return [];
		return paramVal
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);
	}

	const initialStart =
		page.url.searchParams.get('startDate') || page.url.searchParams.get('date_from') || '';
	const initialEnd =
		page.url.searchParams.get('endDate') || page.url.searchParams.get('date_to') || '';
	const initialSingleDate = page.url.searchParams.get('date') || '';

	let startDate = $state(initialStart || initialSingleDate || '');
	let endDate = $state(initialEnd || '');
	let dateMode = $derived<'single' | 'range'>(endDate ? 'range' : 'single');
	let searchDate = $derived(startDate);

	function parseLocationsParam(param: string | null): string[] {
		if (!param || param === 'all') return [];
		return param.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
	}

	let filterLocations = $state<string[]>(
		parseLocationsParam(page.url.searchParams.get('location'))
	);

	let filterDuration = $state(page.url.searchParams.get('duration') || 'all'); // 'all', 'half-day', 'full-day'
	let filterTripTypes = $state<string[]>(
		parseTripTypesParam(page.url.searchParams.get('trip_type'))
	);
	let filterGroupSize = $state(page.url.searchParams.get('groupSize') || '1');
	let minDate = $state('');

	onMount(() => {
		const today = new Date();
		const yyyy = today.getFullYear();
		const mm = String(today.getMonth() + 1).padStart(2, '0');
		const dd = String(today.getDate()).padStart(2, '0');
		minDate = `${yyyy}-${mm}-${dd}`;

		const handlePopState = () => {
			const urlParams = new URLSearchParams(window.location.search);
			const pDate = urlParams.get('date') || '';
			const pStart = urlParams.get('startDate') || urlParams.get('date_from') || '';
			const pEnd = urlParams.get('endDate') || urlParams.get('date_to') || '';

			if (pDate && !pStart && !pEnd) {
				startDate = pDate;
				endDate = '';
			} else {
				startDate = pStart;
				endDate = pEnd;
			}

			filterLocations = parseLocationsParam(urlParams.get('location'));
			filterDuration = urlParams.get('duration') || 'all';
			filterTripTypes = parseTripTypesParam(urlParams.get('trip_type'));
			filterGroupSize = urlParams.get('groupSize') || '1';
		};

		window.addEventListener('popstate', handlePopState);
		return () => window.removeEventListener('popstate', handlePopState);
	});

	// Sync local state to URL query parameters without triggering route navigation reloads
	$effect(() => {
		if (typeof window === 'undefined') return;

		const params = new URLSearchParams();
		if (dateMode === 'single') {
			if (searchDate) params.set('date', searchDate);
		} else {
			if (startDate) params.set('startDate', startDate);
			if (endDate) params.set('endDate', endDate);
		}
		if (filterLocations.length > 0) params.set('location', filterLocations.join(','));
		if (filterDuration !== 'all') params.set('duration', filterDuration);
		if (filterTripTypes.length > 0) params.set('trip_type', filterTripTypes.join(','));
		if (filterGroupSize !== '1') params.set('groupSize', filterGroupSize);

		const queryString = params.toString();
		const targetUrl = queryString
			? `${window.location.pathname}?${queryString}`
			: window.location.pathname;
		const currentUrl = `${window.location.pathname}${window.location.search}`;

		if (targetUrl !== currentUrl) {
			window.history.replaceState(history.state, '', targetUrl);
		}
	});

	function handleStartDateChange() {
		if (startDate && endDate && endDate < startDate) {
			endDate = startDate;
		}
	}

	function handleEndDateChange() {
		if (endDate && !startDate) {
			startDate = minDate || new Date().toISOString().split('T')[0];
		}
		if (startDate && endDate && startDate > endDate) {
			startDate = endDate;
		}
	}

	function getWeekendDates(): { start: string; end: string } {
		const today = new Date();
		const day = today.getDay(); // 0 is Sun, 6 is Sat
		const sat = new Date(today);
		const sun = new Date(today);

		if (day === 6) {
			// Saturday
			sat.setDate(today.getDate());
			sun.setDate(today.getDate() + 1);
		} else if (day === 0) {
			// Sunday
			sat.setDate(today.getDate() - 1);
			sun.setDate(today.getDate());
		} else {
			const diff = 6 - day;
			sat.setDate(today.getDate() + diff);
			sun.setDate(today.getDate() + diff + 1);
		}
		const fmt = (d: Date) => d.toISOString().split('T')[0];
		return { start: fmt(sat), end: fmt(sun) };
	}

	function getNextNDays(days: number): { start: string; end: string } {
		const today = new Date();
		const end = new Date(today);
		end.setDate(today.getDate() + days);
		const fmt = (d: Date) => d.toISOString().split('T')[0];
		return { start: fmt(today), end: fmt(end) };
	}

	function applyPreset(preset: 'weekend' | '7days' | '14days' | '30days') {
		if (preset === 'weekend') {
			const { start, end } = getWeekendDates();
			startDate = start;
			endDate = end;
		} else if (preset === '7days') {
			const { start, end } = getNextNDays(7);
			startDate = start;
			endDate = end;
		} else if (preset === '14days') {
			const { start, end } = getNextNDays(14);
			startDate = start;
			endDate = end;
		} else if (preset === '30days') {
			const { start, end } = getNextNDays(30);
			startDate = start;
			endDate = end;
		}
	}

	function getRemainingSeats(template: any, matchedInstance?: any): number {
		const maxPax = template?.max_passengers || 6;
		if (matchedInstance && matchedInstance.status === 'half-booked') {
			const activeBookings =
				matchedInstance.bookings?.filter(
					(b: any) => b.status !== 'canceled' && b.status !== 'forfeited'
				) || [];
			const bookedPax = activeBookings.reduce(
				(sum: number, b: any) => sum + (b.group_size || 0),
				0
			);
			return Math.min(4, Math.max(0, maxPax - bookedPax));
		}
		// For a new charter instance, reserve at least 1 seat for Group 2 (max per group is maxPax - 1), capped at 4
		return Math.min(4, Math.max(1, maxPax - 1));
	}

	function matchesLocationFilter(template: any, selectedLocations: string[]): boolean {
		if (!selectedLocations || selectedLocations.length === 0 || selectedLocations.includes('all')) return true;

		// Match by area_id
		if (template.area_id && data.areas) {
			const matchedArea = data.areas.find((a: any) => a.id === template.area_id);
			if (matchedArea && selectedLocations.includes(matchedArea.slug)) {
				return true;
			}
		}

		// Match by template.location string
		const locText = (template.location || '').toLowerCase();
		return selectedLocations.some((slug) => {
			const nameFromSlug = slug.replace(/-/g, ' ');
			return locText.includes(nameFromSlug) || nameFromSlug.includes(locText);
		});
	}

	function getDurationHours(dur: any): number {
		if (!dur) return 0;
		if (typeof dur === 'number') return dur;
		if (typeof dur === 'object' && dur.hours) return dur.hours;
		if (typeof dur === 'string') {
			const parts = dur.split(':');
			return parseInt(parts[0], 10) || 0;
		}
		return 0;
	}

	function matchesDurationFilter(template: any, filterDur: string): boolean {
		if (filterDur === 'all') return true;
		const hours = getDurationHours(template.duration);
		if (template.durations?.name && template.durations.name === filterDur) return true;
		if (filterDur === 'Half Day' || filterDur === 'half-day') return hours === 4;
		if (filterDur === '6 Hours' || filterDur === '6-hours' || filterDur === '6hours') return hours === 6;
		if (filterDur === 'Full Day' || filterDur === 'full-day') return hours === 8;
		if (filterDur === 'Sunset / Express' || filterDur === 'sunset') return hours === 2;
		return false;
	}

	function parseLocation(locString: string): { main: string; details: string | null } {
		if (!locString) return { main: '', details: null };
		const match = locString.match(/^(.*?)\s*\((.*?)\)$/);
		if (match) {
			return { main: match[1].trim(), details: `(${match[2].trim()})` };
		}
		return { main: locString, details: null };
	}

	function matchesFilters(template: any) {
		const matchesLocation = matchesLocationFilter(template, filterLocations);
		const matchesDuration = matchesDurationFilter(template, filterDuration);
		const matchesTripType =
			filterTripTypes.length === 0 || filterTripTypes.includes(template.trip_type);

		return matchesLocation && matchesDuration && matchesTripType;
	}

	// Client-side filtering: Single Date Mode
	let filteredListings = $derived.by(() => {
		if (dateMode !== 'single') return [];

		if (!searchDate) {
			// Mode A: NO Date Selected -> Only display active half-booked trip instances
			return data.halfBookedTrips
				.filter((trip) => {
					if (trip.date < minDate) return false;
					const template = data.listings.find((l) => l.id === trip.listing_template_id);
					if (!template) return false;
					return matchesFilters(template);
				})
				.map((trip) => {
					const template = data.listings.find((l) => l.id === trip.listing_template_id)!;
					return {
						...template,
						matchedInstance: trip
					};
				});
		} else {
			// Mode B: Date IS Selected -> Display 1 instance per template
			return data.listings
				.filter((template) => matchesFilters(template))
				.map((template) => {
					const matchedInstance =
						data.halfBookedTrips.find(
							(trip) => trip.listing_template_id === template.id && trip.date === searchDate
						) || null;

					return {
						...template,
						matchedInstance
					};
				});
		}
	});

	// Suggestions derived list (Only when a single date IS selected)
	let suggestedTrips = $derived.by(() => {
		if (dateMode !== 'single' || !searchDate) return [];

		return data.halfBookedTrips.filter((trip) => {
			const template = data.listings.find((l) => l.id === trip.listing_template_id);
			if (!template) return false;
			if (!matchesFilters(template)) return false;

			const sDate = new Date(searchDate + 'T00:00:00');
			const tDate = new Date(trip.date + 'T00:00:00');
			const diffTime = Math.abs(tDate.getTime() - sDate.getTime());
			const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

			return diffDays <= 3 && trip.date !== searchDate && trip.date >= minDate;
		});
	});

	// Date Range: Half-booked trips ready to join between startDate and endDate
	let rangeHalfBookedTrips = $derived.by(() => {
		if (dateMode !== 'range') return [];
		const effStart = startDate || minDate;
		return data.halfBookedTrips
			.filter((trip) => {
				if (trip.date < effStart) return false;
				if (endDate && trip.date > endDate) return false;
				const template = data.listings.find((l) => l.id === trip.listing_template_id);
				if (!template) return false;
				return matchesFilters(template);
			})
			.map((trip) => {
				const template = data.listings.find((l) => l.id === trip.listing_template_id)!;
				return {
					...template,
					matchedInstance: trip
				};
			})
			.sort((a, b) => (a.matchedInstance.date > b.matchedInstance.date ? 1 : -1));
	});

	// Date Range: Templates available to start a fresh charter
	let rangeTemplates = $derived.by(() => {
		if (dateMode !== 'range') return [];
		return data.listings.filter((template) => matchesFilters(template));
	});

	// Date Range: Default view when in range mode but no dates entered yet
	let defaultRangeHalfBookedTrips = $derived.by(() => {
		if (dateMode !== 'range' || Boolean(startDate || endDate)) return [];
		return data.halfBookedTrips
			.filter((trip) => {
				if (trip.date < minDate) return false;
				const template = data.listings.find((l) => l.id === trip.listing_template_id);
				if (!template) return false;
				return matchesFilters(template);
			})
			.map((trip) => {
				const template = data.listings.find((l) => l.id === trip.listing_template_id)!;
				return {
					...template,
					matchedInstance: trip
				};
			});
	});

	let isRangeDateEntered = $derived(dateMode === 'range' && Boolean(startDate || endDate));

	let hasActiveFilters = $derived(
		(dateMode === 'single' ? Boolean(searchDate) : Boolean(startDate || endDate)) ||
			filterLocations.length > 0 ||
			filterDuration !== 'all' ||
			filterTripTypes.length > 0 ||
			filterGroupSize !== '1'
	);

	function formatDuration(intervalStr: string | any) {
		if (typeof intervalStr === 'string') {
			const parts = intervalStr.split(':');
			if (parts.length >= 2) {
				const hours = parseInt(parts[0], 10);
				const minutes = parseInt(parts[1], 10);
				let result = '';
				if (hours > 0) result += `${hours} hr `;
				if (minutes > 0) result += `${minutes} min`;
				return result.trim();
			}
			return intervalStr;
		}
		if (intervalStr && typeof intervalStr === 'object') {
			let result = '';
			if (intervalStr.hours) result += `${intervalStr.hours} hr `;
			if (intervalStr.minutes) result += `${intervalStr.minutes} min`;
			return result.trim() || 'N/A';
		}
	}

	function formatDateDisplay(dateStr: string) {
		if (!dateStr) return '';
		const parts = dateStr.split('-');
		if (parts.length === 3) {
			return `${parts[1]}/${parts[2]}/${parts[0]}`;
		}
		return dateStr;
	}

	function formatDateShort(dateStr: string): string {
		if (!dateStr) return '';
		const parts = dateStr.split('-');
		if (parts.length === 3) {
			return `${parts[1]}/${parts[2]}`;
		}
		return dateStr;
	}

	function formatDateRangeDisplay(start: string, end: string): string {
		if (!start && !end) return 'Flexible Dates';
		if (start && !end) return `From ${formatDateShort(start)}`;
		if (!start && end) return `Up to ${formatDateShort(end)}`;
		if (start === end) return formatDateShort(start);

		const startParts = start.split('-');
		const endParts = end.split('-');
		if (startParts.length === 3 && endParts.length === 3) {
			if (startParts[0] !== endParts[0]) {
				return `${startParts[1]}/${startParts[2]}/${startParts[0].slice(-2)} – ${endParts[1]}/${endParts[2]}/${endParts[0].slice(-2)}`;
			}
			return `${startParts[1]}/${startParts[2]} – ${endParts[1]}/${endParts[2]}`;
		}
		return `${start} – ${end}`;
	}

	function formatMeetingArea(meetingArea?: string | null): string {
		if (!meetingArea) return 'Meeting details sent after confirmation';
		const lower = meetingArea.toLowerCase();
		if (
			lower.includes('sent after') ||
			lower.includes('details sent') ||
			lower.includes('confirmation')
		) {
			return 'Meeting details sent after confirmation';
		}
		return `Departure: ${meetingArea}`;
	}

	function formatWeekdayDate(dateStr: string) {
		if (!dateStr) return '';
		const parts = dateStr.split('-');
		if (parts.length === 3) {
			const y = parseInt(parts[0], 10);
			const m = parseInt(parts[1], 10) - 1;
			const d = parseInt(parts[2], 10);
			const date = new Date(y, m, d);
			return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
		}
		return dateStr;
	}

	const groupSizeOptions = [
		{ value: '1', label: '1 Passenger' },
		{ value: '2', label: '2 Passengers' },
		{ value: '3', label: '3 Passengers' },
		{ value: '4', label: '4 Passengers' }
	];
		const locationOptions = $derived([
		{ value: 'all', label: 'All Departure Locations' },
		...(data.areas || []).map((a) => ({
			value: a.slug,
			label: a.name
		}))
	]);
	const durationOptions = $derived([
		{ value: 'all', label: 'Any Duration' },
		...(data.durations || []).map((d) => ({
			value: d.name,
			label: `${d.label} (${d.hours} hrs)`
		}))
	]);
	const tripTypeOptions = $derived([
		{ value: 'all', label: 'Any Trip Type' },
		...data.tripTypes.map((t) => ({ value: t.name, label: t.name }))
	]);

	
	// Hotel / Staying Location State for Road Drive Times
	let hotelQuery = $state('');
	let selectedHotel = $state<{ name: string; address: string; lat: number; lng: number } | null>(null);
	let hotelSuggestions = $state<Array<{ name: string; address: string; lat: number; lng: number }>>([]);
	let isSearchingHotel = $state(false);
	let driveTimesByArea = $state<Record<string, string>>({});
	let hotelSearchTimer: any = null;

	function handleHotelSearchInput() {
		if (hotelSearchTimer) clearTimeout(hotelSearchTimer);
		if (!hotelQuery || hotelQuery.trim().length < 2) {
			hotelSuggestions = [];
			return;
		}
		hotelSearchTimer = setTimeout(async () => {
			isSearchingHotel = true;
			try {
				const res = await fetch(`/api/locations/search-places?q=${encodeURIComponent(hotelQuery)}`);
				if (res.ok) {
					const dataRes = await res.json();
					hotelSuggestions = dataRes.results || [];
				}
			} catch (err) {
				console.error('Error searching places:', err);
			} finally {
				isSearchingHotel = false;
			}
		}, 300);
	}

	async function selectHotel(hotel: { name: string; address: string; lat: number; lng: number }) {
		selectedHotel = hotel;
		hotelQuery = hotel.name;
		hotelSuggestions = [];
		await computeDriveTimesForAreas(hotel.lat, hotel.lng);
	}

	function clearSelectedHotel() {
		selectedHotel = null;
		hotelQuery = '';
		hotelSuggestions = [];
		driveTimesByArea = {};
	}

	async function computeDriveTimesForAreas(lat: number, lng: number) {
		if (!data.areas || data.areas.length === 0) return;
		const times: Record<string, string> = {};
		await Promise.all(
			data.areas.map(async (area: any) => {
				try {
					const res = await fetch('/api/locations/drive-time', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ lat, lng, areaId: area.id })
					});
					if (res.ok) {
						const result = await res.json();
						if (result.success && result.text) {
							times[area.id] = result.text;
							times[area.slug] = result.text;
						}
					}
				} catch (err) {
					console.error(`Error computing drive time for ${area.name}:`, err);
				}
			})
		);
		driveTimesByArea = times;
	}

	function resetAllFilters() {
		startDate = '';
		endDate = '';
		filterLocations = [];
		filterDuration = 'all';
		filterTripTypes = [];
		filterGroupSize = '1';
	}

	function getListingHref(listing: any) {
		const params = new URLSearchParams();
		if (listing.matchedInstance?.date) {
			// Ready-to-join trip has an exact departure date
			params.set('date', listing.matchedInstance.date);
		} else if (dateMode === 'single' && searchDate) {
			// Single date search has an exact departure date
			params.set('date', searchDate);
		} else if (dateMode === 'range' && (startDate || endDate)) {
			// Date range search passes range so user intentionally confirms departure day on details page
			if (startDate) params.set('startDate', startDate);
			if (endDate) params.set('endDate', endDate);
		}
		if (filterGroupSize && filterGroupSize !== '1') {
			params.set('groupSize', filterGroupSize);
		}
		if (data.referralCode) {
			params.set('ref', data.referralCode);
		}
		const qs = params.toString();
		return `/browse/${listing.id}${qs ? `?${qs}` : ''}`;
	}

	function getSuggestionHref(trip: any, template: any) {
		const params = new URLSearchParams();
		if (trip.date) {
			params.set('date', trip.date);
		}
		if (filterGroupSize && filterGroupSize !== '1') {
			params.set('groupSize', filterGroupSize);
		}
		if (data.referralCode) {
			params.set('ref', data.referralCode);
		}
		const qs = params.toString();
		return `/browse/${template.id}?${qs}`;
	}
</script>

<svelte:head>
	<title>Browse Charters — SplitACharter</title>
</svelte:head>

<div class="browse-wrapper">
	<div class="bg-blur bg-blur-1"></div>
	<div class="bg-blur bg-blur-2"></div>

	<div class="browse-container">
		<header class="browse-header">
			<a href="/" class="back-link">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="2"
					stroke="currentColor"
					class="w-4 h-4"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
				</svg>
				<span>Back to Home</span>
			</a>
			<h1>Available Charters</h1>
			<p class="subtitle">Browse active charters or pick a date to start your own.</p>
		</header>

		<!-- Filters Controls -->
		<div class="controls-card glass">
			<div class="controls-card-header">
				<div class="controls-title-group">
					<span class="controls-title">Filter Charters</span>
				</div>
				{#if hasActiveFilters}
					<button type="button" class="btn-clear-all" onclick={resetAllFilters}>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							class="w-4 h-4"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
							/>
						</svg>
						<span>Clear Filters</span>
					</button>
				{/if}
			</div>

			<div class="filters-group">
				<div class="select-wrapper">
					<label for="start-date">Trip / Start Date</label>
					<input
						type="date"
						id="start-date"
						bind:value={startDate}
						min={minDate}
						class="date-input-field"
						onchange={handleStartDateChange}
					/>
				</div>

				<div class="select-wrapper">
					<div class="label-with-clear">
						<label for="end-date">End Date <span class="optional-tag">(Optional)</span></label>
						{#if endDate}
							<button
								type="button"
								class="btn-clear-date"
								title="Search single day only"
								onclick={() => { endDate = ''; }}
							>
								× Clear
							</button>
						{/if}
					</div>
					<input
						type="date"
						id="end-date"
						bind:value={endDate}
						min={startDate || minDate}
						class="date-input-field"
						onchange={handleEndDateChange}
					/>
				</div>

				<CustomMultiSelect
					id="departure-location"
					label="Departure Location"
					bind:values={filterLocations}
					options={locationOptions}
					placeholder="All Departure Locations"
					itemLabel="Locations Selected"
					allLabel="All Departure Locations"
				/>

				<CustomSelect
					id="group-size"
					label="Your Group Size"
					bind:value={filterGroupSize}
					options={groupSizeOptions}
				/>

				<CustomSelect
					id="duration"
					label="Duration"
					bind:value={filterDuration}
					options={durationOptions}
				/>

				<CustomMultiSelect
					id="trip-type"
					label="Trip Type"
					bind:values={filterTripTypes}
					options={tripTypeOptions}
				/>
			</div>

			<!-- Quick Presets Row: Placed immediately beneath date inputs & above Departure Locations -->
			<div class="quick-presets-row">
				<span class="quick-presets-label">Quick Ranges:</span>
				<div class="preset-buttons">
					<button type="button" class="btn-preset" onclick={() => applyPreset('weekend')}>
						This Weekend
					</button>
					<button type="button" class="btn-preset" onclick={() => applyPreset('7days')}>
						Next 7 Days
					</button>
					<button type="button" class="btn-preset" onclick={() => applyPreset('14days')}>
						Next 14 Days
					</button>
					<button type="button" class="btn-preset" onclick={() => applyPreset('30days')}>
						Next 30 Days
					</button>
					{#if endDate}
						<button
							type="button"
							class="btn-preset btn-preset-clear"
							title="Search single day only"
							onclick={() => { endDate = ''; }}
						>
							Exact Day Only
						</button>
					{/if}
				</div>
			</div>

			</div>

		<div id="browse-listings-start" class="browse-listings-anchor" aria-hidden="true" style="scroll-margin-top: 1.5rem;"></div>
		<!-- ==================== MODE 1: SINGLE DATE MODE ==================== -->
		{#if dateMode === 'single'}
			<!-- Encouraging Banner when no single date selected -->
			{#if !searchDate}
				<div class="encouragement-banner glass">
					<div class="banner-content">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							class="banner-icon"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
							/>
						</svg>
						<div>
							<h3>Charters with 1 of 2 Groups Booked — Join & Confirm Instantly</h3>
							<p>
								These trips are 50% filled. Join as the 2nd group to confirm right away, or <strong
									>select a trip date above</strong
								> to start a fresh trip.
							</p>
						</div>
					</div>
				</div>
			{/if}

			<!-- Suggestions Section (±3 days from searchDate) -->
			{#if suggestedTrips.length > 0}
				<div class="suggestions-panel glass glow-secondary">
					<div class="suggestions-header">
						<span class="pulse-dot"></span>
						<div>
							<h2>Suggested Trips to Join</h2>
							<p>
								One group is already booked for these trips. Join them and your trip confirms
								instantly. No waiting for a second group to find you.
							</p>
						</div>
					</div>

					<div class="suggestions-grid">
						{#each suggestedTrips as trip (trip.id)}
							{@const template = data.listings.find((l) => l.id === trip.listing_template_id)}
							{#if template}
								{@const locParts = parseLocation(template.location)}
								{@const seatsLeft = getRemainingSeats(template, trip)}
								{@const reqGroupSize = parseInt(filterGroupSize, 10) || 1}
								{@const exceedsCapacity = reqGroupSize > seatsLeft}
								<div class="listing-card glass glass-interactive matched-card">
									<div class="card-header">
										<span class="location-badge">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												stroke-width="1.5"
												stroke="currentColor"
												class="w-4 h-4 location-icon"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
												/>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
												/>
											</svg>
											<div class="location-text-group">
												<span class="location-main">{locParts.main}</span>
												{#if locParts.details}
													<span class="location-details">{locParts.details}</span>
												{/if}
											</div>
										</span>
										{#if exceedsCapacity}
											<span class="exceeds-badge"
												>{formatDuration(template.duration)} • {seatsLeft} {seatsLeft === 1 ? 'seat' : 'seats'} left</span
											>
										{:else}
											<span class="active-badge"
												>{formatDuration(template.duration)} • {seatsLeft} {seatsLeft === 1 ? 'seat' : 'seats'} left</span
											>
										{/if}
									</div>

									<div class="card-body">
										<div class="title-row">
											<h3>{template.trip_type}</h3>
											<span class="date-badge">{formatDateDisplay(trip.date)}</span>
										</div>
										<p class="description">{template.description}</p>

										<div class="meeting-row">
											<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width="14" height="14" stroke-width="1.8" stroke="currentColor" class="meeting-icon">
												<path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
												<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
											</svg>
											<span class="meeting-text" title={template.meeting_area}>{formatMeetingArea(template.meeting_area)}</span>
										</div>
									</div>

									<div class="card-footer">
										<div class="price-info">
											<span class="price-split"
												>${Math.round(template.low_price / 2)} – ${Math.round(
													template.high_price / 2
												)} <span class="per-group">/ group</span></span
											>
											<span class="price-total"
												>Total: ${Math.round(template.low_price)}–${Math.round(
													template.high_price
												)}</span
											>
										</div>
										{#if exceedsCapacity}
											<button
												type="button"
												class="btn btn-disabled"
												disabled
												title="Not enough seats remaining for your group size of {reqGroupSize}"
											>
												Exceeds Capacity
											</button>
										{:else}
											<a href={getSuggestionHref(trip, template)} class="btn btn-join">
												Join Group
											</a>
										{/if}
									</div>
								</div>
							{/if}
						{/each}
					</div>
				</div>
			{/if}

			<!-- Listing Cards Grid for Single Date Mode -->
			{#if filteredListings.length === 0}
				<div class="empty-state glass">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="w-12 h-12 empty-icon"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M2.25 13.5h3.86a2.25 2.25 0 012.008 1.24l.885 1.77a2.25 2.25 0 002.007 1.24h1.98a2.25 2.25 0 002.007-1.24l.885-1.77a2.25 2.25 0 012.007-1.24h3.86m-18 0h18a2.25 2.25 0 012.25 2.25v4.25a2.25 2.25 0 01-2.25 2.25H2.25A2.25 2.25 0 010 20v-4.25a2.25 2.25 0 012.25-2.25z"
						/>
					</svg>
					{#if !searchDate}
						<h3>No Active Shared Charters Found</h3>
						<p>
							There are currently no half-filled charters matching these filters. Select a <strong
								>Trip Date</strong
							> in the filters above to explore all charter templates and open a new booking!
						</p>
					{:else}
						<h3>No Charters Match Your Search</h3>
						<p>Try resetting the filters or selecting a different date.</p>
					{/if}
				</div>
			{:else}
				<div class="cards-grid">
					{#each filteredListings as listing (listing.matchedInstance ? listing.matchedInstance.id : listing.id)}
						{@const locParts = parseLocation(listing.location)}
						{@const seatsLeft = getRemainingSeats(listing, listing.matchedInstance)}
						{@const reqGroupSize = parseInt(filterGroupSize, 10) || 1}
						{@const exceedsCapacity = reqGroupSize > seatsLeft}
						<div
							class="listing-card glass glass-interactive"
							class:matched-card={listing.matchedInstance}
						>
							<div class="card-header">
								<span class="location-badge">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="1.5"
										stroke="currentColor"
										class="w-4 h-4 location-icon"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
										/>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
										/>
									</svg>
									<div class="location-text-group">
										<span class="location-main">{locParts.main}</span>
										{#if locParts.details}
											<span class="location-details">{locParts.details}</span>
										{/if}
									</div>
								</span>
								{#if exceedsCapacity}
									<span class="exceeds-badge"
										>{formatDuration(listing.duration)} • {seatsLeft} {seatsLeft === 1 ? 'seat' : 'seats'} left</span
									>
								{:else if listing.matchedInstance}
									<span class="active-badge"
										>{formatDuration(listing.duration)} • {seatsLeft} {seatsLeft === 1 ? 'seat' : 'seats'} left</span
									>
								{:else}
									<span class="pax-badge">{formatDuration(listing.duration)} • {listing.max_passengers} Max Pax</span>
								{/if}
							</div>

							<div class="card-body">
								<div class="title-row">
									<h3>{listing.trip_type}</h3>
									{#if listing.matchedInstance}
										<span class="date-badge">{formatDateDisplay(listing.matchedInstance.date)}</span
										>
									{:else if searchDate}
										<span class="date-badge">{formatDateDisplay(searchDate)}</span>
									{/if}
								</div>
								<p class="description">{listing.description}</p>

								<div class="meeting-row">
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width="14" height="14" stroke-width="1.8" stroke="currentColor" class="meeting-icon">
										<path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
										<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
									</svg>
									<span class="meeting-text" title={listing.meeting_area}>{formatMeetingArea(listing.meeting_area)}</span>
								</div>
							</div>

							<div class="card-footer">
								<div class="price-info">
									<span class="price-split"
										>${Math.round(listing.low_price / 2)} – ${Math.round(listing.high_price / 2)}
										<span class="per-group">/ group</span></span
									>
									<span class="price-total"
										>Total: ${Math.round(listing.low_price)}–${Math.round(listing.high_price)}</span
									>
								</div>
								{#if exceedsCapacity}
									<button
										type="button"
										class="btn btn-disabled"
										disabled
										title="Not enough seats remaining for your group size of {reqGroupSize}"
									>
										Exceeds Capacity
									</button>
								{:else}
									<a
										href={getListingHref(listing)}
										class="btn {listing.matchedInstance ? 'btn-join' : 'btn-book'}"
									>
										{listing.matchedInstance ? 'Join Group' : 'Book Charter'}
									</a>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}

			<!-- ==================== MODE 2: DATE RANGE MODE ==================== -->
		{:else}
			{#if !isRangeDateEntered}
				<!-- Date Range Mode with no date bounds entered yet -->
				<div class="encouragement-banner glass">
					<div class="banner-content">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							class="banner-icon"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
							/>
						</svg>
						<div>
							<h3>Search by Your Travel Dates</h3>
							<p>
								Enter your <strong>Start Date</strong> and <strong>End Date</strong> above (or click
								a quick preset like <strong>Next 7 Days</strong>) to view active charters ready to
								join and open templates for your trip.
							</p>
						</div>
					</div>
				</div>

				<div class="section-container">
					<div class="section-heading-row">
						<div>
							<div class="heading-badge-wrap">
								<span class="pulse-dot"></span>
								<h2 class="section-title">
									All Currently Active Charters ({defaultRangeHalfBookedTrips.length})
								</h2>
							</div>
							<p class="section-subtitle">
								These charters already have 1 group booked. Select your dates above to narrow down
								to your specific travel window.
							</p>
						</div>
					</div>

					{#if defaultRangeHalfBookedTrips.length === 0}
						<div class="empty-state glass">
							<p>
								No active half-booked charters found matching the filters. Pick your travel dates
								above to explore all charter templates!
							</p>
						</div>
					{:else}
						<div class="cards-grid">
							{#each defaultRangeHalfBookedTrips as trip (trip.matchedInstance.id)}
								{@const locParts = parseLocation(trip.location)}
								{@const seatsLeft = getRemainingSeats(trip, trip.matchedInstance)}
								{@const reqGroupSize = parseInt(filterGroupSize, 10) || 1}
								{@const exceedsCapacity = reqGroupSize > seatsLeft}
								<div class="listing-card glass glass-interactive matched-card">
									<div class="card-header">
										<span class="location-badge">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												stroke-width="1.5"
												stroke="currentColor"
												class="w-4 h-4 location-icon"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
												/>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
												/>
											</svg>
											<div class="location-text-group">
												<span class="location-main">{locParts.main}</span>
												{#if locParts.details}
													<span class="location-details">{locParts.details}</span>
												{/if}
											</div>
										</span>
										{#if exceedsCapacity}
											<span class="exceeds-badge"
												>{formatDuration(trip.duration)} • {seatsLeft} {seatsLeft === 1 ? 'seat' : 'seats'} left</span
											>
										{:else}
											<span class="active-badge"
												>{formatDuration(trip.duration)} • {seatsLeft} {seatsLeft === 1 ? 'seat' : 'seats'} left</span
											>
										{/if}
									</div>

									<div class="card-body">
										<div class="title-row">
											<h3>{trip.trip_type}</h3>
											<span class="date-badge">{formatWeekdayDate(trip.matchedInstance.date)}</span>
										</div>
										<p class="description">{trip.description}</p>

										<div class="meeting-row">
											<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width="14" height="14" stroke-width="1.8" stroke="currentColor" class="meeting-icon">
												<path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
												<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
											</svg>
											<span class="meeting-text" title={trip.meeting_area}>{formatMeetingArea(trip.meeting_area)}</span>
										</div>
									</div>

									<div class="card-footer">
										<div class="price-info">
											<span class="price-split"
												>${Math.round(trip.low_price / 2)} – ${Math.round(trip.high_price / 2)}
												<span class="per-group">/ group</span></span
											>
											<span class="price-total"
												>Total: ${Math.round(trip.low_price)}–${Math.round(trip.high_price)}</span
											>
										</div>
										{#if exceedsCapacity}
											<button
												type="button"
												class="btn btn-disabled"
												disabled
												title="Not enough seats remaining for your group size of {reqGroupSize}"
											>
												Exceeds Capacity
											</button>
										{:else}
											<a href={getListingHref(trip)} class="btn btn-join"> Join Group </a>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{:else}
				<!-- Date Range Mode with Start / End Date Active -->
				{#if rangeHalfBookedTrips.length === 0 && rangeTemplates.length === 0}
					<div class="empty-state glass">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							class="w-12 h-12 empty-icon"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M2.25 13.5h3.86a2.25 2.25 0 012.008 1.24l.885 1.77a2.25 2.25 0 002.007 1.24h1.98a2.25 2.25 0 002.007-1.24l.885-1.77a2.25 2.25 0 012.007-1.24h3.86m-18 0h18a2.25 2.25 0 012.25 2.25v4.25a2.25 2.25 0 01-2.25 2.25H2.25A2.25 2.25 0 010 20v-4.25a2.25 2.25 0 012.25-2.25z"
							/>
						</svg>
						<h3>No Charters Match Your Date Range & Filters</h3>
						<p>Try broadening your location, duration, or date range in the filters above.</p>
					</div>
				{:else}
					<!-- Section 1: Charters Ready to Join -->
						<div class="section-container">
							<div class="section-heading-row">
								<div>
									<div class="heading-badge-wrap">
										<span class="pulse-dot"></span>
										<h2 class="section-title">
											Charters Ready to Join ({rangeHalfBookedTrips.length})
										</h2>
									</div>
									<p class="section-subtitle">
										1 of 2 groups is already booked for these dates. Join as the second group to
										confirm immediately with zero waiting!
									</p>
								</div>
							</div>

							{#if rangeHalfBookedTrips.length > 0}
								<div class="cards-grid">
									{#each rangeHalfBookedTrips as trip (trip.matchedInstance.id)}
										{@const locParts = parseLocation(trip.location)}
										{@const seatsLeft = getRemainingSeats(trip, trip.matchedInstance)}
										{@const reqGroupSize = parseInt(filterGroupSize, 10) || 1}
										{@const exceedsCapacity = reqGroupSize > seatsLeft}
										<div class="listing-card glass glass-interactive matched-card">
											<div class="card-header">
												<span class="location-badge">
													<svg
														xmlns="http://www.w3.org/2000/svg"
														fill="none"
														viewBox="0 0 24 24"
														stroke-width="1.5"
														stroke="currentColor"
														class="w-4 h-4 location-icon"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
														/>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
														/>
													</svg>
													<div class="location-text-group">
														<span class="location-main">{locParts.main}</span>
														{#if locParts.details}
															<span class="location-details">{locParts.details}</span>
														{/if}
													</div>
												</span>
												{#if exceedsCapacity}
													<span class="exceeds-badge"
														>{formatDuration(trip.duration)} • {seatsLeft} {seatsLeft === 1 ? 'seat' : 'seats'} left</span
													>
												{:else}
													<span class="active-badge"
														>{formatDuration(trip.duration)} • {seatsLeft} {seatsLeft === 1 ? 'seat' : 'seats'} left</span
													>
												{/if}
											</div>

											<div class="card-body">
												<div class="title-row">
													<h3>{trip.trip_type}</h3>
													<span class="date-badge"
														>{formatWeekdayDate(trip.matchedInstance.date)}</span
													>
												</div>
												<p class="description">{trip.description}</p>

												<div class="meeting-row">
													<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width="14" height="14" stroke-width="1.8" stroke="currentColor" class="meeting-icon">
														<path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
														<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
													</svg>
													<span class="meeting-text" title={trip.meeting_area}>{formatMeetingArea(trip.meeting_area)}</span>
												</div>
											</div>

											<div class="card-footer">
												<div class="price-info">
													<span class="price-split"
														>${Math.round(trip.low_price / 2)} – ${Math.round(trip.high_price / 2)}
														<span class="per-group">/ group</span></span
													>
													<span class="price-total"
														>Total: ${Math.round(trip.low_price)}–${Math.round(
															trip.high_price
														)}</span
													>
												</div>
												{#if exceedsCapacity}
													<button
														type="button"
														class="btn btn-disabled"
														disabled
														title="Not enough seats remaining for your group size of {reqGroupSize}"
													>
														Exceeds Capacity
													</button>
												{:else}
													<a href={getListingHref(trip)} class="btn btn-join"> Join Group </a>
												{/if}
											</div>
										</div>
									{/each}
								</div>
							{:else}
								<div class="empty-range-section glass">
									<p>No half-booked charters found in this date range matching your filters.</p>
								</div>
							{/if}
						</div>

					<!-- Section 2: Start a New Charter -->
						<div class="section-container mt-10">
							<div class="section-heading-row">
								<div>
									<h2 class="section-title">Start a New Charter ({rangeTemplates.length})</h2>
									<p class="section-subtitle">
										Choose a charter type below to start a new shared trip on any date in your range
										({startDate ? formatWeekdayDate(startDate) : 'Today'}{endDate &&
										endDate !== startDate
											? ` – ${formatWeekdayDate(endDate)}`
											: ''}).
									</p>
								</div>
							</div>

							{#if rangeTemplates.length > 0}
								<div class="cards-grid">
									{#each rangeTemplates as template (template.id)}
										{@const locParts = parseLocation(template.location)}
										<div class="listing-card glass glass-interactive">
											<div class="card-header">
												<span class="location-badge">
													<svg
														xmlns="http://www.w3.org/2000/svg"
														fill="none"
														viewBox="0 0 24 24"
														stroke-width="1.5"
														stroke="currentColor"
														class="w-4 h-4 location-icon"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
														/>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
														/>
													</svg>
													<div class="location-text-group">
														<span class="location-main">{locParts.main}</span>
														{#if locParts.details}
															<span class="location-details">{locParts.details}</span>
														{/if}
													</div>
												</span>
												<span class="pax-badge">{formatDuration(template.duration)} • {template.max_passengers} Max Pax</span>
											</div>

											<div class="card-body">
												<div class="title-row">
													<h3>{template.trip_type}</h3>
													<span class="range-date-badge">
														{formatDateRangeDisplay(startDate, endDate)}
													</span>
												</div>
												<p class="description">{template.description}</p>

												<div class="meeting-row">
													<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width="14" height="14" stroke-width="1.8" stroke="currentColor" class="meeting-icon">
														<path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
														<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
													</svg>
													<span class="meeting-text" title={template.meeting_area}>{formatMeetingArea(template.meeting_area)}</span>
												</div>
											</div>

											<div class="card-footer">
												<div class="price-info">
													<span class="price-split"
														>${Math.round(template.low_price / 2)} – ${Math.round(
															template.high_price / 2
														)} <span class="per-group">/ group</span></span
													>
													<span class="price-total"
														>Total: ${Math.round(template.low_price)}–${Math.round(
															template.high_price
														)}</span
													>
												</div>
												<a href={getListingHref(template)} class="btn btn-book"> Book Charter </a>
											</div>
										</div>
									{/each}
								</div>
							{:else}
								<div class="empty-range-section glass">
									<p>
										No charter types match your selected filters. Try broadening your location or
										duration filters.
									</p>
								</div>
							{/if}
						</div>
					{/if}
			{/if}
		{/if}
	</div>
</div>

<style>
	.controls-card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--border-light);
		flex-wrap: wrap;
		gap: 0.75rem;
	}
	.controls-title-group {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
	}
	.controls-title {
		font-size: 0.85rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--text-secondary);
	}
	.date-mode-toggle-group {
		display: inline-flex;
		align-items: center;
		background: var(--input-bg);
		padding: 3px;
		border-radius: 8px;
		border: 1px solid var(--border-light);
		gap: 3px;
	}
	.mode-pill {
		background: transparent;
		border: none;
		color: var(--text-secondary);
		padding: 4px 12px;
		border-radius: 6px;
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}
	.mode-pill:hover {
		color: var(--text-primary);
	}
	.mode-pill.active {
		background: var(--bg-surface-elevated);
		color: var(--primary);
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
	}

	.btn-clear-all {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: rgba(239, 68, 68, 0.08);
		border: 1px solid rgba(239, 68, 68, 0.25);
		color: var(--danger);
		padding: 5px 12px;
		border-radius: 6px;
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}
	.btn-clear-all:hover {
		background: rgba(239, 68, 68, 0.18);
		border-color: var(--danger);
		transform: translateY(-1px);
	}

	/* Quick Presets Row */
	.quick-presets-row {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-top: 1rem;
		padding-top: 0.75rem;
		border-top: 1px dashed var(--border-light);
		flex-wrap: wrap;
	}
	.quick-presets-label {
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	.preset-buttons {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}
	.btn-preset {
		background: var(--input-bg);
		border: 1px solid var(--border-light);
		color: var(--text-secondary);
		padding: 4px 11px;
		border-radius: 6px;
		font-size: 0.78rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}
	.btn-preset:hover {
		background: rgba(6, 182, 212, 0.12);
		border-color: var(--primary);
		color: var(--primary);
		transform: translateY(-1px);
	}

	/* Section Headings */
	.section-container {
		margin-bottom: 2.5rem;
	}
	.section-heading-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1.25rem;
	}
	.heading-badge-wrap {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.section-title {
		font-size: 1.35rem;
		font-weight: 800;
		color: var(--text-primary);
	}
	.section-subtitle {
		font-size: 0.88rem;
		color: var(--text-secondary);
		margin-top: 3px;
	}
	.empty-range-section {
		padding: 2.5rem 1.5rem;
		text-align: center;
		border-radius: 10px;
		border: 1px dashed var(--border-light);
		color: var(--text-secondary);
		font-size: 0.92rem;
	}

	/* Date picker input styling */
	.date-input-field {
		background: var(--input-bg);
		border: 1px solid var(--border-light);
		border-radius: 8px;
		color: var(--text-primary);
		font-family: var(--font-body);
		font-size: 0.95rem;
		padding: 9px 14px;
		width: 100%;
		outline: none;
		transition: border-color 0.2s;
	}
	.date-input-field:focus {
		border-color: var(--primary);
	}

	/* Encouragement Banner */
	.encouragement-banner {
		padding: 1.25rem 1.75rem;
		margin-bottom: 2.5rem;
		border-radius: 12px;
		background: linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(99, 102, 241, 0.08));
		border: 1px solid var(--border-glow);
	}
	.banner-content {
		display: flex;
		align-items: center;
		gap: 1.25rem;
	}
	.banner-icon {
		width: 32px;
		height: 32px;
		color: var(--primary);
		flex-shrink: 0;
	}
	.banner-content h3 {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 2px;
	}
	.banner-content p {
		font-size: 0.9rem;
		color: var(--text-secondary);
	}
	.banner-content strong {
		color: var(--primary);
	}

	/* Suggestions Panel */
	.suggestions-panel {
		border: 1px solid rgba(99, 102, 241, 0.2);
		padding: 1.25rem;
		margin-bottom: 2rem;
		border-radius: 12px;
		background: rgba(99, 102, 241, 0.02);
	}
	.suggestions-header {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		margin-bottom: 1rem;
	}
	.suggestions-header h2 {
		font-size: 1.35rem;
		font-weight: 800;
		color: var(--text-primary);
	}
	.suggestions-header p {
		font-size: 0.85rem;
		color: var(--text-secondary);
		margin-top: 2px;
	}
	.pulse-dot {
		width: 10px;
		height: 10px;
		background: var(--secondary);
		border-radius: 50%;
		flex-shrink: 0;
		margin-top: 6px;
		animation: pulse 2s infinite;
		box-shadow: 0 0 10px var(--secondary);
	}
	@keyframes pulse {
		0% {
			transform: scale(0.95);
			box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7);
		}
		70% {
			transform: scale(1);
			box-shadow: 0 0 0 8px rgba(99, 102, 241, 0);
		}
		100% {
			transform: scale(0.95);
			box-shadow: 0 0 0 0 rgba(99, 102, 241, 0);
		}
	}
	.suggestions-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.25rem;
	}

	.exceeds-badge {
		background: rgba(239, 68, 68, 0.18);
		color: var(--danger);
		border: 1px solid rgba(239, 68, 68, 0.4);
		padding: 3px 10px;
		border-radius: 6px;
		font-size: 0.78rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		white-space: nowrap;
		flex-shrink: 0;
	}
	.btn-disabled {
		background: var(--input-bg) !important;
		color: var(--text-muted) !important;
		border: 1px solid var(--border-light) !important;
		cursor: not-allowed !important;
		opacity: 0.6;
		box-shadow: none !important;
		transform: none !important;
	}

	/* Card Badge customizations */
	.active-badge {
		background: rgba(99, 102, 241, 0.18);
		color: var(--secondary);
		border: 1px solid rgba(99, 102, 241, 0.4);
		padding: 3px 10px;
		border-radius: 6px;
		font-size: 0.78rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		white-space: nowrap;
		flex-shrink: 0;
	}
	.date-badge {
		background: rgba(6, 182, 212, 0.16);
		border: 1px solid var(--border-glow);
		color: var(--primary);
		padding: 4px 10px;
		border-radius: 6px;
		font-size: 0.82rem;
		font-weight: 700;
		white-space: nowrap;
		box-shadow: 0 2px 8px rgba(6, 182, 212, 0.15);
	}
	.range-date-badge {
		background: rgba(99, 102, 241, 0.14);
		border: 1px solid rgba(99, 102, 241, 0.3);
		color: var(--secondary);
		padding: 3px 8px;
		border-radius: 6px;
		font-size: 0.76rem;
		font-weight: 600;
		white-space: nowrap;
		letter-spacing: -0.01em;
		flex-shrink: 0;
	}
	.title-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 6px 10px;
		margin-bottom: 8px;
	}
	.title-row h3 {
		margin-bottom: 0 !important;
	}
	.matched-card {
		border-color: rgba(99, 102, 241, 0.3) !important;
		background: rgba(99, 102, 241, 0.01) !important;
	}
	.matched-card:hover {
		border-color: var(--secondary) !important;
		box-shadow: 0 12px 40px 0 rgba(99, 102, 241, 0.15) !important;
	}

	.browse-wrapper {
		min-height: 100vh;
		position: relative;
		overflow-x: clip;
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
		width: 450px;
		height: 450px;
		top: -5%;
		right: 10%;
	}
	.bg-blur-2 {
		background: var(--secondary);
		width: 450px;
		height: 450px;
		bottom: -5%;
		left: 10%;
	}

	.browse-container {
		max-width: 1200px;
		margin: 0 auto;
		width: 100%;
		z-index: 2;
		position: relative;
	}

	.browse-header {
		margin-bottom: 2.5rem;
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
	.browse-header h1 {
		font-size: 2.5rem;
		font-weight: 800;
		letter-spacing: -0.7px;
	}
	.subtitle {
		font-size: 1.05rem;
		color: var(--text-secondary);
		margin-top: 0.5rem;
		max-width: 600px;
		line-height: 1.5;
	}

	/* Controls Card */
	.controls-card {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		padding: 1.5rem;
		margin-bottom: 3rem;
		border: 1px solid var(--border-light);
		position: relative;
		z-index: 50;
	}

	.filters-group {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 1.25rem;
		width: 100%;
		align-items: flex-end;
	}
	.select-wrapper {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.select-wrapper label {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	/* Grid and Cards */
	.cards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.25rem;
	}
	.listing-card {
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		border: 1px solid var(--border-light);
		min-height: 320px;
	}
	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 6px 10px;
		margin-bottom: 0.75rem;
	}
	.location-badge {
		background: var(--input-bg);
		border: 1px solid var(--border-light);
		padding: 5px 10px;
		border-radius: 8px;
		display: inline-flex;
		align-items: center;
		gap: 8px;
	}
	.location-icon {
		flex-shrink: 0;
		color: var(--primary);
	}
	.location-text-group {
		display: flex;
		flex-direction: column;
		line-height: 1.2;
	}
	.location-main {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--text-primary);
	}
	.location-details {
		font-size: 0.72rem;
		color: var(--text-muted);
		font-weight: 400;
	}
	.pax-badge {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--primary);
	}

	.card-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		margin-bottom: 1rem;
	}
	.card-body h3 {
		font-size: 1.2rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
		letter-spacing: -0.2px;
	}
	.description {
		font-size: 0.85rem;
		color: var(--text-secondary);
		line-height: 1.4;
		margin-bottom: 0.65rem;
		display: -webkit-box;
		-webkit-line-clamp: 4;
		line-clamp: 4;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.meeting-row {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.78rem;
		border-top: 1px solid var(--border-light);
		padding-top: 0.65rem;
		margin-top: auto;
		min-width: 0;
	}
	.meeting-icon {
		width: 14px;
		height: 14px;
		min-width: 14px;
		min-height: 14px;
		flex-shrink: 0;
		color: var(--primary);
		opacity: 0.85;
	}
	.meeting-text {
		font-weight: 500;
		color: var(--text-secondary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}


	.card-footer {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		flex-wrap: nowrap;
		gap: 0.5rem;
		border-top: 1px solid var(--border-light);
		padding-top: 0.75rem;
		margin-top: auto;
	}
	.price-info {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		text-align: left;
		min-width: 0;
		flex-shrink: 1;
	}
	.price-split {
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: 1.05rem;
		color: var(--text-primary);
		line-height: 1.15;
		white-space: nowrap;
	}
	.per-group {
		font-size: 0.7rem;
		color: var(--text-muted);
		font-weight: 400;
		font-family: var(--font-body);
	}
	.price-total {
		font-size: 0.68rem;
		color: var(--text-muted);
		margin-top: 1px;
		white-space: nowrap;
	}

	/* Centered custom pill buttons */
	.btn-join {
		background: linear-gradient(135deg, #818cf8, var(--secondary));
		color: #ffffff !important;
		font-weight: 700;
		text-transform: uppercase;
		font-size: 0.76rem;
		letter-spacing: 0.4px;
		padding: 9px 15px;
		min-height: 38px;
		border-radius: 30px;
		white-space: nowrap;
		flex-shrink: 0;
		text-align: center;
		border: 1px solid rgba(255, 255, 255, 0.15);
		box-shadow: 0 0 12px rgba(99, 102, 241, 0.35);
		transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}
	.btn-join:hover {
		transform: translateY(-2px) scale(1.02);
		box-shadow: 0 0 20px rgba(99, 102, 241, 0.55);
	}

	.btn-book {
		background: linear-gradient(135deg, var(--primary), var(--primary-hover));
		color: #060913 !important;
		font-weight: 800;
		text-transform: uppercase;
		font-size: 0.76rem;
		letter-spacing: 0.4px;
		padding: 9px 15px;
		min-height: 38px;
		border-radius: 30px;
		white-space: nowrap;
		flex-shrink: 0;
		text-align: center;
		box-shadow: 0 3px 12px rgba(6, 182, 212, 0.25);
		transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}
	.btn-book:hover {
		transform: translateY(-2px) scale(1.02);
		box-shadow: 0 4px 16px rgba(6, 182, 212, 0.4);
	}

	.card-footer .btn-disabled {
		font-weight: 700;
		text-transform: uppercase;
		font-size: 0.76rem;
		letter-spacing: 0.4px;
		padding: 9px 14px;
		min-height: 38px;
		border-radius: 30px;
		white-space: nowrap;
		flex-shrink: 0;
		text-align: center;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.empty-state {
		padding: 5rem 2rem;
		text-align: center;
		border: 1px solid var(--border-light);
	}
	.empty-icon {
		color: var(--text-muted);
		margin-bottom: 1.5rem;
		display: inline-block;
	}
	.empty-state h3 {
		font-size: 1.35rem;
		margin-bottom: 0.5rem;
	}
	.empty-state p {
		color: var(--text-secondary);
		max-width: 400px;
		margin: 0 auto;
	}

	.mt-3 {
		margin-top: 0.75rem;
	}
	.mt-10 {
		margin-top: 2.5rem;
	}

	@media (max-width: 992px) {
		.controls-card {
			flex-direction: column;
			align-items: stretch;
			gap: 1rem;
		}
		.filters-group {
			width: 100%;
		}
		.summary-top-row {
			flex-direction: column;
			align-items: flex-start;
		}
	}
	@media (max-width: 576px) {
		.browse-wrapper {
			padding: 1.5rem 0.75rem;
		}
		.cards-grid {
			grid-template-columns: 1fr;
			gap: 1rem;
		}
		.listing-card {
			padding: 1rem;
		}
		.card-footer {
			gap: 0.5rem;
		}
		.card-footer .btn-book,
		.card-footer .btn-join,
		.card-footer .btn-disabled {
			min-height: 40px;
			padding: 9px 16px;
		}
		.filters-group {
			grid-template-columns: 1fr;
			gap: 1rem;
		}
		.range-tabs-group {
			width: 100%;
			overflow-x: auto;
		}
		.range-tab-btn {
			flex: 1;
			text-align: center;
		}
	}

	/* Location Nudge Card */
	/* Optional Date Field Styling */
	.label-with-clear {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.optional-tag {
		font-weight: normal;
		font-size: 0.72rem;
		color: var(--text-muted);
		text-transform: none;
	}
	.btn-clear-date {
		background: none;
		border: none;
		color: var(--primary);
		font-size: 0.72rem;
		font-weight: 600;
		cursor: pointer;
		padding: 0;
		margin: 0;
	}
	.btn-clear-date:hover {
		text-decoration: underline;
	}
	.btn-preset-clear {
		border-color: rgba(239, 68, 68, 0.4);
		color: #f87171;
	}
	.btn-preset-clear:hover {
		background: rgba(239, 68, 68, 0.12);
		border-color: #ef4444;
		color: #ef4444;
	}
	.browse-listings-anchor {
		height: 0;
		width: 100%;
		display: block;
	}

	</style>
