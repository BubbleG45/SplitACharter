<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let { data } = $props();

	// Active tab
	let activeTab = $derived(data.activeTab);

	// Date preset state for performance and accounting
	let selectedPreset = $state('this_month');
	let customStartDate = $state('');
	let customEndDate = $state('');
	let showCustomRangePicker = $state(false);

	// Search state for customers
	let customerSearch = $state('');

	// Ad-hoc query state
	let adhocDataset = $state('bookings');
	let adhocStatus = $state('all');
	let adhocLimit = $state(50);
	let adhocSearch = $state('');
	let selectedFields = $state<string[]>([]);

	$effect(() => {
		selectedPreset = data.dateBounds?.preset || 'this_month';
		customStartDate = data.dateBounds?.startDateStr || '';
		customEndDate = data.dateBounds?.endDateStr || '';
		showCustomRangePicker = data.dateBounds?.preset === 'custom';
		customerSearch = data.searchTerm || '';
		adhocDataset = data.adhocDataset || 'bookings';
		adhocStatus = data.adhocStatus || 'all';
		adhocLimit = data.adhocLimit || 50;
		adhocSearch = data.searchTerm || '';
		selectedFields =
			data.adhocData?.selectedKeys ||
			data.adhocData?.availableFields?.filter((f: any) => f.defaultSelected).map((f: any) => f.key) ||
			[];
	});

	function switchTab(newTab: string) {
		const url = new URL($page.url);
		url.searchParams.set('tab', newTab);
		goto(url.toString(), { keepFocus: true, noScroll: true });
	}

	function applyDatePreset(preset: string) {
		selectedPreset = preset as any;
		if (preset === 'custom') {
			showCustomRangePicker = true;
			return;
		}
		showCustomRangePicker = false;
		const url = new URL($page.url);
		url.searchParams.set('preset', preset);
		url.searchParams.delete('start');
		url.searchParams.delete('end');
		goto(url.toString(), { keepFocus: true, noScroll: true });
	}

	function applyCustomDateRange() {
		if (!customStartDate || !customEndDate) return;
		const url = new URL($page.url);
		url.searchParams.set('preset', 'custom');
		url.searchParams.set('start', customStartDate);
		url.searchParams.set('end', customEndDate);
		goto(url.toString(), { keepFocus: true, noScroll: true });
	}

	function handleCustomerSearch(e: SubmitEvent) {
		e.preventDefault();
		const url = new URL($page.url);
		if (customerSearch.trim()) {
			url.searchParams.set('q', customerSearch.trim());
		} else {
			url.searchParams.delete('q');
		}
		goto(url.toString(), { keepFocus: true, noScroll: true });
	}

	function handleAdhocSubmit(e: SubmitEvent) {
		e.preventDefault();
		const url = new URL($page.url);
		url.searchParams.set('tab', 'adhoc');
		url.searchParams.set('dataset', adhocDataset);
		url.searchParams.set('status', adhocStatus);
		url.searchParams.set('limit', String(adhocLimit));
		if (adhocSearch.trim()) {
			url.searchParams.set('q', adhocSearch.trim());
		} else {
			url.searchParams.delete('q');
		}
		if (selectedFields.length > 0) {
			url.searchParams.set('fields', selectedFields.join(','));
		} else {
			url.searchParams.delete('fields');
		}
		goto(url.toString(), { keepFocus: true, noScroll: true });
	}

	function toggleField(fieldKey: string) {
		if (selectedFields.includes(fieldKey)) {
			if (selectedFields.length > 1) {
				selectedFields = selectedFields.filter((f) => f !== fieldKey);
			}
		} else {
			selectedFields = [...selectedFields, fieldKey];
		}
	}

	function selectAllFields() {
		if (data.adhocData?.availableFields) {
			selectedFields = data.adhocData.availableFields.map((f: any) => f.key);
		}
	}

	function resetDefaultFields() {
		if (data.adhocData?.availableFields) {
			selectedFields = data.adhocData.availableFields
				.filter((f: any) => f.defaultSelected)
				.map((f: any) => f.key);
		}
	}

	/**
	 * Generic CSV Export Helper
	 */
	function exportToCsv(filename: string, headers: { label: string; key: string }[], rows: any[]) {
		if (!rows || rows.length === 0) {
			alert('No records available to export.');
			return;
		}

		const headerLine = headers.map((h) => `"${h.label.replace(/"/g, '""')}"`).join(',');
		const rowLines = rows.map((row) =>
			headers
				.map((h) => {
					let val = row[h.key];
					if (val === null || val === undefined) val = '';
					else if (typeof val === 'object') val = JSON.stringify(val);
					return `"${String(val).replace(/"/g, '""')}"`;
				})
				.join(',')
		);

		const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headerLine, ...rowLines].join('\r\n');
		const encodedUri = encodeURI(csvContent);
		const link = document.createElement('a');
		link.setAttribute('href', encodedUri);
		link.setAttribute('download', `${filename}-${new Date().toISOString().slice(0, 10)}.csv`);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
</script>

<svelte:head>
	<title>Admin Reports & Analytics — SplitACharter</title>
</svelte:head>

