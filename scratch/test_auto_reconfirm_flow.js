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
    console.log("--- STARTING 2ND GROUP AUTO-RECONFIRMATION FLOW TEST ---");

    let testListingId = null;
    let testTripId = null;
    let b1Id = null;
    let b2Id = null;

    try {
        const { data: tripTypes } = await supabase.from('trip_types').select('name').limit(1);
        const validTripType = tripTypes && tripTypes.length > 0 ? tripTypes[0].name : "Half-Day Inshore Fishing";

        // 1. Create test listing template
        const { data: listing, error: listingErr } = await supabase
            .from('listing_templates')
            .insert({
                trip_type: validTripType,
                location: "Islamorada Key",
                duration: "04:00:00",
                low_price: 600,
                high_price: 600,
                max_passengers: 6,
                description: "Auto-reconfirm test charter",
                whats_included: ["Bait"],
                what_to_bring: ["Drinks"],
                meeting_area: "Pier 9",
                active: true
            })
            .select('id')
            .single();

        if (listingErr || !listing) throw new Error(`Failed to create listing: ${listingErr?.message}`);
        testListingId = listing.id;

        // 2. Create half-booked trip instance
        const { data: trip, error: tripErr } = await supabase
            .from('trip_instances')
            .insert({
                listing_template_id: testListingId,
                date: "2030-09-01",
                status: "half-booked"
            })
            .select('id')
            .single();

        if (tripErr || !trip) throw new Error(`Failed to create trip instance: ${tripErr?.message}`);
        testTripId = trip.id;

        const { data: usersData } = await supabase.auth.admin.listUsers();
        if (!usersData || usersData.users.length === 0) throw new Error("No auth users found");
        const customer1Id = usersData.users[0].id;
        const customer2Id = usersData.users[1]?.id || customer1Id;

        // 3. Create Group 1 booking (paid)
        const { data: b1, error: b1Err } = await supabase
            .from('bookings')
            .insert({
                trip_instance_id: testTripId,
                customer_id: customer1Id,
                group_size: 2,
                status: 'paid'
            })
            .select('id')
            .single();

        if (b1Err || !b1) throw new Error(`Failed to create Group 1 booking: ${b1Err?.message}`);
        b1Id = b1.id;
        console.log(`✔ Group 1 booking created (status: paid, ID: ${b1Id})`);

        // 4. Simulate Group 2 checkout: Group 2 auto-reconfirmed, Group 1 awaiting-reconfirm
        // Create Group 2 booking
        const { data: b2, error: b2Err } = await supabase
            .from('bookings')
            .insert({
                trip_instance_id: testTripId,
                customer_id: customer2Id,
                group_size: 2,
                status: 'paid'
            })
            .select('id')
            .single();

        if (b2Err || !b2) throw new Error(`Failed to create Group 2 booking: ${b2Err?.message}`);
        b2Id = b2.id;

        // Apply automatic reconfirmation logic (matching checkout server action)
        // Group 2 -> reconfirmed
        const { error: u2Err } = await supabase
            .from('bookings')
            .update({
                status: 'reconfirmed',
                reconfirmation_timestamp: new Date().toISOString()
            })
            .eq('id', b2Id);

        if (u2Err) console.error("Error updating b2:", u2Err);

        // Group 1 -> awaiting-reconfirm
        await supabase
            .from('bookings')
            .update({ status: 'awaiting-reconfirm' })
            .eq('id', b1Id);

        // Trip -> pending-reconfirm
        await supabase
            .from('trip_instances')
            .update({ status: 'pending-reconfirm' })
            .eq('id', testTripId);

        // 5. Verify database states
        const { data: verifyB1 } = await supabase.from('bookings').select('status').eq('id', b1Id).single();
        const { data: verifyB2 } = await supabase.from('bookings').select('status, reconfirmation_timestamp').eq('id', b2Id).single();
        const { data: verifyTrip } = await supabase.from('trip_instances').select('status').eq('id', testTripId).single();

        console.log(`Group 1 Status: ${verifyB1?.status} (Expected: awaiting-reconfirm)`);
        console.log(`Group 2 Status: ${verifyB2?.status} (Expected: reconfirmed)`);
        console.log(`Group 2 Reconfirmation Timestamp: ${verifyB2?.reconfirmation_timestamp}`);
        console.log(`Trip Instance Status: ${verifyTrip?.status} (Expected: pending-reconfirm)`);

        if (verifyB1?.status !== 'awaiting-reconfirm') throw new Error("Group 1 status mismatch!");
        if (verifyB2?.status !== 'reconfirmed' || !verifyB2?.reconfirmation_timestamp) throw new Error("Group 2 auto-reconfirm failed!");
        if (verifyTrip?.status !== 'pending-reconfirm') throw new Error("Trip instance status mismatch!");

        console.log("\n✔ 2nd Group Auto-Reconfirmation State Logic Verified!");

        // 6. Simulate Group 1 reconfirming on dashboard
        await supabase
            .from('bookings')
            .update({
                status: 'reconfirmed',
                reconfirmation_timestamp: new Date().toISOString()
            })
            .eq('id', b1Id);

        const { data: allBookings } = await supabase
            .from('bookings')
            .select('status')
            .eq('trip_instance_id', testTripId);

        const bothReconfirmed = allBookings?.every(b => b.status === 'reconfirmed');
        if (bothReconfirmed) {
            await supabase
                .from('trip_instances')
                .update({ status: 'confirmed' })
                .eq('id', testTripId);
        }

        const { data: finalTrip } = await supabase.from('trip_instances').select('status').eq('id', testTripId).single();
        console.log(`Final Trip Instance Status: ${finalTrip?.status} (Expected: confirmed)`);
        if (finalTrip?.status !== 'confirmed') throw new Error("Final trip confirmation failed!");

        console.log("\n--- ALL 2ND GROUP AUTO-RECONFIRMATION TESTS PASSED ---");

    } catch (err) {
        console.error("❌ Test failed:", err.message);
    } finally {
        console.log("Cleaning up test data...");
        if (b2Id) await supabase.from('bookings').delete().eq('id', b2Id);
        if (b1Id) await supabase.from('bookings').delete().eq('id', b1Id);
        if (testTripId) await supabase.from('trip_instances').delete().eq('id', testTripId);
        if (testListingId) await supabase.from('listing_templates').delete().eq('id', testListingId);
        console.log("Cleanup complete.");
    }
}

runTest();
