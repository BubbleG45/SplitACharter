<script lang="ts">
	import logoWhite from '$lib/assets/logo-white.svg';
	import logoDark from '$lib/assets/logo.svg';
	import { theme } from '$lib/stores/theme';
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

	<main class="login-container glass glow-primary">
		<div class="login-header">
			<a href="/" class="logo-link" style="margin: 0 auto 1.5rem auto; display: inline-block;">
				<img src={logoWhite} alt="SplitACharter Logo" class="header-logo logo-dark-theme" style="height: 60px;" />
				<img src={logoDark} alt="SplitACharter Logo" class="header-logo logo-light-theme" style="height: 60px;" />
			</a>
			<h2>Welcome back</h2>
			<p class="subtitle">Sign in to manage or book your shared charters</p>
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

		<!-- Google Sign-In -->
		{#if !(form?.success && form?.method === 'phone')}
			<form method="POST" action="?/signInWithGoogle" class="oauth-form">
				<button type="submit" class="btn btn-google w-full">
					<svg class="google-icon" viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
						<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
						<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
						<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
						<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
					</svg>
					<span>Continue with Google</span>
				</button>
			</form>

			<div class="divider">
				<span class="divider-line"></span>
				<span class="divider-text">or continue with</span>
				<span class="divider-line"></span>
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
					<p class="sms-disclosure">
						By submitting your phone number, you agree to receive a one-time verification code via SMS from SplitACharter. Message and data rates may apply. Reply HELP for help, STOP to cancel. View <a href="/terms">Terms</a> &amp; <a href="/privacy">Privacy Policy</a>.
					</p>
				</form>
			{/if}
		{/if}
	</main>
</div>

<style>
	.login-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		position: relative;
		overflow: hidden;
		background: var(--bg-base);
		color: var(--text-primary);
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
	.logo-link {
		transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
	}
	.logo-link:hover {
		transform: scale(1.02);
	}
	:root[data-theme="light"] .logo-dark-theme {
		display: none !important;
	}
	:root[data-theme="light"] .logo-light-theme {
		display: block !important;
	}
	:root[data-theme="dark"] .logo-dark-theme,
	:root:not([data-theme]) .logo-dark-theme {
		display: block !important;
	}
	:root[data-theme="dark"] .logo-light-theme,
	:root:not([data-theme]) .logo-light-theme {
		display: none !important;
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

	.oauth-form {
		margin-bottom: 1.25rem;
	}
	.btn-google {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		background: var(--bg-surface-elevated);
		border: 1px solid var(--border-light);
		color: var(--text-primary);
		padding: 10px 16px;
		border-radius: 8px;
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}
	.btn-google:hover {
		border-color: var(--primary);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		transform: translateY(-1px);
	}
	.google-icon {
		width: 20px;
		height: 20px;
		flex-shrink: 0;
	}
	.divider {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 1.5rem;
	}
	.divider-line {
		flex: 1;
		height: 1px;
		background: var(--border-light);
	}
	.divider-text {
		font-size: 0.75rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 600;
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

	.sms-disclosure {
		font-size: 0.76rem;
		color: var(--text-muted);
		line-height: 1.45;
		margin-top: -0.5rem;
		text-align: center;
	}
	.sms-disclosure a {
		color: var(--primary);
		text-decoration: underline;
		font-weight: 500;
	}
	.sms-disclosure a:hover {
		color: var(--primary-hover, var(--primary));
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
		border: 1px solid rgba(239, 68, 68, 0.25);
		color: var(--danger);
	}
	.alert-success {
		background: rgba(16, 185, 129, 0.12);
		border: 1px solid rgba(16, 185, 129, 0.25);
		color: var(--success);
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
