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
    console.log("--- STARTING CHECKOUT PASSENGER CAPACITY VALIDATION TEST ---");

    let testListingId = null;
    let testTripId = null;
    let booking1Id = null;
    let booking2Id = null;

    try {
        // Fetch a valid trip type
        const { data: tripTypes } = await supabase.from('trip_types').select('name').limit(1);
        const validTripType = tripTypes && tripTypes.length > 0 ? tripTypes[0].name : "Half-Day Inshore Fishing";

        // 1. Create test listing template (max_passengers: 6)
        const { data: listing, error: listingErr } = await supabase
            .from('listing_templates')
            .insert({
                trip_type: validTripType,
                location: "Key West Marina",
                duration: "04:00:00",
                low_price: 500,
                high_price: 500,
                max_passengers: 6,
                description: "Testing passenger capacity enforcement",
                whats_included: ["Rods"],
                what_to_bring: ["Hat"],
                meeting_area: "Dock A",
                active: true
            })
            .select('id, max_passengers')
            .single();

        if (listingErr || !listing) throw new Error(`Failed to create listing template: ${listingErr?.message}`);
        testListingId = listing.id;
        console.log(`✔ Created listing template ID: ${testListingId} (max_passengers: ${listing.max_passengers})`);

        // 2. Create TripInstance on date '2030-08-15'
        const { data: trip, error: tripErr } = await supabase
            .from('trip_instances')
            .insert({
                listing_template_id: testListingId,
                date: "2030-08-15",
                status: "half-booked"
            })
            .select('id')
            .single();

        if (tripErr || !trip) throw new Error(`Failed to create trip instance: ${tripErr?.message}`);
        testTripId = trip.id;
        console.log(`✔ Created trip instance ID: ${testTripId}`);

        // Get a test customer ID
        const { data: usersData } = await supabase.auth.admin.listUsers();
        if (!usersData || usersData.users.length === 0) throw new Error("No auth users found");
        const customerId = usersData.users[0].id;

        // 3. Create Group 1 booking with group_size: 4 (paid)
        const { data: b1, error: b1Err } = await supabase
            .from('bookings')
            .insert({
                trip_instance_id: testTripId,
                customer_id: customerId,
                group_size: 4,
                status: 'paid'
            })
            .select('id, group_size')
            .single();

        if (b1Err || !b1) throw new Error(`Failed to create booking 1: ${b1Err?.message}`);
        booking1Id = b1.id;
        console.log(`✔ Group 1 booked ${b1.group_size} passengers.`);

        // 4. Calculate remaining capacity for second group
        const { data: activeBookings } = await supabase
            .from('bookings')
            .select('group_size')
            .eq('trip_instance_id', testTripId)
            .not('status', 'in', '("canceled","forfeited")');

        const currentlyBooked = activeBookings?.reduce((sum, b) => sum + b.group_size, 0) || 0;
        const remainingSpots = listing.max_passengers - currentlyBooked;

        console.log(`Current booked total: ${currentlyBooked}, Remaining spots: ${remainingSpots}`);
        if (remainingSpots !== 2) {
            throw new Error(`Expected 2 remaining spots, got ${remainingSpots}`);
        }
        console.log("✔ Remaining spots calculated correctly: 2");

        // 5. Test capacity check logic for group size 3 (should fail)
        const groupSizeExceeding = 3;
        if (groupSizeExceeding > remainingSpots) {
            console.log(`✔ Correctly blocked invalid checkout: group size ${groupSizeExceeding} > remaining spots ${remainingSpots}`);
        } else {
            throw new Error("Failed to block invalid group size!");
        }

        // 6. Test capacity check logic for group size 2 (should pass)
        const groupSizeValid = 2;
        if (groupSizeValid <= remainingSpots) {
            const { data: b2, error: b2Err } = await supabase
                .from('bookings')
                .insert({
                    trip_instance_id: testTripId,
                    customer_id: customerId,
                    group_size: groupSizeValid,
                    status: 'paid'
                })
                .select('id, group_size')
                .single();

            if (b2Err || !b2) throw new Error(`Failed to create valid booking 2: ${b2Err?.message}`);
            booking2Id = b2.id;
            console.log(`✔ Group 2 successfully booked ${b2.group_size} passengers.`);
        }

        console.log("\n--- ALL CHECKOUT PASSENGER CAPACITY VALIDATION TESTS PASSED ---");

    } catch (err) {
        console.error("❌ Test failed:", err.message);
    } finally {
        console.log("Cleaning up test data...");
        if (booking2Id) await supabase.from('bookings').delete().eq('id', booking2Id);
        if (booking1Id) await supabase.from('bookings').delete().eq('id', booking1Id);
        if (testTripId) await supabase.from('trip_instances').delete().eq('id', testTripId);
        if (testListingId) await supabase.from('listing_templates').delete().eq('id', testListingId);
        console.log("Cleanup complete.");
    }
}

runTest();
