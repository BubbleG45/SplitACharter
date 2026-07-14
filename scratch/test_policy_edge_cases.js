// scratch/test_policy_edge_cases.js
// Verification script for Phase 7 (Flagged User Blocking & Webhook Idempotency)

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import fetch from 'node-fetch';

// Load .env variables
let env = {};
try {
    const envFile = fs.readFileSync('.env', 'utf8');
    envFile.split(/\r?\n/).forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            let value = match[2] ? match[2].trim() : '';
            if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
            env[match[1]] = value;
        }
    });
} catch (e) {
    console.error("Failed to read .env file:", e.message);
}

const supabaseUrl = env.PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getActiveUrl() {
    for (const port of [5173, 5174, 5175]) {
        try {
            const res = await fetch(`http://localhost:${port}/api/debug/mock-sms-logs`);
            if (res.ok) return `http://localhost:${port}`;
        } catch (e) {}
    }
    return 'http://localhost:5173';
}

async function runTests() {
    console.log("--- STARTING PHASE 7 HARDENING & IDEMPOTENCY INTEGRATION TESTS ---");

    const baseUrl = await getActiveUrl();
    console.log(`Targeting dev server at: ${baseUrl}`);

    let testCustomerId = null;
    let testBookingId = null;
    let testListingId = null;
    let testTripId = null;
    let testPaymentId = null;
    let testRefundId = null;
    let originalCustomerState = null;

    try {
        // Setup a test customer profile and flag them
        console.log("\nSetting up test customer profile...");
        const { data: usersData } = await supabase.auth.admin.listUsers();
        if (!usersData || usersData.users.length === 0) {
            throw new Error("No users found in auth.users");
        }
        const user = usersData.users[0];
        testCustomerId = user.id;

        // Query existing profile state
        const { data: existingCust } = await supabase
            .from('customers')
            .select('*')
            .eq('id', testCustomerId)
            .maybeSingle();

        if (existingCust) {
            originalCustomerState = {
                id: existingCust.id,
                strike_count: existingCust.strike_count,
                flagged: existingCust.flagged
            };
            // Set as flagged
            await supabase.from('customers').update({ strike_count: 3, flagged: true }).eq('id', testCustomerId);
        } else {
            await supabase.from('customers').insert({
                id: testCustomerId,
                name: "Flagged Tester",
                email: user.email || "flagged_tester@splitacharter.com",
                phone: "+15558880000",
                strike_count: 3,
                flagged: true,
                how_heard: "Search Engine"
            });
        }
        // Test 0: Flagged Customer Block Query validation
        console.log("\nTest 0: Flagged Customer Block query validation...");
        const testPhone = "+15558880000";
        const { data: flaggedMatch, error: flaggedErr } = await supabase
            .from('customers')
            .select('id, name, flagged, strike_count')
            .or(`id.eq.${testCustomerId},email.eq.${user.email || ''},phone.eq.${testPhone}`)
            .or('flagged.eq.true,strike_count.gte.3')
            .limit(1)
            .maybeSingle();

        if (flaggedErr) {
            throw new Error(`Flagged match query failed: ${flaggedErr.message}`);
        }
        if (!flaggedMatch) {
            throw new Error("Expected flagged query to find a match, but none was returned.");
        }
        console.log(`✔ Block query successfully flagged match: ${JSON.stringify(flaggedMatch)}`);

        // Setup Listing
        const { data: newListing } = await supabase
            .from('listing_templates')
            .insert({
                trip_type: "Test Hardening Fishing",
                location: "Miami Beach Marina",
                duration: "04:00:00",
                low_price: 600,
                high_price: 600,
                max_passengers: 6,
                description: "Test description for hardening",
                whats_included: ["Tackle"],
                what_to_bring: ["Sunscreen"],
                meeting_area: "Slip 5",
                active: true
            })
            .select('id')
            .single();
        testListingId = newListing?.id;

        // Setup Trip Instance
        const { data: newTrip } = await supabase
            .from('trip_instances')
            .insert({
                listing_template_id: testListingId,
                date: "2030-07-20",
                status: "open"
            })
            .select('id')
            .single();
        testTripId = newTrip?.id;

        // Setup Booking (unpaid)
        const { data: newBooking } = await supabase
            .from('bookings')
            .insert({
                trip_instance_id: testTripId,
                customer_id: testCustomerId,
                group_size: 2,
                status: "pending-payment"
            })
            .select('id')
            .single();
        testBookingId = newBooking?.id;

        // Test 1: Stripe Webhook Succeeded Event & Idempotency Audit
        console.log("\nTest 1: Webhook Succeeded Event & Idempotency...");
        const webhookUrl = `${baseUrl}/api/webhooks/stripe`;
        const testIntentId = `pi_test_webhook_${Math.random().toString(36).substring(7)}`;

        const eventPayload = {
            id: `evt_${Math.random().toString(36).substring(7)}`,
            type: "payment_intent.succeeded",
            data: {
                object: {
                    id: testIntentId,
                    amount: 5000, // $50.00
                    metadata: {
                        bookingId: testBookingId
                    }
                }
            }
        };

        // First delivery: should succeed and record payment
        console.log("Delivering webhook event first time...");
        const res1 = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventPayload)
        });

        const data1 = await res1.json();
        console.log("First delivery response:", JSON.stringify(data1, null, 2));
        if (!data1.success || !data1.processed) {
            throw new Error("First webhook delivery failed to process.");
        }
        testPaymentId = data1.recordId;

        // Query booking: should be updated to 'paid'
        const { data: bookingAfterPay } = await supabase
            .from('bookings')
            .select('status')
            .eq('id', testBookingId)
            .single();
        if (bookingAfterPay?.status !== 'paid') {
            throw new Error(`Expected booking status to be 'paid', found: ${bookingAfterPay?.status}`);
        }
        console.log("✔ First delivery updated booking to 'paid' and registered transaction.");

        // Second delivery (redelivery of identical Stripe Intent ID): should be ignored as idempotent no-op
        console.log("Delivering duplicate webhook event...");
        const res2 = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventPayload)
        });

        const data2 = await res2.json();
        console.log("Second delivery response:", JSON.stringify(data2, null, 2));
        if (!data2.idempotent || data2.processed) {
            throw new Error("Duplicate webhook delivery processed twice! Idempotency failed.");
        }
        console.log("✔ Duplicate delivery successfully identified as idempotent no-op.");

        // Test 2: Webhook Refunded Event
        console.log("\nTest 2: Webhook Refunded Event...");
        const refundPayload = {
            id: `evt_${Math.random().toString(36).substring(7)}`,
            type: "charge.refunded",
            data: {
                object: {
                    id: `re_test_webhook_${Math.random().toString(36).substring(7)}`,
                    amount: 5000,
                    metadata: {
                        bookingId: testBookingId
                    }
                }
            }
        };

        const resRefund = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(refundPayload)
        });

        const dataRefund = await resRefund.json();
        console.log("Refund event response:", JSON.stringify(dataRefund, null, 2));
        if (!dataRefund.success || !dataRefund.processed) {
            throw new Error("Refund webhook delivery failed to process.");
        }
        testRefundId = dataRefund.recordId;

        // Query booking: should be updated to 'canceled'
        const { data: bookingAfterRefund } = await supabase
            .from('bookings')
            .select('status')
            .eq('id', testBookingId)
            .single();
        if (bookingAfterRefund?.status !== 'canceled') {
            throw new Error(`Expected booking status to be 'canceled', found: ${bookingAfterRefund?.status}`);
        }
        console.log("✔ Refund delivery updated booking to 'canceled' and registered refund transaction.");

        console.log("\n--- ALL Phase 7 HARDENING & IDEMPOTENCY INTEGRATION TESTS PASSED ---");
    } catch (e) {
        console.error("\n❌ Hardening tests failed with error:", e.message);
    } finally {
        console.log("\nCleaning up test records...");
        if (testRefundId) await supabase.from('payment_records').delete().eq('id', testRefundId);
        if (testPaymentId) await supabase.from('payment_records').delete().eq('id', testPaymentId);
        if (testBookingId) await supabase.from('bookings').delete().eq('id', testBookingId);
        if (testTripId) await supabase.from('trip_instances').delete().eq('id', testTripId);
        if (testListingId) await supabase.from('listing_templates').delete().eq('id', testListingId);
        
        // Restore customer state
        if (testCustomerId && originalCustomerState) {
            await supabase.from('customers').update({
                strike_count: originalCustomerState.strike_count,
                flagged: originalCustomerState.flagged
            }).eq('id', testCustomerId);
        } else if (testCustomerId) {
            await supabase.from('customers').delete().eq('id', testCustomerId);
        }
        console.log("Cleanup complete.");
    }
}

runTests();
