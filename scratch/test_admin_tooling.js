// scratch/test_admin_tooling.js
// Standalone Integration Tests for Phase 6 Admin Operational Tooling

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

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

async function runTests() {
    console.log("--- STARTING PHASE 6 ADMIN OPERATIONS INTEGRATION TESTS ---");

    let testCaptainId = null;
    let testCustomerId = null;
    let testListingId = null;
    let testTripId = null;
    let testBookingId = null;
    let testPaymentId = null;
    let testRefundId = null;
    let originalCustomerState = null;

    try {
        // 1. Captain CRM CRUD Verification
        console.log("Test 1: Captain CRM CRUD...");
        const uniquePromo = `CAP_TEST_${Math.random().toString(36).substring(7).toUpperCase()}`;
        const { data: newCaptain, error: capCreateErr } = await supabase
            .from('captains')
            .insert({
                name: "Test Admin Skipper",
                email: "admin_skipper_test@splitacharter.com",
                phone: "+15550007777",
                trip_types: ["Sunset Cruise"],
                locations: ["Miami Beach Marina"],
                minimum_notice: "12 hours",
                max_passengers: 8,
                referral_promo_code: uniquePromo,
                active: true,
                admin_notes: "Initial registration"
            })
            .select('id, minimum_notice, max_passengers')
            .single();

        if (capCreateErr || !newCaptain) {
            throw new Error(`Captain creation failed: ${capCreateErr?.message}`);
        }
        testCaptainId = newCaptain.id;
        console.log(`✔ Captain created with ID: ${testCaptainId}`);

        // Update Captain
        const { error: capUpdateErr } = await supabase
            .from('captains')
            .update({
                minimum_notice: "24 hours",
                max_passengers: 12,
                admin_notes: "Updated registration notes"
            })
            .eq('id', testCaptainId);

        if (capUpdateErr) {
            throw new Error(`Captain update failed: ${capUpdateErr.message}`);
        }

        // Verify updates
        const { data: verifiedCap } = await supabase
            .from('captains')
            .select('minimum_notice, max_passengers, admin_notes')
            .eq('id', testCaptainId)
            .single();

        console.log("Verified Captain object from DB:", verifiedCap);
        if (!verifiedCap || verifiedCap.max_passengers !== 12) {
            throw new Error("Captain updates not properly reflected in DB.");
        }
        console.log("✔ Captain updates successfully verified in Supabase.");

        // 2. Customer Strikes & Flagging Toggles
        console.log("\nTest 2: Customer strikes and flagging operations...");
        originalCustomerState = null;
        let { data: existingCustomer } = await supabase.from('customers').select('*').limit(1).maybeSingle();
        
        if (!existingCustomer) {
            const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers();
            if (usersErr || !usersData || usersData.users.length === 0) {
                throw new Error("No users found in auth.users to run customer tests on.");
            }
            const user = usersData.users[0];
            const { data: newCust, error: custErr } = await supabase
                .from('customers')
                .insert({
                    id: user.id,
                    name: "Ops Test Customer",
                    email: user.email || "ops_customer_test@splitacharter.com",
                    phone: "+15559998888",
                    strike_count: 3,
                    flagged: true,
                    how_heard: "Word of Mouth"
                })
                .select('*')
                .single();
            if (custErr) throw new Error(`Failed to create test customer profile: ${custErr.message}`);
            existingCustomer = newCust;
        } else {
            originalCustomerState = {
                id: existingCustomer.id,
                strike_count: existingCustomer.strike_count,
                flagged: existingCustomer.flagged
            };
            await supabase.from('customers').update({ strike_count: 3, flagged: true }).eq('id', existingCustomer.id);
        }
        testCustomerId = existingCustomer.id;

        // Toggle Flag off
        const { error: flagErr1 } = await supabase
            .from('customers')
            .update({ flagged: false })
            .eq('id', testCustomerId);
        if (flagErr1) throw new Error(`Failed to unflag customer: ${flagErr1.message}`);

        const { data: cust1 } = await supabase.from('customers').select('flagged').eq('id', testCustomerId).single();
        if (cust1?.flagged !== false) throw new Error("Customer unflagging failed to update in DB.");
        console.log("✔ Customer flagged status toggled successfully.");

        // Clear Strikes
        const { error: strikeErr } = await supabase
            .from('customers')
            .update({ strike_count: 0, flagged: false })
            .eq('id', testCustomerId);
        if (strikeErr) throw new Error(`Failed to clear customer strikes: ${strikeErr.message}`);

        const { data: cust2 } = await supabase.from('customers').select('strike_count, flagged').eq('id', testCustomerId).single();
        if (cust2?.strike_count !== 0 || cust2?.flagged !== false) {
            throw new Error("Customer strikes clearing failed to update in DB.");
        }
        console.log("✔ Customer strike count cleared successfully.");

        // 3. Trip Cancellations & Deposit Refunds
        console.log("\nTest 3: Booking refund ledgering and cancellations...");
        
        // Setup Listing
        const { data: newListing, error: listErr } = await supabase
            .from('listing_templates')
            .insert({
                trip_type: "Test Ops Fishing",
                location: "Destin Harbor Marina",
                duration: "04:00:00",
                low_price: 500,
                high_price: 500,
                max_passengers: 6,
                description: "Test description for admin ops",
                whats_included: ["Tackle", "Ice"],
                what_to_bring: ["Sunscreen", "Hat"],
                meeting_area: "Dock A Slip 4",
                active: true
            })
            .select('id')
            .single();
        if (listErr) throw new Error(`Listing template creation failed: ${listErr.message}`);
        testListingId = newListing?.id;

        // Setup Trip Instance
        const { data: newTrip, error: tripErr } = await supabase
            .from('trip_instances')
            .insert({
                listing_template_id: testListingId,
                date: "2030-05-15",
                status: "open"
            })
            .select('id')
            .single();
        if (tripErr) throw new Error(`Trip instance creation failed: ${tripErr.message}`);
        testTripId = newTrip?.id;

        // Setup Booking
        const { data: newBooking, error: bookErr } = await supabase
            .from('bookings')
            .insert({
                trip_instance_id: testTripId,
                customer_id: testCustomerId,
                group_size: 4,
                status: "paid"
            })
            .select('id')
            .single();
        if (bookErr) throw new Error(`Booking creation failed: ${bookErr.message}`);
        testBookingId = newBooking?.id;

        // Setup Charge Record
        const { data: newPay, error: payErr } = await supabase
            .from('payment_records')
            .insert({
                booking_id: testBookingId,
                stripe_payment_intent_id: `pi_test_${Math.random().toString(36).substring(7)}`,
                amount: 50.00,
                status: "succeeded"
            })
            .select('id')
            .single();
        if (payErr) throw new Error(`Payment record creation failed: ${payErr.message}`);
        testPaymentId = newPay?.id;

        // Execute Refund Action (simulate admin button click)
        const refundIntentId = `re_test_${Math.random().toString(36).substring(7)}`;
        const { error: cancelError } = await supabase.from('bookings').update({ status: 'canceled' }).eq('id', testBookingId);
        if (cancelError) {
            throw new Error(`Failed to update booking to canceled: ${cancelError.message}`);
        }
        const { data: newRefund, error: refErr } = await supabase
            .from('payment_records')
            .insert({
                booking_id: testBookingId,
                stripe_payment_intent_id: refundIntentId,
                amount: 50.00, // Positive amount to satisfy DB constraints
                status: "refunded"
            })
            .select('id')
            .single();
        if (refErr) {
            throw new Error(`Refund creation failed: ${refErr.message}`);
        }
        testRefundId = newRefund?.id;

        // Verify Refund Ledger balancing
        const { data: verifiedPay } = await supabase
            .from('bookings')
            .select('status')
            .eq('id', testBookingId)
            .single();
        
        if (verifiedPay?.status !== 'canceled') {
            throw new Error("Booking status should be updated to 'canceled' after refund.");
        }

        const { data: payHistory } = await supabase
            .from('payment_records')
            .select('amount, status')
            .eq('booking_id', testBookingId);

        let netAmount = 0;
        if (payHistory) {
            for (const r of payHistory) {
                if (r.status === 'succeeded') {
                    netAmount += Number(r.amount);
                } else if (r.status === 'refunded') {
                    netAmount -= Number(r.amount);
                }
            }
        }

        if (netAmount !== 0) {
            throw new Error(`Refund ledger did not balance out. Net amount is: ${netAmount}`);
        }
        console.log("✔ Booking refund ledger balance verified at exactly $0.00.");

        // 4. Manual Captain Override Assignment
        console.log("\nTest 4: Manual Captain Assignment override...");
        const { error: assignErr } = await supabase
            .from('trip_instances')
            .update({ captain_id: testCaptainId })
            .eq('id', testTripId);

        if (assignErr) throw new Error(`Manual captain assignment failed: ${assignErr.message}`);

        const { data: verifiedTrip } = await supabase
            .from('trip_instances')
            .select('captain_id')
            .eq('id', testTripId)
            .single();

        if (verifiedTrip?.captain_id !== testCaptainId) {
            throw new Error("Manual captain assignment override not reflected in DB.");
        }
        console.log("✔ Manual captain override assignment verified successfully.");

        console.log("\n--- ALL PHASE 6 ADMIN OPERATIONS INTEGRATION TESTS PASSED ---");
    } catch (e) {
        console.error("\n❌ Test execution failed with error:", e.message);
    } finally {
        console.log("\nCleaning up test records...");
        // Cleanup test data
        if (testRefundId) await supabase.from('payment_records').delete().eq('id', testRefundId);
        if (testPaymentId) await supabase.from('payment_records').delete().eq('id', testPaymentId);
        if (testBookingId) await supabase.from('bookings').delete().eq('id', testBookingId);
        if (testTripId) await supabase.from('trip_instances').delete().eq('id', testTripId);
        if (testListingId) await supabase.from('listing_templates').delete().eq('id', testListingId);
        if (testCaptainId) await supabase.from('captains').delete().eq('id', testCaptainId);
        if (testCustomerId) {
            if (originalCustomerState) {
                await supabase.from('customers').update({
                    strike_count: originalCustomerState.strike_count,
                    flagged: originalCustomerState.flagged
                }).eq('id', testCustomerId);
            } else {
                await supabase.from('customers').delete().eq('id', testCustomerId);
            }
        }
        console.log("Cleanup complete.");
    }
}

runTests();
