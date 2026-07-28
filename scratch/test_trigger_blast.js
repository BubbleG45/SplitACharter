import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

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
} catch (e) {}

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBlast() {
    console.log("=== TESTING CAPTAIN BLAST DISPATCH FOR CONFIRMED TRIPS ===");

    // Get the confirmed trip
    const { data: confirmedTrip } = await supabase
        .from('trip_instances')
        .select('id, date, listing_templates(trip_type, location, meeting_area)')
        .eq('status', 'confirmed')
        .maybeSingle();

    if (!confirmedTrip) {
        console.log("No confirmed trip found to test.");
        return;
    }

    const tripId = confirmedTrip.id;
    const tripDetails = confirmedTrip.listing_templates;
    console.log(`Targeting confirmed trip: ${tripId} (${tripDetails?.trip_type} on ${confirmedTrip.date})`);

    // Fetch active captains matching trip type & location
    const { data: captains } = await supabase
        .from('captains')
        .select('id, name, phone, trip_types, locations')
        .eq('active', true);

    const eligible = (captains || []).filter(c => 
        c.trip_types?.includes(tripDetails?.trip_type) &&
        c.locations?.includes(tripDetails?.location)
    );

    console.log(`Eligible captains count: ${eligible.length}`);

    // Insert mock captain blast logs
    for (const c of eligible) {
        const acceptUrl = `https://splitacharter.boats/api/captain-match/accept?tripId=${tripId}&captainId=${c.id}`;
        const content = `SplitACharter Alert: A confirmed charter of type "${tripDetails?.trip_type}" is available on ${confirmedTrip.date} at ${tripDetails?.location}. Accept here: ${acceptUrl}`;
        
        await supabase.from('notification_logs').insert({
            recipient: c.phone,
            channel: 'sms',
            template: 'captain_blast',
            content,
            status: 'delivered'
        });
        console.log(`✔ Dispatched & logged captain_blast for Captain ${c.name} (${c.phone})`);
    }

    // Now query getCaptainsLog logic
    const { data: logs } = await supabase
        .from('notification_logs')
        .select('*')
        .in('template', ['captain_blast', 'captain_details_link'])
        .ilike('content', `%${tripId}%`)
        .order('timestamp', { ascending: true });

    console.log(`\nCaptain's Log Query Result: ${logs?.length || 0} audit logs found for trip ${tripId}!`);
}

testBlast();
