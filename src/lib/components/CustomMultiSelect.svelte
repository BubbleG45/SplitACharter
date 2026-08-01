<script lang="ts">
	import { onMount } from 'svelte';

	let { id, label, values = $bindable([]), options } = $props<{
		id: string;
		label: string;
		values: string[];
		options: Array<{ value: string; label: string }>;
	}>();

	let isOpen = $state(false);
	let selectContainer: HTMLDivElement;

	const selectedLabel = $derived.by(() => {
		if (values.length === 0) {
			return 'Any Trip Type';
		}
		if (values.length === 1) {
			const found = options.find((opt: { value: string; label: string }) => opt.value === values[0]);
			return found ? found.label : values[0];
		}
		return `${values.length} Trip Types Selected`;
	});

	const selectableOptions = $derived(options.filter((opt: { value: string; label: string }) => opt.value !== 'all'));

	function toggleOpen() {
		isOpen = !isOpen;
	}

	function toggleOption(optValue: string) {
		if (optValue === 'all') {
			values = [];
			return;
		}

		if (values.includes(optValue)) {
			values = values.filter((v: string) => v !== optValue);
		} else {
			values = [...values, optValue];
		}
	}

	function clearAll() {
		values = [];
	}

	function handleOutsideClick(event: MouseEvent) {
		if (selectContainer && !selectContainer.contains(event.target as Node)) {
			isOpen = false;
		}
	}

	onMount(() => {
		window.addEventListener('click', handleOutsideClick);
		return () => {
			window.removeEventListener('click', handleOutsideClick);
		};
	});
</script>

<div class="custom-select-container" class:is-open={isOpen} bind:this={selectContainer}>
	<label for={id}>{label}</label>
	<button
		type="button"
		{id}
		class="custom-select-trigger"
		class:active={isOpen || values.length > 0}
		onclick={toggleOpen}
	>
		<span class="trigger-text">{selectedLabel}</span>
		{#if values.length > 0}
			<span class="count-badge">{values.length}</span>
		{/if}
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="2.5"
			stroke="currentColor"
			class="arrow-icon"
		>
			<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
		</svg>
	</button>

	{#if isOpen}
		<div class="custom-select-dropdown glass glow-primary">
			<div class="dropdown-header">
				<button type="button" class="opt-all-btn" class:selected={values.length === 0} onclick={() => toggleOption('all')}>
					<span class="checkbox-box" class:checked={values.length === 0}>
						{#if values.length === 0}
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" class="w-3 h-3">
								<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
							</svg>
						{/if}
					</span>
					<span>Any Trip Type</span>
				</button>
				{#if values.length > 0}
					<button type="button" class="btn-clear" onclick={clearAll}>Clear</button>
				{/if}
			</div>

			<div class="dropdown-divider"></div>

			<ul class="options-list">
				{#each selectableOptions as opt}
					{@const isChecked = values.includes(opt.value)}
					<li class="custom-select-option" class:selected={isChecked}>
						<button type="button" onclick={() => toggleOption(opt.value)}>
							<span class="checkbox-box" class:checked={isChecked}>
								{#if isChecked}
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" class="w-3 h-3">
										<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
									</svg>
								{/if}
							</span>
							<span class="opt-label">{opt.label}</span>
						</button>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>

<style>
	.custom-select-container {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 8px;
		flex: 1;
		z-index: 1;
	}

	.custom-select-container.is-open {
		z-index: 100;
	}

	.custom-select-container label {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.custom-select-trigger {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid var(--border-light);
		border-radius: 8px;
		color: var(--text-primary);
		font-family: var(--font-body);
		font-size: 0.95rem;
		padding: 10px 14px;
		width: 100%;
		text-align: left;
		cursor: pointer;
		transition: all 0.2s ease-in-out;
		outline: none;
		gap: 8px;
	}

	.trigger-text {
		flex: 1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.count-badge {
		background: var(--primary);
		color: #000;
		font-weight: 700;
		font-size: 0.72rem;
		padding: 2px 7px;
		border-radius: 12px;
	}

	.custom-select-trigger:focus,
	.custom-select-trigger.active {
		background: rgba(255, 255, 255, 0.08);
		border-color: var(--primary);
		box-shadow: 0 0 10px 0 rgba(6, 182, 212, 0.2);
	}

	.arrow-icon {
		width: 12px;
		height: 12px;
		transition: transform 0.2s ease-in-out;
		color: var(--text-muted);
		flex-shrink: 0;
	}

	.custom-select-trigger.active .arrow-icon {
		transform: rotate(180deg);
	}

	.custom-select-dropdown {
		position: absolute;
		top: calc(100% + 6px);
		left: 0;
		right: 0;
		z-index: 1000;
		padding: 8px;
		border-radius: 8px !important;
		border: 1px solid var(--border-light);
		background: var(--bg-surface) !important;
		backdrop-filter: blur(16px);
		box-shadow: 0 12px 32px 0 rgba(0, 0, 0, 0.7), 0 0 20px 0 rgba(6, 182, 212, 0.15);
		min-width: 200px;
	}

	.dropdown-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 4px 6px;
	}

	.opt-all-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		background: none;
		border: none;
		color: var(--text-primary);
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		padding: 4px 6px;
		border-radius: 4px;
	}

	.btn-clear {
		background: none;
		border: none;
		color: var(--primary);
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
		padding: 2px 6px;
	}

	.dropdown-divider {
		height: 1px;
		background: rgba(255, 255, 255, 0.08);
		margin: 6px 0;
	}

	.options-list {
		list-style: none;
		margin: 0;
		padding: 0;
		max-height: 220px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.custom-select-option {
		margin: 0;
		padding: 0;
	}

	.custom-select-option button {
		background: none;
		border: none;
		border-radius: 6px;
		color: var(--text-secondary);
		display: flex;
		align-items: center;
		gap: 10px;
		font-family: var(--font-body);
		font-size: 0.9rem;
		padding: 8px 10px;
		text-align: left;
		width: 100%;
		cursor: pointer;
		transition: all 0.15s ease-in-out;
	}

	.custom-select-option button:hover,
	.custom-select-option.selected button {
		background: rgba(255, 255, 255, 0.06);
		color: var(--text-primary);
	}

	.custom-select-option.selected button {
		background: rgba(6, 182, 212, 0.08);
	}

	.checkbox-box {
		width: 16px;
		height: 16px;
		border-radius: 4px;
		border: 1px solid var(--border-light);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		background: rgba(255, 255, 255, 0.03);
		transition: all 0.15s ease;
	}

	.checkbox-box.checked {
		background: var(--primary);
		border-color: var(--primary);
		color: #000;
	}

	.opt-label {
		flex: 1;
	}
</style>