<div class="reports-page">
	<!-- Page Header -->
	<div class="page-header">
		<div>
			<span class="subtitle">Platform Intelligence & Auditing</span>
			<h1>Admin Reports</h1>
		</div>
		<div class="header-actions">
			<a href="/admin" class="btn btn-secondary btn-sm">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
					<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
				</svg>
				Back to Dashboard
			</a>
		</div>
	</div>

	<!-- Navigation Tabs -->
	<div class="tabs-container glass">
		<button
			class="tab-btn {activeTab === 'performance' ? 'active' : ''}"
			onclick={() => switchTab('performance')}
		>
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
			</svg>
			Performance
		</button>
		<button
			class="tab-btn {activeTab === 'operations' ? 'active' : ''}"
			onclick={() => switchTab('operations')}
		>
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
			</svg>
			Operations
		</button>
		<button
			class="tab-btn {activeTab === 'customers' ? 'active' : ''}"
			onclick={() => switchTab('customers')}
		>
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
			</svg>
			Customers
		</button>
		<button
			class="tab-btn {activeTab === 'accounting' ? 'active' : ''}"
			onclick={() => switchTab('accounting')}
		>
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			Accounting
		</button>
		<button
			class="tab-btn {activeTab === 'adhoc' ? 'active' : ''}"
			onclick={() => switchTab('adhoc')}
		>
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
			</svg>
			Ad-Hoc Explorer
		</button>
	</div>

	<!-- Date Presets Bar (Used by Performance & Accounting) -->
	{#if activeTab === 'performance' || activeTab === 'accounting'}
		<div class="preset-filter-bar glass">
			<div class="preset-label">
				<span class="dot"></span>
				<strong>Date Range:</strong> {data.dateBounds.label}
			</div>
			<div class="preset-buttons">
				{#each [
					{ key: 'today', label: 'Today' },
					{ key: 'yesterday', label: 'Yesterday' },
					{ key: 'this_week', label: 'This Week' },
					{ key: 'last_week', label: 'Last Week' },
					{ key: 'this_month', label: 'This Month' },
					{ key: 'last_month', label: 'Last Month' },
					{ key: 'this_year', label: 'This Year' },
					{ key: 'last_year', label: 'Last Year' },
					{ key: 'custom', label: 'Custom' }
				] as p}
					<button
						class="preset-chip {selectedPreset === p.key ? 'active' : ''}"
						onclick={() => applyDatePreset(p.key)}
					>
						{p.label}
					</button>
				{/each}
			</div>
		</div>

		{#if showCustomRangePicker}
			<div class="custom-range-card glass">
				<div class="custom-range-inputs">
					<label>
						<span>Start Date</span>
						<input type="date" bind:value={customStartDate} class="form-input" />
					</label>
					<label>
						<span>End Date</span>
						<input type="date" bind:value={customEndDate} class="form-input" />
					</label>
					<button class="btn btn-primary btn-sm" onclick={applyCustomDateRange}>
						Apply Custom Range
					</button>
				</div>
			</div>
		{/if}
	{/if}

	<!-- TAB CONTENT: PERFORMANCE -->
	{#if activeTab === 'performance' && data.performanceData}
		{@const perf = data.performanceData}

		<!-- Performance Stats -->
		<div class="stats-row">
			<div class="stat-card glass">
				<span class="stat-label">Gross Sales</span>
				<span class="stat-number">${perf.metrics.grossSales.toFixed(2)}</span>
				<span class="stat-sub">{perf.metrics.totalBookingsCount} deposit transactions</span>
			</div>
			<div class="stat-card glass">
				<span class="stat-label">Refunds Processed</span>
				<span class="stat-number text-danger">${perf.metrics.refundedAmount.toFixed(2)}</span>
				<span class="stat-sub">Deducted from sales</span>
			</div>
			<div class="stat-card glass">
				<span class="stat-label">Net Platform Sales</span>
				<span class="stat-number text-success">${perf.metrics.netSales.toFixed(2)}</span>
				<span class="stat-sub">Retained reservation deposits</span>
			</div>
			<div class="stat-card glass">
				<span class="stat-label">Total Passengers</span>
				<span class="stat-number">{perf.metrics.totalPassengers}</span>
				<span class="stat-sub">Across booked groups</span>
			</div>
			<div class="stat-card glass">
				<span class="stat-label">Confirmed Trips</span>
				<span class="stat-number">{perf.metrics.confirmedTripsCount}</span>
				<span class="stat-sub">Fully matched charters</span>
			</div>
		</div>

		<!-- Sales By Trip Type -->
		<div class="section-card glass">
			<div class="section-header">
				<div>
					<h2>Sales by Trip Type</h2>
					<p class="section-desc">Performance and reservation volume grouped by charter activity</p>
				</div>
				<button
					class="btn btn-secondary btn-sm"
					onclick={() =>
						exportToCsv(
							'sales-by-trip-type',
							[
								{ label: 'Trip Type', key: 'tripType' },
								{ label: 'Bookings Count', key: 'count' },
								{ label: 'Passengers', key: 'passengers' },
								{ label: 'Gross Sales ($)', key: 'grossSales' },
								{ label: 'Refunds ($)', key: 'refunds' },
								{ label: 'Net Sales ($)', key: 'netSales' }
							],
							perf.salesByTripType
						)}
				>
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
					</svg>
					Export CSV
				</button>
			</div>

			<div class="table-responsive">
				<table class="report-table">
					<thead>
						<tr>
							<th>Trip Type</th>
							<th>Bookings</th>
							<th>Passengers</th>
							<th>Gross Sales</th>
							<th>Refunds</th>
							<th>Net Sales</th>
							<th>% of Total</th>
						</tr>
					</thead>
					<tbody>
						{#if perf.salesByTripType.length === 0}
							<tr>
								<td colspan="7" class="empty-cell">No sales recorded for this date range.</td>
							</tr>
						{:else}
							{#each perf.salesByTripType as item}
								{@const pct = perf.metrics.grossSales > 0 ? ((item.grossSales / perf.metrics.grossSales) * 100).toFixed(1) : '0'}
								<tr>
									<td><strong>{item.tripType}</strong></td>
									<td>{item.count}</td>
									<td>{item.passengers}</td>
									<td>${item.grossSales.toFixed(2)}</td>
									<td class="text-danger">{item.refunds > 0 ? `-$${item.refunds.toFixed(2)}` : '$0.00'}</td>
									<td class="text-success"><strong>${item.netSales.toFixed(2)}</strong></td>
									<td><span class="badge">{pct}%</span></td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
		</div>

		<!-- Confirmed Trips -->
		<div class="section-card glass">
			<div class="section-header">
				<div>
					<h2>Confirmed Trips</h2>
					<p class="section-desc">Charters with 2-of-2 reconfirmed bookings and captain assignment</p>
				</div>
				<button
					class="btn btn-secondary btn-sm"
					onclick={() =>
						exportToCsv(
							'confirmed-trips',
							[
								{ label: 'Date', key: 'date' },
								{ label: 'Trip Type', key: 'tripType' },
								{ label: 'Location', key: 'location' },
								{ label: 'Captain', key: 'captainName' },
								{ label: 'Charter', key: 'charterName' },
								{ label: 'Groups', key: 'groupsCount' },
								{ label: 'Total Passengers', key: 'totalPassengers' },
								{ label: 'Deposit Revenue ($)', key: 'depositRevenue' },
								{ label: 'Status', key: 'status' }
							],
							perf.confirmedTrips
						)}
				>
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
					</svg>
					Export CSV
				</button>
			</div>

			<div class="table-responsive">
				<table class="report-table">
					<thead>
						<tr>
							<th>Date</th>
							<th>Trip Type</th>
							<th>Location</th>
							<th>Captain</th>
							<th>Groups / Pax</th>
							<th>Deposit Revenue</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						{#if perf.confirmedTrips.length === 0}
							<tr>
								<td colspan="7" class="empty-cell">No confirmed trips found.</td>
							</tr>
						{:else}
							{#each perf.confirmedTrips as trip}
								<tr>
									<td><strong>{trip.date}</strong></td>
									<td>{trip.tripType}</td>
									<td>{trip.location}</td>
									<td>
										<div><strong>{trip.captainName}</strong></div>
										{#if trip.charterName}
											<small class="text-secondary">{trip.charterName}</small>
										{/if}
									</td>
									<td>{trip.groupsCount} groups ({trip.totalPassengers} pax)</td>
									<td><strong>${trip.depositRevenue.toFixed(2)}</strong></td>
									<td><span class="badge status-badge trip-{trip.status}">{trip.status}</span></td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
		</div>
	{/if}

	<!-- TAB CONTENT: OPERATIONS -->
	{#if activeTab === 'operations' && data.operationsData}
		{@const ops = data.operationsData}

		<div class="stats-row">
			<div class="stat-card glass">
				<span class="stat-label">Captains with Promo Codes</span>
				<span class="stat-number">{ops.activeCaptainsWithCodes}</span>
				<span class="stat-sub">Enabled for referral tracking</span>
			</div>
			<div class="stat-card glass">
				<span class="stat-label">Referred Bookings</span>
				<span class="stat-number">{ops.totalPromoBookings}</span>
				<span class="stat-sub">Groups entered captain code</span>
			</div>
			<div class="stat-card glass">
				<span class="stat-label">Referred Deposit Revenue</span>
				<span class="stat-number text-success">${ops.totalPromoRevenue.toFixed(2)}</span>
				<span class="stat-sub">From captain promotional codes</span>
			</div>
		</div>

		<div class="section-card glass">
			<div class="section-header">
				<div>
					<h2>Captains Promocode Use Report</h2>
					<p class="section-desc">Performance of captain referral codes during customer reservation checkout</p>
				</div>
				<button
					class="btn btn-secondary btn-sm"
					onclick={() =>
						exportToCsv(
							'captains-promocode-use',
							[
								{ label: 'Captain Name', key: 'captainName' },
								{ label: 'Charter Name', key: 'charterName' },
								{ label: 'Promo Code', key: 'promoCode' },
								{ label: 'Active', key: 'active' },
								{ label: 'Trips Referenced', key: 'tripsReferenced' },
								{ label: 'Confirmed Trips', key: 'confirmedTripsCount' },
								{ label: 'Bookings Generated', key: 'bookingsGenerated' },
								{ label: 'Total Passengers', key: 'totalPassengers' },
								{ label: 'Deposit Revenue ($)', key: 'depositRevenue' },
								{ label: 'Last Used Date', key: 'lastUsedDate' }
							],
							ops.promoReport
						)}
				>
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
					</svg>
					Export CSV
				</button>
			</div>

			<div class="table-responsive">
				<table class="report-table">
					<thead>
						<tr>
							<th>Captain & Charter</th>
							<th>Promo Code</th>
							<th>Trips Ref.</th>
							<th>Confirmed Trips</th>
							<th>Bookings</th>
							<th>Total Pax</th>
							<th>Deposit Revenue</th>
							<th>Last Used</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						{#if ops.promoReport.length === 0}
							<tr>
								<td colspan="9" class="empty-cell">No captains or promo codes registered yet.</td>
							</tr>
						{:else}
							{#each ops.promoReport as r}
								<tr>
									<td>
										<strong>{r.captainName}</strong>
										{#if r.charterName}
											<br /><small class="text-secondary">{r.charterName}</small>
										{/if}
									</td>
									<td><code>{r.promoCode}</code></td>
									<td>{r.tripsReferenced}</td>
									<td>{r.confirmedTripsCount}</td>
									<td><strong>{r.bookingsGenerated}</strong></td>
									<td>{r.totalPassengers}</td>
									<td class="text-success"><strong>${r.depositRevenue.toFixed(2)}</strong></td>
									<td>{r.lastUsedDate ? new Date(r.lastUsedDate).toLocaleDateString() : 'Never'}</td>
									<td>
										<span class="badge {r.active ? 'badge-active' : 'badge-inactive'}">
											{r.active ? 'Active' : 'Inactive'}
										</span>
									</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
		</div>
	{/if}

	<!-- TAB CONTENT: CUSTOMERS -->
	{#if activeTab === 'customers' && data.customersData}
		{@const cust = data.customersData}

		<div class="stats-row">
			<div class="stat-card glass">
				<span class="stat-label">Total Customers</span>
				<span class="stat-number">{cust.totalCustomers}</span>
				<span class="stat-sub">Registered accounts</span>
			</div>
			<div class="stat-card glass">
				<span class="stat-label">SMS Opt-In Count</span>
				<span class="stat-number">{cust.smsOptInCount}</span>
				<span class="stat-sub">{cust.totalCustomers > 0 ? ((cust.smsOptInCount / cust.totalCustomers) * 100).toFixed(0) : 0}% opt-in rate</span>
			</div>
			<div class="stat-card glass">
				<span class="stat-label">Flagged / Restricted</span>
				<span class="stat-number text-danger">{cust.flaggedCount}</span>
				<span class="stat-sub">Policy enforcement</span>
			</div>
		</div>

		<div class="section-card glass">
			<div class="section-header">
				<div>
					<h2>Customer Directory & Contact Info</h2>
					<p class="section-desc">Customer profiles, contact details, SMS preferences, and booking history</p>
				</div>
				<div class="section-actions">
					<form onsubmit={handleCustomerSearch} class="search-form">
						<input
							type="search"
							bind:value={customerSearch}
							placeholder="Search name, email, phone..."
							class="form-input search-input"
						/>
						<button type="submit" class="btn btn-secondary btn-sm">Search</button>
					</form>
					<button
						class="btn btn-secondary btn-sm"
						onclick={() =>
							exportToCsv(
								'customer-contact-directory',
								[
									{ label: 'Full Name', key: 'name' },
									{ label: 'Email Address', key: 'email' },
									{ label: 'Phone Number', key: 'phone' },
									{ label: 'SMS Opt-In', key: 'smsOptIn' },
									{ label: 'Location', key: 'location' },
									{ label: 'How Heard', key: 'howHeard' },
									{ label: 'Experience Level', key: 'experience' },
									{ label: 'Total Bookings', key: 'totalBookings' },
									{ label: 'Lifetime Spend ($)', key: 'lifetimeSpend' },
									{ label: 'Strikes', key: 'strikeCount' },
									{ label: 'Flagged', key: 'flagged' },
									{ label: 'Registered Date', key: 'createdAt' }
								],
								cust.customers
							)}
					>
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
							<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
						</svg>
						Export CSV
					</button>
				</div>
			</div>

			<div class="table-responsive">
				<table class="report-table">
					<thead>
						<tr>
							<th>Customer</th>
							<th>Contact Info</th>
							<th>SMS Opt-In</th>
							<th>Location</th>
							<th>Bookings</th>
							<th>Lifetime Spend</th>
							<th>Joined</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						{#if cust.customers.length === 0}
							<tr>
								<td colspan="8" class="empty-cell">No customers found matching your criteria.</td>
							</tr>
						{:else}
							{#each cust.customers as c}
								<tr>
									<td>
										<strong>{c.name}</strong>
										{#if c.experience !== 'Not specified'}
											<br /><small class="text-secondary">Exp: {c.experience}</small>
										{/if}
									</td>
									<td>
										<div><a href="mailto:{c.email}" class="text-link">{c.email}</a></div>
										<div><a href="tel:{c.phone}" class="text-secondary">{c.phone}</a></div>
									</td>
									<td>
										<span class="badge {c.smsOptIn ? 'badge-active' : 'badge-inactive'}">
											{c.smsOptIn ? 'Opted In' : 'No'}
										</span>
									</td>
									<td>{c.location}</td>
									<td>{c.totalBookings}</td>
									<td><strong>${c.lifetimeSpend.toFixed(2)}</strong></td>
									<td>{new Date(c.createdAt).toLocaleDateString()}</td>
									<td>
										{#if c.flagged}
											<span class="badge badge-flagged">Flagged</span>
										{:else if c.strikeCount > 0}
											<span class="badge badge-warning">{c.strikeCount} Strike(s)</span>
										{:else}
											<span class="badge badge-clean">Good Standing</span>
										{/if}
									</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
		</div>
	{/if}

	<!-- TAB CONTENT: ACCOUNTING -->
	{#if activeTab === 'accounting' && data.accountingData}
		{@const acct = data.accountingData}

		<div class="stats-row">
			<div class="stat-card glass">
				<span class="stat-label">Gross Deposits Collected</span>
				<span class="stat-number">${acct.metrics.totalDeposits.toFixed(2)}</span>
				<span class="stat-sub">{acct.metrics.depositCount} $50 reservations</span>
			</div>
			<div class="stat-card glass">
				<span class="stat-label">Refunds Processed</span>
				<span class="stat-number text-danger">${acct.metrics.totalRefunds.toFixed(2)}</span>
				<span class="stat-sub">{acct.metrics.refundCount} refunds issued</span>
			</div>
			<div class="stat-card glass">
				<span class="stat-label">Net Platform Revenue</span>
				<span class="stat-number text-success">${acct.metrics.netRetained.toFixed(2)}</span>
				<span class="stat-sub">Retained revenue</span>
			</div>
		</div>

		<!-- Revenue by Trip Type -->
		<div class="section-card glass">
			<div class="section-header">
				<div>
					<h2>Revenue by Trip Type</h2>
					<p class="section-desc">Net reservation earnings broken down by activity categories</p>
				</div>
				<button
					class="btn btn-secondary btn-sm"
					onclick={() =>
						exportToCsv(
							'revenue-by-trip-type',
							[
								{ label: 'Trip Type', key: 'tripType' },
								{ label: 'Deposits ($)', key: 'deposits' },
								{ label: 'Refunds ($)', key: 'refunds' },
								{ label: 'Net Revenue ($)', key: 'netRevenue' },
								{ label: 'Transactions', key: 'transactionCount' }
							],
							acct.revenueByTripType
						)}
				>
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
					</svg>
					Export CSV
				</button>
			</div>

			<div class="table-responsive">
				<table class="report-table">
					<thead>
						<tr>
							<th>Trip Type</th>
							<th>Deposits</th>
							<th>Refunds</th>
							<th>Net Revenue</th>
							<th>Transactions</th>
						</tr>
					</thead>
					<tbody>
						{#if acct.revenueByTripType.length === 0}
							<tr>
								<td colspan="5" class="empty-cell">No transaction revenue found for this date range.</td>
							</tr>
						{:else}
							{#each acct.revenueByTripType as item}
								<tr>
									<td><strong>{item.tripType}</strong></td>
									<td>${item.deposits.toFixed(2)}</td>
									<td class="text-danger">{item.refunds > 0 ? `-$${item.refunds.toFixed(2)}` : '$0.00'}</td>
									<td class="text-success"><strong>${item.netRevenue.toFixed(2)}</strong></td>
									<td>{item.transactionCount}</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
		</div>

		<!-- Stripe Bank Payout Transfers -->
		<div class="section-card glass">
			<div class="section-header">
				<div>
					<h2>Stripe Bank Payout Transfers</h2>
					<p class="section-desc">Automated platform payouts disbursed from Stripe to SplitACharter's bank account</p>
				</div>
				<button
					class="btn btn-secondary btn-sm"
					onclick={() =>
						exportToCsv(
							'stripe-bank-payouts',
							[
								{ label: 'Payout ID', key: 'id' },
								{ label: 'Amount ($)', key: 'amount' },
								{ label: 'Currency', key: 'currency' },
								{ label: 'Status', key: 'status' },
								{ label: 'Method', key: 'method' },
								{ label: 'Type', key: 'type' },
								{ label: 'Arrival Date', key: 'arrivalDate' }
							],
							acct.stripePayouts
						)}
				>
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
					</svg>
					Export CSV
				</button>
			</div>

			{#if acct.isStripeMock}
				<div class="notice-banner glass">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-accent">
						<path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
					</svg>
					<span>Showing simulated Stripe sandbox payout records for development environment.</span>
				</div>
			{/if}

			<div class="table-responsive">
				<table class="report-table">
					<thead>
						<tr>
							<th>Payout ID</th>
							<th>Amount</th>
							<th>Status</th>
							<th>Method</th>
							<th>Arrival Date</th>
						</tr>
					</thead>
					<tbody>
						{#if acct.stripePayouts.length === 0}
							<tr>
								<td colspan="5" class="empty-cell">No bank payouts recorded in Stripe.</td>
							</tr>
						{:else}
							{#each acct.stripePayouts as payout}
								<tr>
									<td><code>{payout.id}</code></td>
									<td><strong>${payout.amount.toFixed(2)} {payout.currency}</strong></td>
									<td>
										<span class="badge {payout.status === 'paid' ? 'badge-active' : 'badge-warning'}">
											{payout.status}
										</span>
									</td>
									<td>{payout.method} ({payout.type})</td>
									<td>{new Date(payout.arrivalDate).toLocaleDateString()}</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
		</div>

		<!-- Refunds Detail -->
		<div class="section-card glass">
			<div class="section-header">
				<div>
					<h2>Processed Refunds Detail</h2>
					<p class="section-desc">Refund audit log of customer reservation deposits returned</p>
				</div>
				<button
					class="btn btn-secondary btn-sm"
					onclick={() =>
						exportToCsv(
							'refunds-detail',
							[
								{ label: 'Refund Date', key: 'created_at' },
								{ label: 'Stripe ID', key: 'stripe_payment_intent_id' },
								{ label: 'Amount ($)', key: 'amount' },
								{ label: 'Status', key: 'status' }
							],
							acct.refunds
						)}
				>
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
					</svg>
					Export CSV
				</button>
			</div>

			<div class="table-responsive">
				<table class="report-table">
					<thead>
						<tr>
							<th>Date</th>
							<th>Customer</th>
							<th>Amount</th>
							<th>Trip Type</th>
							<th>Stripe Reference</th>
						</tr>
					</thead>
					<tbody>
						{#if acct.refunds.length === 0}
							<tr>
								<td colspan="5" class="empty-cell">No refunds recorded during this date range.</td>
							</tr>
						{:else}
							{#each acct.refunds as r}
								{@const booking = (Array.isArray(r.bookings) ? r.bookings[0] : r.bookings) as any}
								{@const customer = (Array.isArray(booking?.customers) ? booking?.customers[0] : booking?.customers) as any}
								{@const trip = (Array.isArray(booking?.trip_instances) ? booking?.trip_instances[0] : booking?.trip_instances) as any}
								{@const template = (Array.isArray(trip?.listing_templates) ? trip?.listing_templates[0] : trip?.listing_templates) as any}
								<tr>
									<td>{new Date(r.created_at).toLocaleDateString()}</td>
									<td>{customer?.name || 'Customer'}</td>
									<td class="text-danger">-${Number(r.amount).toFixed(2)}</td>
									<td>{template?.trip_type || 'N/A'}</td>
									<td><code>{r.stripe_payment_intent_id}</code></td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
		</div>
	{/if}

	<!-- TAB CONTENT: AD-HOC DATA EXPLORER -->
	{#if activeTab === 'adhoc'}
		<div class="section-card glass adhoc-builder">
			<div class="section-header">
				<div>
					<h2>Ad-Hoc Custom Data Pull</h2>
					<p class="section-desc">Select an entity dataset, configure visible columns, apply custom filters, and preview or export data</p>
				</div>
			</div>

			<form onsubmit={handleAdhocSubmit} class="adhoc-form">
				<!-- Control Row -->
				<div class="adhoc-controls-grid">
					<label class="form-group">
						<span class="label-text">Select Dataset</span>
						<select bind:value={adhocDataset} class="form-input">
							<option value="bookings">Bookings (Customer groups & trip instances)</option>
							<option value="trips">Trip Instances (Scheduled dates & templates)</option>
							<option value="customers">Customers (Profiles, contact info & spend)</option>
							<option value="captains">Captains (Fleet operators & promo codes)</option>
							<option value="payments">Payment Records (Deposits & refunds)</option>
						</select>
					</label>

					<label class="form-group">
						<span class="label-text">Status Filter</span>
						<select bind:value={adhocStatus} class="form-input">
							<option value="all">All Statuses</option>
							{#if adhocDataset === 'bookings'}
								<option value="paid">Paid</option>
								<option value="reconfirmed">Reconfirmed</option>
								<option value="awaiting-reconfirm">Awaiting Reconfirm</option>
								<option value="forfeited">Forfeited</option>
								<option value="canceled">Canceled</option>
							{:else if adhocDataset === 'trips'}
								<option value="open">Open</option>
								<option value="half-booked">Half-Booked</option>
								<option value="pending-reconfirm">Pending Reconfirm</option>
								<option value="confirmed">Confirmed</option>
								<option value="completed">Completed</option>
								<option value="canceled">Canceled</option>
							{:else if adhocDataset === 'captains'}
								<option value="active">Active Only</option>
								<option value="inactive">Inactive Only</option>
							{:else if adhocDataset === 'payments'}
								<option value="succeeded">Succeeded / Paid</option>
								<option value="refunded">Refunded</option>
							{/if}
						</select>
					</label>

					<label class="form-group">
						<span class="label-text">Max Records</span>
						<select bind:value={adhocLimit} class="form-input">
							<option value={25}>25 Rows</option>
							<option value={50}>50 Rows</option>
							<option value={100}>100 Rows</option>
							<option value={250}>250 Rows</option>
							<option value={500}>500 Rows</option>
						</select>
					</label>

					<label class="form-group">
						<span class="label-text">Keyword Filter</span>
						<input
							type="search"
							bind:value={adhocSearch}
							placeholder="Filter text..."
							class="form-input"
						/>
					</label>
				</div>

				<!-- Column Selector -->
				<div class="fields-selection-box glass">
					<div class="fields-header">
						<span><strong>Select Columns to Display:</strong></span>
						<div class="fields-actions">
							<button type="button" class="btn-link" onclick={selectAllFields}>Select All</button>
							<span>•</span>
							<button type="button" class="btn-link" onclick={resetDefaultFields}>Reset Defaults</button>
						</div>
					</div>

					<div class="fields-chips">
						{#if data.adhocData?.availableFields}
							{#each data.adhocData.availableFields as field}
								<button
									type="button"
									class="field-chip {selectedFields.includes(field.key) ? 'chip-active' : ''}"
									onclick={() => toggleField(field.key)}
								>
									<span class="chip-checkbox">{selectedFields.includes(field.key) ? '✓' : ''}</span>
									{field.label}
								</button>
							{/each}
						{/if}
					</div>
				</div>

				<div class="form-actions-row">
					<button type="submit" class="btn btn-primary">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
							<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
						</svg>
						Execute Query
					</button>
				</div>
			</form>

			<!-- Ad-Hoc Results Preview -->
			{#if data.adhocData}
				{@const res = data.adhocData}
				{@const displayHeaders = res.availableFields.filter((f: any) => selectedFields.includes(f.key))}

				<div class="adhoc-results-header">
					<div>
						<h3>Query Results</h3>
						<span class="text-secondary">{res.totalCount} records matched query parameters</span>
					</div>

					<button
						class="btn btn-secondary btn-sm"
						onclick={() => exportToCsv(`custom-adhoc-${adhocDataset}`, displayHeaders, res.rows)}
					>
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
							<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
						</svg>
						Export CSV
					</button>
				</div>

				<div class="table-responsive">
					<table class="report-table">
						<thead>
							<tr>
								{#each displayHeaders as h}
									<th>{h.label}</th>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#if res.rows.length === 0}
								<tr>
									<td colspan={displayHeaders.length || 1} class="empty-cell">
										No rows returned for the selected filters.
									</td>
								</tr>
							{:else}
								{#each res.rows as row}
									<tr>
										{#each displayHeaders as h}
											<td>{row[h.key] ?? '—'}</td>
										{/each}
									</tr>
								{/each}
							{/if}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.reports-page {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		max-width: 1400px;
		margin: 0 auto;
		width: 100%;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.subtitle {
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-secondary);
		font-weight: 600;
	}

	h1 {
		font-size: 2rem;
		margin: 0;
		color: var(--text-primary);
	}

	/* Tabs */
	.tabs-container {
		display: flex;
		gap: 0.5rem;
		padding: 0.5rem;
		border-radius: 12px;
		border: 1px solid var(--border-light);
		background: var(--bg-surface);
		overflow-x: auto;
	}

	.tab-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.65rem 1.15rem;
		border: none;
		background: transparent;
		color: var(--text-secondary);
		font-size: 0.95rem;
		font-weight: 500;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.tab-btn:hover {
		color: var(--text-primary);
		background: var(--glass-bg);
	}

	.tab-btn.active {
		color: #ffffff;
		background: var(--primary, #0ea5e9);
		font-weight: 600;
	}

	/* Preset Filter Bar */
	.preset-filter-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
		padding: 0.75rem 1.25rem;
		border-radius: 12px;
		background: var(--bg-surface);
		border: 1px solid var(--border-light);
	}

	.preset-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
		color: var(--text-secondary);
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #10b981;
	}

	.preset-buttons {
		display: flex;
		gap: 0.4rem;
		flex-wrap: wrap;
	}

	.preset-chip {
		padding: 0.35rem 0.75rem;
		border: 1px solid var(--border-light);
		background: var(--glass-bg);
		color: var(--text-secondary);
		border-radius: 6px;
		font-size: 0.825rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.preset-chip:hover {
		color: var(--text-primary);
		border-color: var(--primary, #0ea5e9);
	}

	.preset-chip.active {
		background: var(--primary, #0ea5e9);
		color: #ffffff;
		border-color: var(--primary, #0ea5e9);
		font-weight: 600;
	}

	.custom-range-card {
		padding: 1rem;
		border-radius: 10px;
		background: var(--bg-surface);
		border: 1px solid var(--border-light);
	}

	.custom-range-inputs {
		display: flex;
		gap: 1rem;
		align-items: flex-end;
		flex-wrap: wrap;
	}

	.custom-range-inputs label {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.85rem;
		color: var(--text-secondary);
	}

	/* Stats Row */
	.stats-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.stat-card {
		padding: 1.25rem;
		border-radius: 12px;
		background: var(--bg-surface);
		border: 1px solid var(--border-light);
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.stat-label {
		font-size: 0.825rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--text-secondary);
		font-weight: 600;
	}

	.stat-number {
		font-size: 1.85rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.stat-sub {
		font-size: 0.8rem;
		color: var(--text-secondary);
	}

	/* Section Cards */
	.section-card {
		border-radius: 12px;
		background: var(--bg-surface);
		border: 1px solid var(--border-light);
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.section-header h2 {
		margin: 0;
		font-size: 1.35rem;
		color: var(--text-primary);
	}

	.section-desc {
		margin: 0.25rem 0 0 0;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.section-actions {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.search-form {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.search-input {
		min-width: 240px;
	}

	/* Notice Banner */
	.notice-banner {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		background: rgba(14, 165, 233, 0.08);
		border: 1px solid rgba(14, 165, 233, 0.2);
		font-size: 0.875rem;
		color: var(--text-primary);
	}

	/* Tables */
	.table-responsive {
		overflow-x: auto;
		border-radius: 8px;
		border: 1px solid var(--border-light);
	}

	.report-table {
		width: 100%;
		border-collapse: collapse;
		text-align: left;
		font-size: 0.9rem;
	}

	.report-table th {
		background: var(--glass-bg);
		padding: 0.75rem 1rem;
		font-weight: 600;
		color: var(--text-secondary);
		border-bottom: 1px solid var(--border-light);
		white-space: nowrap;
	}

	.report-table td {
		padding: 0.85rem 1rem;
		border-bottom: 1px solid var(--border-light);
		color: var(--text-primary);
		vertical-align: middle;
	}

	.report-table tbody tr:last-child td {
		border-bottom: none;
	}

	.report-table tbody tr:hover {
		background: var(--glass-bg);
	}

	.empty-cell {
		text-align: center;
		padding: 2.5rem !important;
		color: var(--text-secondary);
	}

	/* Ad-Hoc Form */
	.adhoc-form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.adhoc-controls-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.label-text {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-secondary);
	}

	.form-input {
		padding: 0.55rem 0.85rem;
		border-radius: 8px;
		border: 1px solid var(--border-light);
		background: var(--input-bg, var(--bg-surface));
		color: var(--text-primary);
		font-size: 0.9rem;
		outline: none;
		transition: border-color 0.2s;
	}

	.form-input:focus {
		border-color: var(--primary, #0ea5e9);
	}

	.fields-selection-box {
		padding: 1rem;
		border-radius: 8px;
		border: 1px solid var(--border-light);
		background: var(--bg-surface);
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.fields-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.fields-actions {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		font-size: 0.8rem;
	}

	.btn-link {
		background: none;
		border: none;
		color: var(--primary, #0ea5e9);
		cursor: pointer;
		font-size: 0.8rem;
		padding: 0;
		text-decoration: underline;
	}

	.fields-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.field-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.35rem 0.75rem;
		border-radius: 6px;
		border: 1px solid var(--border-light);
		background: var(--glass-bg);
		color: var(--text-secondary);
		font-size: 0.825rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.field-chip:hover {
		border-color: var(--primary, #0ea5e9);
		color: var(--text-primary);
	}

	.field-chip.chip-active {
		background: rgba(14, 165, 233, 0.12);
		border-color: var(--primary, #0ea5e9);
		color: var(--text-primary);
		font-weight: 500;
	}

	.chip-checkbox {
		width: 14px;
		height: 14px;
		border-radius: 3px;
		border: 1px solid var(--border-light);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 10px;
		color: var(--primary, #0ea5e9);
	}

	.chip-active .chip-checkbox {
		border-color: var(--primary, #0ea5e9);
		background: var(--primary, #0ea5e9);
		color: #ffffff;
	}

	.form-actions-row {
		display: flex;
		justify-content: flex-start;
	}

	.adhoc-results-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 1rem;
	}

	.adhoc-results-header h3 {
		margin: 0;
		font-size: 1.15rem;
		color: var(--text-primary);
	}

	/* Buttons */
	.btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.6rem 1rem;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		text-decoration: none;
		border: 1px solid transparent;
		transition: all 0.15s ease;
	}

	.btn-sm {
		padding: 0.4rem 0.75rem;
		font-size: 0.825rem;
	}

	.btn-primary {
		background: var(--primary, #0ea5e9);
		color: #ffffff;
	}

	.btn-primary:hover {
		filter: brightness(1.1);
	}

	.btn-secondary {
		background: var(--glass-bg);
		border-color: var(--border-light);
		color: var(--text-primary);
	}

	.btn-secondary:hover {
		background: var(--bg-surface);
		border-color: var(--text-secondary);
	}

	/* Utility Text & Badges */
	.text-danger {
		color: #ef4444;
	}

	.text-success {
		color: #10b981;
	}

	.text-secondary {
		color: var(--text-secondary);
	}

	.text-link {
		color: var(--primary, #0ea5e9);
		text-decoration: none;
	}

	.text-link:hover {
		text-decoration: underline;
	}

	.badge {
		display: inline-block;
		padding: 0.2rem 0.55rem;
		border-radius: 6px;
		font-size: 0.75rem;
		font-weight: 600;
		background: var(--glass-bg);
		border: 1px solid var(--border-light);
		color: var(--text-primary);
	}

	.badge-active {
		background: rgba(16, 185, 129, 0.12);
		border-color: rgba(16, 185, 129, 0.3);
		color: #10b981;
	}

	.badge-inactive {
		background: rgba(100, 116, 139, 0.12);
		border-color: rgba(100, 116, 139, 0.3);
		color: var(--text-secondary);
	}

	.badge-flagged {
		background: rgba(239, 68, 68, 0.12);
		border-color: rgba(239, 68, 68, 0.3);
		color: #ef4444;
	}

	.badge-warning {
		background: rgba(245, 158, 11, 0.12);
		border-color: rgba(245, 158, 11, 0.3);
		color: #f59e0b;
	}

	.badge-clean {
		background: rgba(16, 185, 129, 0.1);
		border-color: rgba(16, 185, 129, 0.25);
		color: #10b981;
	}

	.status-badge.trip-confirmed {
		background: rgba(16, 185, 129, 0.15);
		color: #10b981;
		border-color: rgba(16, 185, 129, 0.3);
	}

	.status-badge.trip-completed {
		background: rgba(59, 130, 246, 0.15);
		color: #3b82f6;
		border-color: rgba(59, 130, 246, 0.3);
	}

	code {
		font-family: monospace;
		background: var(--glass-bg);
		padding: 0.15rem 0.4rem;
		border-radius: 4px;
		font-size: 0.85em;
		border: 1px solid var(--border-light);
	}

	@media (max-width: 768px) {
		.preset-filter-bar {
			flex-direction: column;
			align-items: flex-start;
		}

		.adhoc-controls-grid {
			grid-template-columns: 1fr;
		}

		.search-input {
			min-width: 100%;
		}

		.search-form {
			width: 100%;
		}
	}
</style>
