import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { sendEmail, getSiteUrl } from './notifications';

const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export interface AccountLinkingInitParams {
	primaryUserId: string;
	secondaryUserId: string;
	email: string;
	phone: string;
	origin?: string;
}

/**
 * Generates a secure token, stores the account linking request, and sends a verification email
 * to the owner of the existing email address to approve merging the SMS account into the primary Email account.
 */
export async function initiateAccountLinking({
	primaryUserId,
	secondaryUserId,
	email,
	phone,
	origin
}: AccountLinkingInitParams): Promise<{ success: boolean; error?: string }> {
	try {
		const rawToken = crypto.randomBytes(32).toString('hex');
		const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
		const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hour expiry

		// Upsert linking request token
		const { error: insertError } = await supabaseAdmin
			.from('account_linking_tokens')
			.upsert(
				{
					token_hash: tokenHash,
					primary_user_id: primaryUserId,
					secondary_user_id: secondaryUserId,
					email,
					phone,
					expires_at: expiresAt
				},
				{ onConflict: 'token_hash' }
			);

		if (insertError) {
			console.error('Failed to save account linking token:', insertError);
			return { success: false, error: insertError.message };
		}

		const siteUrl = getSiteUrl(origin);
		const linkUrl = `${siteUrl}/auth/link-account?token=${rawToken}`;

		const subject = 'Action Required: Link your SplitACharter account';
		const contentHtml = `Hello,

We noticed a request to add phone number ${phone} to an account with this email address (${email}).

To combine your phone login and email account into a single unified profile with all your bookings, please verify your ownership by clicking the button below:

${linkUrl}

If you did not request this account link, you can safely ignore this email and your existing account will remain unchanged.`;

		const emailRes = await sendEmail(email, subject, contentHtml, 'account_linking_request');
		return { success: emailRes.success, error: emailRes.error };
	} catch (err: any) {
		console.error('Error initiating account linking:', err);
		return { success: false, error: err?.message || 'Failed to initiate account linking' };
	}
}

/**
 * Verifies an account linking token, updates the primary user's phone, re-points bookings and customer profile,
 * deletes the temporary SMS auth record, and returns a magic link for authenticating the primary user.
 */
export async function executeAccountMerge(rawToken: string): Promise<{
	success: boolean;
	primaryUserId?: string;
	email?: string;
	magicLink?: string;
	error?: string;
}> {
	try {
		if (!rawToken) {
			return { success: false, error: 'Linking token is missing.' };
		}

		const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

		const { data: record, error: fetchErr } = await supabaseAdmin
			.from('account_linking_tokens')
			.select('*')
			.eq('token_hash', tokenHash)
			.maybeSingle();

		if (fetchErr || !record) {
			return { success: false, error: 'Invalid or expired account linking token.' };
		}

		if (new Date(record.expires_at) < new Date()) {
			await supabaseAdmin.from('account_linking_tokens').delete().eq('id', record.id);
			return { success: false, error: 'Account linking link has expired. Please request a new link.' };
		}

		const { primary_user_id: primaryUserId, secondary_user_id: secondaryUserId, phone, email } = record;

		// 1. Update primary user's phone number in auth.users
		const { error: updateAuthErr } = await supabaseAdmin.auth.admin.updateUserById(primaryUserId, {
			phone,
			phone_confirm: true
		});

		if (updateAuthErr) {
			console.error('Error updating primary auth.users phone:', updateAuthErr);
		}

		// 2. Transfer all bookings from secondary user to primary user
		const { error: bookingTransferErr } = await supabaseAdmin
			.from('bookings')
			.update({ customer_id: primaryUserId })
			.eq('customer_id', secondaryUserId);

		if (bookingTransferErr) {
			console.error('Error transferring bookings during account merge:', bookingTransferErr);
		}

		// 3. Consolidate customer profile data
		const { data: secCustomer } = await supabaseAdmin
			.from('customers')
			.select('*')
			.eq('id', secondaryUserId)
			.maybeSingle();

		const { data: primCustomer } = await supabaseAdmin
			.from('customers')
			.select('*')
			.eq('id', primaryUserId)
			.maybeSingle();

		const mergedName = secCustomer?.name || primCustomer?.name || 'Customer';
		const mergedHowHeard = secCustomer?.how_heard || primCustomer?.how_heard || 'Other';
		const mergedSmsOptIn = secCustomer?.sms_opt_in ?? primCustomer?.sms_opt_in ?? true;
		const maxStrikes = Math.max(primCustomer?.strike_count || 0, secCustomer?.strike_count || 0);
		const isFlagged = Boolean(primCustomer?.flagged || secCustomer?.flagged);

		const { error: customerUpsertErr } = await supabaseAdmin.from('customers').upsert({
			id: primaryUserId,
			name: mergedName,
			email: email,
			phone: phone,
			sms_opt_in: mergedSmsOptIn,
			how_heard: mergedHowHeard,
			strike_count: maxStrikes,
			flagged: isFlagged,
			updated_at: new Date().toISOString()
		});

		if (customerUpsertErr) {
			console.error('Error upserting primary customer during merge:', customerUpsertErr);
		}

		// Delete secondary customer record
		if (secCustomer) {
			await supabaseAdmin.from('customers').delete().eq('id', secondaryUserId);
		}

		// 4. Delete token
		await supabaseAdmin.from('account_linking_tokens').delete().eq('id', record.id);

		// 5. Delete secondary transient auth user
		try {
			await supabaseAdmin.auth.admin.deleteUser(secondaryUserId);
		} catch (delErr) {
			console.error('Non-fatal error deleting secondary auth user:', delErr);
		}

		// 6. Generate magic link to log the user in as primary user
		const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
			type: 'magiclink',
			email: email
		});

		if (linkErr || !linkData?.properties?.hashed_token) {
			console.error('Failed to generate magiclink for merged primary user:', linkErr);
			return { success: true, primaryUserId, email };
		}

		const magicTokenHash = linkData.properties.hashed_token;
		const magicLink = `/auth/callback?token_hash=${magicTokenHash}&type=magiclink&next=${encodeURIComponent('/dashboard?account_merged=true')}`;

		return {
			success: true,
			primaryUserId,
			email,
			magicLink
		};
	} catch (err: any) {
		console.error('Unhandled exception during account merge execution:', err);
		return { success: false, error: err?.message || 'An unexpected error occurred during account merge.' };
	}
}
