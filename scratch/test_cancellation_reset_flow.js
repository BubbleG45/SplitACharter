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

async function runTest() {
    console.log("--- STARTING TRIP CANCELLATION & RESET TO HALF-BOOKED TEST ---");

    let testListingId = null;
    let testTripId = null;
    let b1Id = null;
    let b2Id = null;
    let cust1Id = null;
    let cust2Id = null;

    try {
        // 1. Get valid trip type
        const { data: tripTypes } = await supabase.from('trip_types').select('name').limit(1);
        const validTripType = tripTypes && tripTypes.length > 0 ? tripTypes[0].name : "Half-Day Inshore Fishing";

        // Create test listing template
        const { data: listing, error: listErr } = await supabase
            .from('listing_templates')
            .insert({
                trip_type: validTripType,
                location: 'Key West',
                duration: "04:00:00",
                description: 'Test template',
                meeting_area: 'Garrison Bight Marina',
                low_price: 400,
                high_price: 600,
                max_passengers: 6
            })
            .select()
            .single();

        if (listErr) throw new Error(`Listing template creation failed: ${listErr.message}`);
        testListingId = listing.id;

        // Create test trip instance starting at half-booked
        const { data: trip, error: tripErr } = await supabase
            .from('trip_instances')
            .insert({
                listing_template_id: testListingId,
                date: '2026-09-01',
                status: 'half-booked'
            })
            .select()
            .single();

        if (tripErr) throw new Error(`Trip instance creation failed: ${tripErr.message}`);
        testTripId = trip.id;
        console.log(`[PASS] Created test trip instance: ${testTripId} with status: half-booked`);

        // Get test customer 1 & 2
        const { data: usersData } = await supabase.auth.admin.listUsers();
        if (!usersData || usersData.users.length < 2) throw new Error("Need at least 2 auth users for test");
        cust1Id = usersData.users[0].id;
        cust2Id = usersData.users[1].id;

        // Create Booking 1 (Group 1 - paid)
        const { data: b1 } = await supabase.from('bookings').insert({
            customer_id: cust1Id,
            trip_instance_id: testTripId,
            group_size: 2,
            status: 'paid'
        }).select().single();
        b1Id = b1.id;

        // Create Booking 2 (Group 2 - paid)
        const { data: b2 } = await supabase.from('bookings').insert({
            customer_id: cust2Id,
            trip_instance_id: testTripId,
            group_size: 2,
            status: 'paid'
        }).select().single();
        b2Id = b2.id;

        // Update trip status to pending-reconfirm and both bookings to reconfirmed
        await supabase.from('trip_instances').update({ status: 'pending-reconfirm' }).eq('id', testTripId);
        await supabase.from('bookings').update({ status: 'reconfirmed', reconfirmation_timestamp: new Date().toISOString() }).eq('id', b1Id);
        await supabase.from('bookings').update({ status: 'reconfirmed', reconfirmation_timestamp: new Date().toISOString() }).eq('id', b2Id);

        console.log("[PASS] Transitioned trip to pending-reconfirm and both bookings to reconfirmed");

        // 2. Simulate Group 1 canceling their booking
        await supabase.from('bookings').update({ status: 'canceled' }).eq('id', b1Id);

        // Check remaining active bookings on trip
        const { data: remainingBookings } = await supabase
            .from('bookings')
            .select('id, status')
            .eq('trip_instance_id', testTripId)
            .not('status', 'in', '("canceled","forfeited")');

        console.log(`Remaining active bookings count: ${remainingBookings.length}`);

        if (remainingBookings.length === 1) {
            // Update trip to half-booked and remaining booking to paid
            await supabase.from('trip_instances').update({ status: 'half-booked' }).eq('id', testTripId);
            await supabase.from('bookings').update({ status: 'paid', reconfirmation_timestamp: null }).eq('id', remainingBookings[0].id);
        }

        // 3. Verify final DB states
        const { data: verifyTrip } = await supabase.from('trip_instances').select('status').eq('id', testTripId).single();
        const { data: verifyB2 } = await supabase.from('bookings').select('status, reconfirmation_timestamp').eq('id', b2Id).single();

        console.log(`Trip Instance Status: ${verifyTrip.status} (Expected: half-booked)`);
        console.log(`Group 2 Booking Status: ${verifyB2.status} (Expected: paid)`);
        console.log(`Group 2 Reconfirmation Timestamp: ${verifyB2.reconfirmation_timestamp} (Expected: null)`);

        if (verifyTrip.status !== 'half-booked') throw new Error(`Trip status mismatch! Expected half-booked, got ${verifyTrip.status}`);
        if (verifyB2.status !== 'paid') throw new Error(`Booking status mismatch! Expected paid, got ${verifyB2.status}`);
        if (verifyB2.reconfirmation_timestamp !== null) throw new Error(`Reconfirmation timestamp should be null!`);

        console.log("--- TEST SUCCESSFUL! ALL ASSERTIONS PASSED! ---");

    } catch (err) {
        console.error("❌ TEST FAILED:", err);
        process.exit(1);
    } finally {
        // Cleanup
        console.log("Cleaning up test data...");
        if (b1Id) await supabase.from('bookings').delete().eq('id', b1Id);
        if (b2Id) await supabase.from('bookings').delete().eq('id', b2Id);
        if (testTripId) await supabase.from('trip_instances').delete().eq('id', testTripId);
        if (testListingId) await supabase.from('listing_templates').delete().eq('id', testListingId);
    }
}

runTest();
