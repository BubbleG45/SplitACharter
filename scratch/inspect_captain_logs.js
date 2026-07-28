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

async function inspect() {
    console.log("=== INSPECTING CAPTAINS, CONFIRMED TRIPS, & NOTIFICATION LOGS ===");

    // 1. Fetch all captains
    const { data: captains } = await supabase.from('captains').select('*');
    console.log(`Captains count: ${captains?.length || 0}`);
    if (captains) {
        captains.forEach(c => console.log(`  - Captain: ${c.name}, Active: ${c.active}, Trip Types: ${JSON.stringify(c.trip_types)}, Locations: ${JSON.stringify(c.locations)}`));
    }

    // 2. Fetch confirmed trips
    const { data: confirmedTrips } = await supabase
        .from('trip_instances')
        .select('id, date, status, captain_id, listing_templates(trip_type, location)')
        .eq('status', 'confirmed');

    console.log(`\nConfirmed Trips count: ${confirmedTrips?.length || 0}`);
    if (confirmedTrips) {
        confirmedTrips.forEach(t => console.log(`  - Trip ID: ${t.id}, Date: ${t.date}, Captain ID: ${t.captain_id}, Template: ${t.listing_templates?.trip_type} @ ${t.listing_templates?.location}`));
    }

    // 3. Fetch captain_blast logs
    const { data: blastLogs } = await supabase
        .from('notification_logs')
        .select('*')
        .in('template', ['captain_blast', 'captain_details_link']);

    console.log(`\nCaptain Blast & Details Link Logs count: ${blastLogs?.length || 0}`);
    if (blastLogs) {
        blastLogs.forEach(l => console.log(`  - Log ID: ${l.id}, Template: ${l.template}, Recipient: ${l.recipient}, Status: ${l.status}, Content: ${l.content.substring(0, 100)}...`));
    }
}

inspect();
