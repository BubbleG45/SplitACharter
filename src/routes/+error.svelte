<script lang="ts">
	import { page } from '$app/state';

	let rescued = $state(false);
	let isTossing = $state(false);
	let tossCount = $state(0);

	let status = $derived(page.status || 404);
	let is404 = $derived(status === 404);

	function throwLifeline() {
		if (rescued || isTossing) return;
		isTossing = true;
		setTimeout(() => {
			isTossing = false;
			rescued = true;
			tossCount += 1;
		}, 750);
	}

	function jumpBackIn() {
		rescued = false;
		isTossing = false;
	}
</script>

<svelte:head>
	<title
		>{is404
			? '404: Man Overboard! — SplitACharter'
			: `${status}: Rough Waters — SplitACharter`}</title
	>
</svelte:head>

<main class="error-container">
	<!-- Background Ambient Glow -->
	<div class="ambient-glow glow-1"></div>
	<div class="ambient-glow glow-2"></div>

	<div class="error-card glass">
		<!-- Status Badge -->
		<div class="status-badge">
			<span class="badge-icon">🛟</span>
			<span class="badge-text">
				{#if is404}
					CODE 404 • UNCHARTED WATERS
				{:else}
					CODE {status} • ROUGH SEAS AHEAD
				{/if}
			</span>
		</div>

		<!-- Main Headline -->
		<h1 class="error-title">
			{#if is404}
				MAN OVERBOARD!
			{:else}
				ENGINE TROUBLE!
			{/if}
		</h1>

		<!-- Playful Interactive Sea Scene -->
		<div class="ocean-stage" role="region" aria-label="Interactive ocean rescue scene">
			<!-- Distant Boat Silhouette -->
			<div class="distant-boat" title="SplitACharter boat cruising safely">
				<svg viewBox="0 0 100 45" class="boat-svg" aria-hidden="true">
					<path d="M10 32 L88 32 L78 42 L22 42 Z" class="boat-hull" />
					<polygon points="50,10 50,30 72,30" class="boat-sail-main" />
					<polygon points="46,14 46,30 28,30" class="boat-sail-jib" />
					<line x1="49" y1="8" x2="49" y2="32" class="boat-mast" />
					<circle cx="50" cy="7" r="2" class="boat-flag" />
				</svg>
			</div>

			<!-- Lifebuoy & Swimmer Container -->
			<div class="swimmer-lifebuoy-group" class:tossing={isTossing} class:safe-aboard={rescued}>
				<!-- Rescue Rope -->
				{#if isTossing || rescued}
					<div class="rescue-rope" class:pulled={rescued}></div>
				{/if}

				<!-- Swimmer Figure -->
				<div class="swimmer" class:rescued-wave={rescued}>
					<div class="swimmer-head">
						<div class="goggles"></div>
					</div>
					<div class="swimmer-arm" class:arm-wave={!rescued} class:arm-cheer={rescued}>
						<span>{rescued ? '✌️' : '👋'}</span>
					</div>
				</div>

				<!-- Lifebuoy SVG Button -->
				<button
					type="button"
					class="buoy-button"
					onclick={throwLifeline}
					title={rescued
						? 'Rescued! Click to jump back in'
						: 'Click the buoy to pull the lifeline!'}
					aria-label="Lifebuoy preserver ring"
				>
					<svg viewBox="0 0 120 120" class="lifebuoy-svg">
						<!-- Outer Shadow Drop -->
						<circle cx="60" cy="62" r="48" class="buoy-shadow" />
						<!-- Outer Ring Base (Amber/Orange) -->
						<circle cx="60" cy="60" r="46" class="buoy-ring" />
						<!-- White Segments -->
						<path d="M60 14 A46 46 0 0 1 76 17 L71 39 A24 24 0 0 0 60 36 Z" class="buoy-stripe" />
						<path d="M60 14 A46 46 0 0 0 44 17 L49 39 A24 24 0 0 1 60 36 Z" class="buoy-stripe" />
						<path d="M60 106 A46 46 0 0 1 76 103 L71 81 A24 24 0 0 0 60 84 Z" class="buoy-stripe" />
						<path d="M60 106 A46 46 0 0 0 44 103 L49 81 A24 24 0 0 1 60 84 Z" class="buoy-stripe" />
						<path d="M14 60 A46 46 0 0 1 17 44 L39 49 A24 24 0 0 0 36 60 Z" class="buoy-stripe" />
						<path d="M14 60 A46 46 0 0 0 17 76 L39 71 A24 24 0 0 1 36 60 Z" class="buoy-stripe" />
						<path d="M106 60 A46 46 0 0 1 103 76 L81 71 A24 24 0 0 0 84 60 Z" class="buoy-stripe" />
						<path d="M106 60 A46 46 0 0 0 103 44 L81 49 A24 24 0 0 1 84 60 Z" class="buoy-stripe" />
						<!-- Inner Hole -->
						<circle cx="60" cy="60" r="23" class="buoy-hole" />
						<!-- Rope Grablines -->
						<circle cx="60" cy="60" r="51" class="buoy-rope" />
					</svg>
				</button>
			</div>

			<!-- Rolling Ocean Swell Layers -->
			<div class="waves-wrapper">
				<div class="wave wave-back"></div>
				<div class="wave wave-middle"></div>
				<div class="wave wave-front"></div>
			</div>
		</div>

		<!-- Interactive Status Feedback -->
		{#if rescued}
			<div class="rescue-banner">
				<span class="rescue-icon">🎉</span>
				<div class="rescue-text">
					<strong>Rescue Successful!</strong>
					<span>Captain reeled you safely back onto the deck. Ready to set sail again?</span>
				</div>
				<button class="reset-link" onclick={jumpBackIn} title="Jump back in the water">
					(Take another dip 🌊)
				</button>
			</div>
		{:else}
			<p class="error-description">
				{#if is404}
					Looks like you took an unexpected plunge off the stern deck! The charter boat is still in
					sight, but this specific coordinate drifted off the map into deep water.
				{:else}
					Our engines sputtered in heavy chop: {page.error?.message ||
						'Unexpected nautical turbulence'}. Don't worry — we're getting you back to calm waters.
				{/if}
			</p>
		{/if}

		<!-- Action Controls -->
		<div class="action-grid">
			{#if !rescued}
				<button type="button" class="btn btn-lifeline" onclick={throwLifeline} disabled={isTossing}>
					<span class="btn-icon">🛟</span>
					<span>{isTossing ? 'Reeling in...' : 'Throw Lifeline to Swimmer'}</span>
				</button>
			{/if}

			<a href="/" class="btn btn-primary">
				<svg
					viewBox="0 0 20 20"
					fill="currentColor"
					class="icon-svg"
					aria-hidden="true"
					width="18"
					height="18"
				>
					<path
						d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"
					/>
				</svg>
				<span>Return to Safe Harbor</span>
			</a>

			<a href="/browse" class="btn btn-secondary">
				<svg
					viewBox="0 0 20 20"
					fill="currentColor"
					class="icon-svg"
					aria-hidden="true"
					width="18"
					height="18"
				>
					<path
						fill-rule="evenodd"
						d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
						clip-rule="evenodd"
					/>
				</svg>
				<span>Find an Active Charter</span>
			</a>
		</div>

		<!-- Helpful Tip -->
		<div class="sea-tip">
			<span class="sea-tip-label">Captain's Advice:</span>
			<span
				>Double-check the URL or navigate from our verified trip directory. No mate gets left
				behind!</span
			>
		</div>
	</div>
</main>

<style>
	.error-container {
		min-height: calc(100vh - 180px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2.5rem 1.5rem;
		position: relative;
		overflow: hidden;
	}

	/* Ambient Background Glows */
	.ambient-glow {
		position: absolute;
		border-radius: 50%;
		filter: blur(80px);
		pointer-events: none;
		z-index: 0;
		opacity: 0.15;
	}

	.glow-1 {
		background: var(--primary);
		width: 460px;
		height: 460px;
		top: -10%;
		right: 10%;
	}

	.glow-2 {
		background: var(--secondary);
		width: 440px;
		height: 440px;
		bottom: -10%;
		left: 8%;
	}

	/* Main Glass Card */
	.error-card {
		position: relative;
		z-index: 1;
		max-width: 680px;
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 3rem 2rem 2.5rem;
		border-radius: 20px;
		border: 1px solid var(--glass-border);
		background: var(--glass-bg);
		box-shadow: var(--glass-shadow);
	}

	/* Status Badge */
	.status-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 6px 14px;
		border-radius: 9999px;
		background: var(--input-bg);
		border: 1px solid var(--border-light);
		margin-bottom: 1.25rem;
	}

	.badge-icon {
		font-size: 1.1rem;
		animation: pulse-ring 2.5s infinite ease-in-out;
	}

	.badge-text {
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		color: var(--primary);
		text-transform: uppercase;
	}

	/* Headline */
	.error-title {
		font-size: 2.75rem;
		font-weight: 850;
		letter-spacing: -0.03em;
		line-height: 1.15;
		margin-bottom: 1.5rem;
		background: linear-gradient(135deg, var(--text-primary) 30%, var(--primary) 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	/* Ocean Stage */
	.ocean-stage {
		position: relative;
		width: 100%;
		height: 190px;
		border-radius: 14px;
		overflow: hidden;
		background: linear-gradient(
			180deg,
			transparent 0%,
			var(--input-bg) 60%,
			var(--bg-surface-elevated) 100%
		);
		border: 1px solid var(--border-light);
		margin-bottom: 1.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Distant Boat */
	.distant-boat {
		position: absolute;
		top: 18px;
		right: 32px;
		width: 48px;
		height: 24px;
		opacity: 0.65;
		animation: boat-bob 5s infinite ease-in-out alternate;
	}

	.boat-svg {
		width: 100%;
		height: 100%;
	}

	.boat-hull {
		fill: var(--text-secondary);
	}

	.boat-sail-main,
	.boat-sail-jib {
		fill: var(--primary);
		opacity: 0.85;
	}

	.boat-mast {
		stroke: var(--text-muted);
		stroke-width: 2;
	}

	.boat-flag {
		fill: var(--accent);
	}

	/* Lifebuoy & Swimmer Group */
	.swimmer-lifebuoy-group {
		position: absolute;
		bottom: 38px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2;
		animation: ocean-bob 3.2s infinite ease-in-out;
		transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.swimmer-lifebuoy-group.tossing {
		animation: buoy-toss 0.75s cubic-bezier(0.2, 0.9, 0.3, 1.2);
	}

	.swimmer-lifebuoy-group.safe-aboard {
		animation: buoy-safe 0.8s ease-out forwards;
	}

	/* Rescue Rope */
	.rescue-rope {
		position: absolute;
		top: 30px;
		right: 70px;
		width: 180px;
		height: 3px;
		background: repeating-linear-gradient(
			90deg,
			var(--accent) 0,
			var(--accent) 6px,
			var(--text-secondary) 6px,
			var(--text-secondary) 12px
		);
		transform-origin: right center;
		transform: rotate(-18deg) scaleX(0);
		opacity: 0;
		animation: rope-throw 0.6s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
		border-radius: 2px;
		z-index: 1;
	}

	.rescue-rope.pulled {
		transform: rotate(-18deg) scaleX(1);
		opacity: 0.85;
	}

	/* Swimmer */
	.swimmer {
		position: absolute;
		left: -32px;
		top: -4px;
		display: flex;
		flex-direction: column;
		align-items: center;
		z-index: 2;
	}

	.swimmer-head {
		width: 26px;
		height: 26px;
		border-radius: 50%;
		background: var(--text-primary);
		position: relative;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
	}

	.goggles {
		position: absolute;
		top: 8px;
		left: 3px;
		width: 20px;
		height: 7px;
		background: var(--primary);
		border-radius: 4px;
		border: 1.5px solid var(--bg-surface);
	}

	.swimmer-arm {
		position: absolute;
		top: -16px;
		right: -10px;
		font-size: 1.25rem;
		user-select: none;
	}

	.arm-wave {
		animation: arm-waving 1.2s infinite ease-in-out;
		transform-origin: bottom center;
	}

	.arm-cheer {
		animation: arm-cheering 0.6s ease-in-out;
	}

	/* Lifebuoy Button */
	.buoy-button {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		width: 90px;
		height: 90px;
		display: flex;
		align-items: center;
		justify-content: center;
		outline: none;
		transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.buoy-button:hover {
		transform: scale(1.08) rotate(6deg);
	}

	.buoy-button:active {
		transform: scale(0.96);
	}

	.lifebuoy-svg {
		width: 100%;
		height: 100%;
		filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3));
	}

	.buoy-shadow {
		fill: rgba(0, 0, 0, 0.25);
	}

	.buoy-ring {
		fill: var(--accent);
	}

	.buoy-stripe {
		fill: #ffffff;
	}

	.buoy-hole {
		fill: var(--bg-base);
		opacity: 0.95;
	}

	.buoy-rope {
		fill: none;
		stroke: #ffffff;
		stroke-width: 2.2;
		stroke-dasharray: 8 6;
		opacity: 0.85;
	}

	/* Ocean Waves */
	.waves-wrapper {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 60px;
		overflow: hidden;
		pointer-events: none;
	}

	.wave {
		position: absolute;
		bottom: 0;
		left: -50%;
		width: 200%;
		height: 100%;
		background-repeat: repeat-x;
	}

	.wave-back {
		opacity: 0.35;
		background: radial-gradient(ellipse at center, var(--primary) 0%, transparent 70%);
		background-size: 140px 45px;
		animation: wave-slide 7s linear infinite;
		bottom: 12px;
	}

	.wave-middle {
		opacity: 0.55;
		background: radial-gradient(ellipse at center, var(--primary) 0%, transparent 68%);
		background-size: 110px 40px;
		animation: wave-slide-reverse 5s linear infinite;
		bottom: 6px;
	}

	.wave-front {
		opacity: 0.8;
		background: radial-gradient(ellipse at center, var(--primary-hover) 0%, transparent 65%);
		background-size: 80px 32px;
		animation: wave-slide 3.5s linear infinite;
		bottom: 0;
	}

	/* Description & Rescue Alert */
	.error-description {
		font-size: 1.08rem;
		color: var(--text-secondary);
		line-height: 1.6;
		max-width: 520px;
		margin-bottom: 2rem;
	}

	.rescue-banner {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		text-align: left;
		background: rgba(16, 185, 129, 0.12);
		border: 1px solid var(--success);
		padding: 1rem 1.25rem;
		border-radius: 12px;
		margin-bottom: 2rem;
		max-width: 520px;
		animation: pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}

	.rescue-icon {
		font-size: 1.8rem;
	}

	.rescue-text {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		font-size: 0.92rem;
		color: var(--text-primary);
	}

	.reset-link {
		background: none;
		border: none;
		color: var(--primary);
		font-size: 0.82rem;
		cursor: pointer;
		text-decoration: underline;
		padding: 0;
		margin-left: auto;
		white-space: nowrap;
	}

	.reset-link:hover {
		color: var(--primary-hover);
	}

	/* Action Grid */
	.action-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.85rem;
		justify-content: center;
		width: 100%;
		max-width: 540px;
		margin-bottom: 1.75rem;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 12px 22px;
		font-size: 0.95rem;
		font-weight: 600;
		border-radius: 10px;
		text-decoration: none;
		transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		cursor: pointer;
	}

	.btn-lifeline {
		background: linear-gradient(135deg, var(--accent) 0%, #ea580c 100%);
		color: #ffffff;
		border: none;
		box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
		width: 100%;
	}

	.btn-lifeline:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(245, 158, 11, 0.45);
		filter: brightness(1.08);
	}

	.btn-lifeline:disabled {
		opacity: 0.7;
		cursor: wait;
	}

	.btn-icon {
		font-size: 1.15rem;
	}

	.icon-svg {
		flex-shrink: 0;
	}

	.btn-primary {
		flex: 1;
		min-width: 200px;
	}

	.btn-secondary {
		flex: 1;
		min-width: 200px;
	}

	/* Sea Tip */
	.sea-tip {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		font-size: 0.82rem;
		color: var(--text-muted);
		max-width: 480px;
		line-height: 1.4;
	}

	.sea-tip-label {
		font-weight: 600;
		color: var(--text-secondary);
		white-space: nowrap;
	}

	/* Animations */
	@keyframes ocean-bob {
		0%,
		100% {
			transform: translateX(-50%) translateY(0) rotate(0deg);
		}
		50% {
			transform: translateX(-50%) translateY(-10px) rotate(4deg);
		}
	}

	@keyframes boat-bob {
		0% {
			transform: translateY(0) rotate(0deg);
		}
		100% {
			transform: translateY(-4px) rotate(-3deg);
		}
	}

	@keyframes arm-waving {
		0%,
		100% {
			transform: rotate(0deg);
		}
		50% {
			transform: rotate(-25deg);
		}
	}

	@keyframes arm-cheering {
		0% {
			transform: scale(0.8) translateY(4px);
		}
		100% {
			transform: scale(1.1) translateY(-4px);
		}
	}

	@keyframes wave-slide {
		0% {
			transform: translateX(0);
		}
		100% {
			transform: translateX(50%);
		}
	}

	@keyframes wave-slide-reverse {
		0% {
			transform: translateX(0);
		}
		100% {
			transform: translateX(-50%);
		}
	}

	@keyframes buoy-toss {
		0% {
			transform: translateX(-50%) scale(1);
		}
		35% {
			transform: translateX(-50%) translateY(-35px) scale(1.18) rotate(-15deg);
		}
		70% {
			transform: translateX(-50%) translateY(5px) scale(0.92) rotate(10deg);
		}
		100% {
			transform: translateX(-50%) scale(1) rotate(0deg);
		}
	}

	@keyframes buoy-safe {
		0% {
			transform: translateX(-50%) scale(1);
		}
		60% {
			transform: translateX(-50%) translateY(-18px) scale(1.12);
		}
		100% {
			transform: translateX(-50%) translateY(-6px) scale(1.05);
		}
	}

	@keyframes rope-throw {
		0% {
			transform: rotate(-18deg) scaleX(0);
			opacity: 0;
		}
		50% {
			opacity: 0.9;
		}
		100% {
			transform: rotate(-18deg) scaleX(1);
			opacity: 0.85;
		}
	}

	@keyframes pulse-ring {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.2) rotate(15deg);
		}
	}

	@keyframes pop-in {
		0% {
			opacity: 0;
			transform: scale(0.92) translateY(8px);
		}
		100% {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	@media (max-width: 640px) {
		.error-title {
			font-size: 2.1rem;
		}

		.ocean-stage {
			height: 160px;
		}

		.action-grid {
			flex-direction: column;
		}

		.btn-primary,
		.btn-secondary {
			width: 100%;
		}

		.error-card {
			padding: 2rem 1.25rem 2rem;
		}

		.distant-boat {
			right: 12px;
			top: 12px;
		}
	}
</style>
