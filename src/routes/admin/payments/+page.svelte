<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let selectedStatus = $state('all');
	let refundingId = $state<string | null>(null);

	// Computations for ledger summary cards
	let summary = $derived.by(() => {
		let collected = 0;
		let refunded = 0;
		for (const p of data.payments) {
			if (p.status === 'succeeded') {
				collected += Number(p.amount);
			} else if (p.status === 'refunded') {
				refunded += Number(p.amount);
			}
		}
		return {
			collected,
			refunded,
			net: collected - refunded
		};
	});

	// Filter payments based on status select
	let filteredPayments = $derived(
		selectedStatus === 'all'
			? data.payments
			: selectedStatus === 'charges'
				? data.payments.filter((p) => p.status === 'succeeded')
				: data.payments.filter((p) => p.status === 'refunded')
	);

	function formatDate(dateStr: string) {
		if (!dateStr) return 'N/A';
		return new Date(dateStr).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function formatDateTime(dateTimeStr: string) {
		if (!dateTimeStr) return 'N/A';
		return new Date(dateTimeStr).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function exportToCSV() {
		let csvContent = 'Date,Transaction ID,Customer Name,Customer Email,Trip Date,Trip Type,Amount,Status\n';
		
		for (const p of data.payments) {
			const booking = p.bookings as any;
			const customer = booking?.customers;
			const trip = booking?.trip_instances;
			const template = trip?.listing_templates;
			
			const row = [
				new Date(p.created_at).toISOString(),
				p.stripe_payment_intent_id,
				customer?.name || 'N/A',
				customer?.email || 'N/A',
				trip?.date || 'N/A',
				template?.trip_type || 'N/A',
				p.amount,
				p.status
			]
				.map((val) => `"${String(val).replace(/"/g, '""')}"`)
				.join(',');
				
			csvContent += row + '\n';
		}

		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.setAttribute('href', url);
		link.setAttribute('download', `payments_ledger_${new Date().toISOString().split('T')[0]}.csv`);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
</script>

<svelte:head>
	<title>Payments Ledger — SplitACharter</title>
</svelte:head>

<div class="admin-header">
	<div>
		<span class="subtitle">Platform Configuration</span>
		<h1>Payments Ledger</h1>
	</div>
	<div>
		<button class="btn btn-secondary" onclick={exportToCSV}>
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4 inline mr-1">
				<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
			</svg>
			Export Ledger CSV
		</button>
	</div>
</div>

{#if form?.message}
	<div class="alert alert-error glass">
		<p>{form.message}</p>
	</div>
{/if}

<!-- Financial Overview Summary Grid -->
<div class="summary-grid">
	<div class="summary-card glass">
		<span class="label">Gross Deposits Collected</span>
		<span class="val text-success">${summary.collected.toFixed(2)}</span>
	</div>
	<div class="summary-card glass">
		<span class="label">Refunded Deposits</span>
		<span class="val text-danger">${summary.refunded.toFixed(2)}</span>
	</div>
	<div class="summary-card glass">
		<span class="label">Net Revenue Keep</span>
		<span class="val text-primary">${summary.net.toFixed(2)}</span>
	</div>
</div>

<div class="control-row glass">
	<div class="filter-group">
		<label for="ledger-filter">Transaction Filter:</label>
		<select id="ledger-filter" bind:value={selectedStatus}>
			<option value="all">All Transactions</option>
			<option value="charges">Charges / Deposits</option>
			<option value="refunds">Refunds / Negative Ledger</option>
		</select>
	</div>
</div>

<div class="table-container glass">
	{#if filteredPayments.length === 0}
		<div class="empty-state">
			<p>No payments recorded in the selected category.</p>
		</div>
	{:else}
		<table class="admin-table">
			<thead>
				<tr>
					<th>Timestamp</th>
					<th>Transaction ID</th>
					<th>Customer</th>
					<th>Trip Details</th>
					<th>Amount</th>
					<th>Status</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each filteredPayments as payment (payment.id)}
					{@const booking = payment.bookings as any}
					{@const customer = booking?.customers}
					{@const trip = booking?.trip_instances}
					{@const template = trip?.listing_templates}
					
					<tr>
						<td>
							<span class="timestamp">{formatDateTime(payment.created_at)}</span>
						</td>
						<td>
							<span class="tx-id">{payment.stripe_payment_intent_id}</span>
						</td>
						<td>
							<div class="customer-info">
								<span class="name">{customer?.name || 'N/A'}</span>
								<span class="contact">{customer?.email || 'N/A'}</span>
							</div>
						</td>
						<td>
							<div class="trip-info">
								<span class="date">{formatDate(trip?.date)}</span>
								<span class="type">{template?.trip_type || 'Unknown'}</span>
							</div>
						</td>
						<td>
							{#if payment.status === 'refunded'}
								<span class="amount refund">-${Number(payment.amount).toFixed(2)}</span>
							{:else}
								<span class="amount charge">+${Number(payment.amount).toFixed(2)}</span>
							{/if}
						</td>
						<td>
							<span class="badge status-badge pay-{payment.status}">
								{payment.status}
							</span>
						</td>
						<td>
							{#if payment.amount > 0 && payment.status === 'succeeded' && booking.status !== 'canceled'}
								<form 
									method="POST" 
									action="?/triggerRefund" 
									use:enhance={() => {
										refundingId = payment.id;
										return async ({ update }) => {
											await update();
											refundingId = null;
										};
									}}
									class="inline-form"
								>
									<input type="hidden" name="paymentId" value={payment.id} />
									<input type="hidden" name="bookingId" value={booking.id} />
									<button 
										type="submit" 
										class="btn btn-secondary btn-xs"
										disabled={refundingId === payment.id}
										onclick={() => !confirm('Are you sure you want to issue a full manual refund of $50.00 for this booking? This will cancel the reservation.')}
									>
										{refundingId === payment.id ? 'Refunding...' : 'Refund $50'}
									</button>
								</form>
							{:else}
								<span class="no-action">N/A</span>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>

<style>
	.admin-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
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

	.summary-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2.5rem;
	}
	.summary-card {
		padding: 1.5rem;
		border: 1px solid var(--border-light);
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.summary-card .label {
		font-size: 0.85rem;
		color: var(--text-secondary);
		font-weight: 500;
	}
	.summary-card .val {
		font-size: 1.75rem;
		font-weight: 700;
		line-height: 1.2;
		font-family: var(--font-heading);
	}

	.text-success { color: var(--success); }
	.text-danger { color: var(--danger); }
	.text-primary { color: var(--primary); }

	.control-row {
		padding: 1.25rem;
		border: 1px solid var(--border-light);
		margin-bottom: 1.5rem;
	}
	.filter-group {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.filter-group label {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-secondary);
	}
	.filter-group select {
		padding: 6px 12px;
		font-size: 0.9rem;
	}

	.table-container {
		border: 1px solid var(--border-light);
		overflow-x: auto;
	}
	.admin-table {
		width: 100%;
		border-collapse: collapse;
		text-align: left;
		font-size: 0.92rem;
	}
	.admin-table th {
		padding: 1rem 1.5rem;
		background: rgba(255, 255, 255, 0.02);
		border-bottom: 1px solid var(--border-light);
		font-weight: 600;
		color: var(--text-secondary);
	}
	.admin-table td {
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid var(--border-light);
		vertical-align: middle;
	}
	.admin-table tr:last-child td {
		border-bottom: none;
	}

	.tx-id {
		font-family: monospace;
		font-size: 0.82rem;
		color: var(--text-muted);
	}
	.customer-info, .trip-info {
		display: flex;
		flex-direction: column;
	}
	.customer-info .name, .trip-info .date {
		font-weight: 600;
		color: var(--text-primary);
	}
	.customer-info .contact, .trip-info .type {
		font-size: 0.8rem;
		color: var(--text-muted);
		margin-top: 2px;
	}

	.amount {
		font-family: monospace;
		font-weight: 700;
		font-size: 1rem;
	}
	.amount.charge {
		color: var(--success);
	}
	.amount.refund {
		color: var(--danger);
	}

	.badge {
		font-size: 0.8rem;
		padding: 4px 10px;
		border-radius: 6px;
		font-weight: 600;
	}
	.status-badge {
		text-transform: capitalize;
		display: inline-block;
	}
	.pay-succeeded { background: rgba(16, 185, 129, 0.1); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.2); }
	.pay-refunded { background: rgba(245, 158, 11, 0.1); color: var(--accent); border: 1px solid rgba(245, 158, 11, 0.2); }
	.pay-failed { background: rgba(239, 68, 68, 0.1); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.2); }

	.action-buttons {
		display: flex;
		gap: 8px;
	}
	.inline-form {
		display: inline-block;
	}
	.btn-xs {
		padding: 4px 8px;
		font-size: 0.8rem;
	}
	.no-action {
		color: var(--text-muted);
		font-size: 0.85rem;
		font-style: italic;
	}

	.alert-error {
		padding: 1rem;
		margin-bottom: 2rem;
		border-radius: 6px;
		border: 1px solid rgba(239, 68, 68, 0.2);
		color: var(--danger);
	}

	.empty-state {
		padding: 3rem 1.5rem;
		text-align: center;
		color: var(--text-muted);
	}
</style>
