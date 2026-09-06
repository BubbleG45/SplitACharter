<script lang="ts">
	interface Slide {
		id: string;
		title: string;
		caption: string;
		image_url: string;
		link_url?: string | null;
		link_text?: string | null;
		object_position?: string | null;
	}

	let { slides = [] }: { slides: Slide[] } = $props();

	let currentIndex = $state(0);
	let isHovered = $state(false);
	let touchStartX = $state(0);
	let touchEndX = $state(0);

	// Ensure index stays in bounds if slides change
	$effect(() => {
		if (slides.length > 0 && currentIndex >= slides.length) {
			currentIndex = 0;
		}
	});

	// Autoplay every 5 seconds when not hovered and multiple slides exist
	$effect(() => {
		if (slides.length <= 1 || isHovered) return;

		const timer = setInterval(() => {
			currentIndex = (currentIndex + 1) % slides.length;
		}, 5000);

		return () => clearInterval(timer);
	});

	function prevSlide() {
		if (slides.length <= 1) return;
		currentIndex = (currentIndex - 1 + slides.length) % slides.length;
	}

	function nextSlide() {
		if (slides.length <= 1) return;
		currentIndex = (currentIndex + 1) % slides.length;
	}

	function goToSlide(index: number) {
		currentIndex = index;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowLeft') {
			prevSlide();
		} else if (e.key === 'ArrowRight') {
			nextSlide();
		}
	}

	function handleTouchStart(e: TouchEvent) {
		touchStartX = e.changedTouches[0].screenX;
	}

	function handleTouchEnd(e: TouchEvent) {
		touchEndX = e.changedTouches[0].screenX;
		const diff = touchStartX - touchEndX;
		if (Math.abs(diff) > 45) {
			if (diff > 0) {
				nextSlide();
			} else {
				prevSlide();
			}
		}
	}
</script>

