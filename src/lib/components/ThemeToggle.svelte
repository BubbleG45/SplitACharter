<script lang="ts">
	import { theme } from '$lib/stores/theme';

	function handleToggle() {
		theme.toggle();
	}
</script>

<button
	type="button"
	class="theme-toggle-btn"
	onclick={handleToggle}
	aria-label="Toggle light/dark theme"
	title={$theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
>
	{#if $theme === 'dark'}
		<!-- Sun icon for dark mode (click to switch to light mode) -->
		<svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="12" cy="12" r="4"/>
			<path d="M12 2v2"/>
			<path d="M12 20v2"/>
			<path d="m4.93 4.93 1.41 1.41"/>
			<path d="m17.66 17.66 1.41 1.41"/>
			<path d="M2 12h2"/>
			<path d="M20 12h2"/>
			<path d="m6.34 17.66-1.41 1.41"/>
			<path d="m19.07 4.93-1.41 1.41"/>
		</svg>
	{:else}
		<!-- Moon icon for light mode (click to switch to dark mode) -->
		<svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
		</svg>
	{/if}
</button>

<style>
	.theme-toggle-btn {
		background: var(--input-bg);
		border: 1px solid var(--border-light);
		color: var(--text-primary);
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		padding: 0;
		transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.theme-toggle-btn:hover {
		background: var(--input-focus-bg);
		border-color: var(--border-glow);
		color: var(--primary);
		transform: scale(1.08) rotate(8deg);
		box-shadow: 0 4px 12px var(--border-glow);
	}

	.icon {
		width: 20px;
		height: 20px;
		transition: transform 0.3s ease;
	}
</style>
