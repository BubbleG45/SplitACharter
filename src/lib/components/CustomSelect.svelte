<script lang="ts">
	import { onMount } from 'svelte';

	let { id, label, value = $bindable(), options } = $props<{
		id: string;
		label: string;
		value: string;
		options: Array<{ value: string; label: string }>;
	}>();

	let isOpen = $state(false);
	let selectContainer: HTMLDivElement;

	const selectedLabel = $derived(
		options.find((opt: { value: string; label: string }) => opt.value === value)?.label || 'Select option'
	);

	function toggleOpen() {
		isOpen = !isOpen;
	}

	function selectOption(optValue: string) {
		value = optValue;
		isOpen = false;
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
		class:active={isOpen}
		onclick={toggleOpen}
	>
		<span>{selectedLabel}</span>
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
		<ul class="custom-select-dropdown glass glow-primary">
			{#each options as opt}
				<li class="custom-select-option" class:selected={opt.value === value}>
					<button type="button" onclick={() => selectOption(opt.value)}>
						{opt.label}
					</button>
				</li>
			{/each}
		</ul>
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
		list-style: none;
		margin: 0;
		padding: 6px;
		max-height: 250px;
		overflow-y: auto;
		border-radius: 8px !important;
		border: 1px solid rgba(255, 255, 255, 0.15);
		background: #12182b !important;
		backdrop-filter: blur(16px);
		box-shadow: 0 12px 32px 0 rgba(0, 0, 0, 0.7), 0 0 20px 0 rgba(6, 182, 212, 0.15);
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
		display: block;
		font-family: var(--font-body);
		font-size: 0.9rem;
		padding: 8px 12px;
		text-align: left;
		width: 100%;
		cursor: pointer;
		transition: all 0.15s ease-in-out;
		justify-content: flex-start;
	}

	.custom-select-option button:hover,
	.custom-select-option.selected button {
		background: rgba(255, 255, 255, 0.06);
		color: var(--text-primary);
	}

	.custom-select-option.selected button {
		border-left: 2px solid var(--primary);
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
		background: rgba(6, 182, 212, 0.08);
	}
</style>