{#if slides && slides.length > 0}
	<div
		class="carousel-container"
		role="region"
		aria-roledescription="carousel"
		aria-label="Charter Highlights Showcase"
		onmouseenter={() => (isHovered = true)}
		onmouseleave={() => (isHovered = false)}
		onfocusin={() => (isHovered = true)}
		onfocusout={() => (isHovered = false)}
		onkeydown={handleKeydown}
		ontouchstart={handleTouchStart}
		ontouchend={handleTouchEnd}
		tabindex="0"
	>
		<div class="carousel-viewport">
			<div
				class="carousel-track"
				style="transform: translateX(-{currentIndex * 100}%);"
			>
				{#each slides as slide, index (slide.id || index)}
					<div
						class="carousel-slide"
						class:active={index === currentIndex}
						role="group"
						aria-roledescription="slide"
						aria-label="{index + 1} of {slides.length}: {slide.title}"
					>
						<div class="slide-media-wrapper">
							<img
								src={slide.image_url}
								alt={slide.title}
								loading={index === 0 ? 'eager' : 'lazy'}
								class="slide-img"
								style="object-position: {slide.object_position || 'center'};"
								onerror={(e) => {
									const img = e.currentTarget as HTMLImageElement;
									if (!img.src.includes('photo-1544551763-46a013bb70d5')) {
										img.src = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1600&q=80';
									}
								}}
							/>
							<div class="slide-scrim"></div>
						</div>

						<div class="slide-content">
							<span class="slide-badge">Private Split Experiences</span>
							<h3 class="slide-title">{slide.title}</h3>
							<p class="slide-caption">{slide.caption}</p>
							{#if slide.link_url}
								<div class="slide-actions">
									<a href={slide.link_url} class="btn btn-primary slide-btn">
										{slide.link_text || 'Explore Charters'}
										<span class="btn-arrow" aria-hidden="true">→</span>
									</a>
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>

			<!-- Navigation Controls -->
			{#if slides.length > 1}
				<button
					type="button"
					class="nav-btn prev-btn"
					onclick={prevSlide}
					aria-label="Previous slide"
				>
					<svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
						<polyline points="15 18 9 12 15 6"></polyline>
					</svg>
				</button>
				<button
					type="button"
					class="nav-btn next-btn"
					onclick={nextSlide}
					aria-label="Next slide"
				>
					<svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
						<polyline points="9 18 15 12 9 6"></polyline>
					</svg>
				</button>
			{/if}
		</div>

		<!-- Pagination Indicators -->
		{#if slides.length > 1}
			<div class="carousel-dots" role="tablist" aria-label="Slide indicators">
				{#each slides as slide, idx (slide.id || idx)}
					<button
						type="button"
						role="tab"
						class="dot-btn"
						class:active={idx === currentIndex}
						aria-selected={idx === currentIndex}
						aria-label="Go to slide {idx + 1}: {slide.title}"
						onclick={() => goToSlide(idx)}
					>
						<span class="dot-fill"></span>
					</button>
				{/each}
			</div>
		{/if}
	</div>
{/if}

<style>
	.carousel-container {
		position: relative;
		width: 100%;
		border-radius: 24px;
		overflow: hidden;
		background: var(--bg-surface);
		border: 1px solid var(--border-light);
		box-shadow: 0 12px 32px -8px rgba(0, 0, 0, 0.18);
		outline: none;
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
	}

	.carousel-container:focus-visible {
		border-color: var(--primary);
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
	}

	.carousel-viewport {
		position: relative;
		width: 100%;
		overflow: hidden;
		aspect-ratio: 16 / 9;
		min-height: 380px;
		max-height: 540px;
	}

	@media (max-width: 768px) {
		.carousel-viewport {
			aspect-ratio: 4 / 3;
			min-height: 340px;
		}
	}

	.carousel-track {
		display: flex;
		height: 100%;
		width: 100%;
		transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
		will-change: transform;
	}

	.carousel-slide {
		flex: 0 0 100%;
		width: 100%;
		height: 100%;
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		overflow: hidden;
	}

	.slide-media-wrapper {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		z-index: 1;
	}

	.slide-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
		transition: transform 6s ease-out;
		user-select: none;
		-webkit-user-drag: none;
	}

	.carousel-slide.active .slide-img {
		transform: scale(1.04);
	}

	/* Rich gradient overlay ensures text readability regardless of image brightness */
	.slide-scrim {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			180deg,
			rgba(10, 15, 29, 0.1) 0%,
			rgba(10, 15, 29, 0.45) 45%,
			rgba(10, 15, 29, 0.92) 100%
		);
		pointer-events: none;
	}

	.slide-content {
		position: relative;
		z-index: 2;
		padding: 2.5rem;
		max-width: 700px;
		color: #ffffff;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		transform: translateY(0);
		transition: transform 0.4s ease;
	}

	@media (max-width: 640px) {
		.slide-content {
			padding: 1.5rem;
			gap: 0.5rem;
		}
	}

	.slide-badge {
		align-self: flex-start;
		background: rgba(255, 255, 255, 0.18);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		border: 1px solid rgba(255, 255, 255, 0.3);
		color: #ffffff;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		padding: 4px 12px;
		border-radius: 9999px;
	}

	.slide-title {
		font-size: 2.15rem;
		font-weight: 850;
		line-height: 1.2;
		color: #ffffff;
		margin: 0;
		text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
	}

	@media (max-width: 640px) {
		.slide-title {
			font-size: 1.45rem;
		}
	}

	.slide-caption {
		font-size: 1.05rem;
		line-height: 1.5;
		color: rgba(255, 255, 255, 0.9);
		margin: 0;
		text-shadow: 0 1px 6px rgba(0, 0, 0, 0.4);
	}

	@media (max-width: 640px) {
		.slide-caption {
			font-size: 0.9rem;
			line-height: 1.4;
		}
	}

	.slide-actions {
		margin-top: 0.5rem;
	}

	.slide-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 10px 22px;
		font-size: 0.95rem;
		font-weight: 700;
		box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
	}

	.btn-arrow {
		transition: transform 0.2s ease;
	}

	.slide-btn:hover .btn-arrow {
		transform: translateX(4px);
	}

	/* Navigation Arrow Buttons */
	.nav-btn {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		z-index: 5;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		background: rgba(15, 23, 42, 0.65);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.25);
		color: #ffffff;
		cursor: pointer;
		opacity: 0.75;
		transition: opacity 0.2s ease, background-color 0.2s ease, transform 0.2s ease;
	}

	.nav-btn:hover {
		opacity: 1;
		background: rgba(15, 23, 42, 0.9);
		transform: translateY(-50%) scale(1.08);
	}

	.prev-btn {
		left: 1.25rem;
	}

	.next-btn {
		right: 1.25rem;
	}

	@media (max-width: 640px) {
		.nav-btn {
			width: 36px;
			height: 36px;
		}
		.prev-btn {
			left: 0.75rem;
		}
		.next-btn {
			right: 0.75rem;
		}
	}

	/* Pagination Dots */
	.carousel-dots {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 8px;
		padding: 1rem 0;
		background: var(--bg-surface);
		border-top: 1px solid var(--border-light);
	}

	.dot-btn {
		background: transparent;
		border: none;
		cursor: pointer;
		padding: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.dot-fill {
		display: block;
		width: 10px;
		height: 10px;
		border-radius: 9999px;
		background: var(--text-secondary);
		opacity: 0.35;
		transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
	}

	.dot-btn.active .dot-fill {
		width: 28px;
		background: var(--primary);
		opacity: 1;
	}

	.dot-btn:hover .dot-fill {
		opacity: 0.75;
	}
</style>
