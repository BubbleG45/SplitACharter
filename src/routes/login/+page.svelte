<script lang="ts">
	import logoWhite from '$lib/assets/logo-white.svg';
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';

	let { form } = $props();

	let activeTab = $state('email'); // 'email' | 'phone'
	let emailVal = $state('');
	let phoneVal = $state('');
	let verificationCode = $state('');

	// Access url query parameters for error alerts
	const authError = $page.url.searchParams.get('error');

	// Automatically focus the active tab if form returns with phone state
	$effect(() => {
		if (form?.success && form?.method === 'phone') {
			activeTab = 'phone';
			phoneVal = form.phone || '';
		}
	});
</script>

<svelte:head>
	<title>Sign In — SplitACharter</title>
</svelte:head>

<div class="login-wrapper">
	<!-- Background Blur Elements -->
	<div class="bg-blur bg-blur-1"></div>
	<div class="bg-blur bg-blur-2"></div>

	<div class="login-container glass glow-primary">
		<div class="login-header">
			<a href="/" class="logo-link" style="margin: 0 auto 1.5rem auto; display: inline-block;">
				<img src={logoWhite} alt="SplitACharter Logo" class="header-logo" style="height: 60px;" />
			</a>
			<h2>Welcome back</h2>
			<p class="subtitle">Passwordless login to manage or book your shared charters</p>
		</div>

		<!-- Alerts -->
		{#if authError === 'auth-failed'}
			<div class="alert alert-danger glass">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="20" height="20" class="w-5 h-5 alert-icon">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
				</svg>
				<span>Authentication failed. The magic link may have expired.</span>
			</div>
		{/if}

		{#if form?.message}
			<div class="alert {form.success ? 'alert-success' : 'alert-danger'} glass">
				{#if form.success}
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="20" height="20" class="w-5 h-5 alert-icon">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="20" height="20" class="w-5 h-5 alert-icon">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
					</svg>
				{/if}
				<span>{form.message}</span>
			</div>
		{/if}

		<!-- Tabs -->
		{#if !(form?.success && form?.method === 'phone')}
			<div class="tabs-header">
				<button
					type="button"
					class="tab-btn {activeTab === 'email' ? 'active' : ''}"
					onclick={() => activeTab = 'email'}
				>
					Email Link
				</button>
				<button
					type="button"
					class="tab-btn {activeTab === 'phone' ? 'active' : ''}"
					onclick={() => activeTab = 'phone'}
				>
					SMS Code
				</button>
			</div>
		{/if}

		<!-- Email Form -->
		{#if activeTab === 'email' && !(form?.success && form?.method === 'phone')}
			<form method="POST" action="?/signInWithEmail" use:enhance class="login-form">
				<div class="form-group">
					<label for="email">Email Address</label>
					<input
						type="email"
						id="email"
						name="email"
						placeholder="name@example.com"
						bind:value={emailVal}
						required
					/>
				</div>
				<button type="submit" class="btn btn-primary w-full">Send Magic Link</button>
			</form>
		{/if}

		<!-- Phone Form -->
		{#if activeTab === 'phone'}
			{#if form?.success && form?.method === 'phone'}
				<!-- OTP Code Entry Step -->
				<form method="POST" action="?/verifyOtp" use:enhance class="login-form">
					<input type="hidden" name="phone" value={phoneVal} />
					<div class="form-group">
						<label for="token">6-Digit Verification Code</label>
						<input
							type="text"
							id="token"
							name="token"
							placeholder="123456"
							pattern="[0-9]{6}"
							maxlength="6"
							bind:value={verificationCode}
							required
							autofocus
						/>
						<span class="input-helper">We sent a verification text to {phoneVal}</span>
					</div>
					<button type="submit" class="btn btn-primary w-full">Verify Code</button>
					<a href="/login" class="btn btn-secondary w-full text-center mt-2">Back to login</a>
				</form>
			{:else}
				<!-- Phone Number Request Step -->
				<form method="POST" action="?/signInWithPhone" use:enhance class="login-form">
					<div class="form-group">
						<label for="phone">Phone Number</label>
						<input
							type="tel"
							id="phone"
							name="phone"
							placeholder="+15551234567"
							bind:value={phoneVal}
							required
						/>
						<span class="input-helper">Include country code (e.g., +1 for USA)</span>
					</div>
					<button type="submit" class="btn btn-primary w-full">Send Code via SMS</button>
				</form>
			{/if}
		{/if}
	</div>
</div>

<style>
	.login-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		position: relative;
		overflow: hidden;
		background: #060913;
		padding: 1.5rem;
	}

	/* Glowing decorative blobs */
	.bg-blur {
		position: absolute;
		border-radius: 50%;
		filter: blur(150px);
		z-index: 1;
		pointer-events: none;
		opacity: 0.15;
	}
	.bg-blur-1 {
		background: var(--primary);
		width: 400px;
		height: 400px;
		top: 10%;
		right: 15%;
	}
	.bg-blur-2 {
		background: var(--secondary);
		width: 400px;
		height: 400px;
		bottom: 10%;
		left: 15%;
	}

	.login-container {
		width: 100%;
		max-width: 440px;
		padding: 3rem 2.5rem;
		z-index: 2;
		border: 1px solid var(--border-light);
	}
	.login-header {
		text-align: center;
		margin-bottom: 2rem;
	}
	.logo-text {
		font-family: var(--font-heading);
		font-weight: 800;
		font-size: 1.75rem;
		background: linear-gradient(135deg, var(--primary), var(--secondary));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		letter-spacing: -0.5px;
		margin-bottom: 1rem;
		display: inline-block;
	}
	.login-header h2 {
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
	}
	.subtitle {
		font-size: 0.85rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}

	.tabs-header {
		display: flex;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid var(--border-light);
		padding: 4px;
		border-radius: 8px;
		margin-bottom: 2rem;
	}
	.tab-btn {
		flex: 1;
		background: transparent;
		border: none;
		color: var(--text-secondary);
		padding: 8px;
		font-size: 0.9rem;
		font-weight: 600;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s ease;
	}
	.tab-btn.active {
		background: var(--bg-surface-elevated);
		color: var(--text-primary);
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
	}

	.login-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	.form-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	label {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-secondary);
	}
	.input-helper {
		font-size: 0.75rem;
		color: var(--text-muted);
	}
	.w-full {
		width: 100%;
	}
	.text-center {
		text-align: center;
	}
	.mt-2 {
		margin-top: 0.5rem;
	}

	.alert {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 14px;
		border-radius: 8px;
		margin-bottom: 1.5rem;
		font-size: 0.85rem;
	}
	.alert-danger {
		background: rgba(239, 68, 68, 0.12);
		border: 1px solid rgba(239, 68, 68, 0.2);
		color: #fca5a5;
	}
	.alert-success {
		background: rgba(16, 185, 129, 0.12);
		border: 1px solid rgba(16, 185, 129, 0.2);
		color: #a7f3d0;
	}
	.alert-icon {
		width: 20px;
		height: 20px;
		flex-shrink: 0;
	}

	@media (max-width: 480px) {
		.login-container {
			padding: 2rem 1.5rem;
		}
	}
</style>
