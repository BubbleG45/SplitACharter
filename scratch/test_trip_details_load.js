import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
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

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function testLoad() {
    const tripId = '13adf929-dd97-4f2c-9c04-51448b3ab0c4';
    const captainId = '743ba0f1-4422-40b0-85e4-ed441c2cfa0e';
    const token = '87ecf9b8cd2f7293e63c16f414b82b7c54408b85a384b31b3b11530149856ae9';

    // 1. Authorization
    const expectedToken = crypto.createHmac('sha256', env.SUPABASE_SERVICE_ROLE_KEY).update(`${tripId}:${captainId}`).digest('hex');
    const isValidSignature = token === expectedToken;
    console.log("IsValidSignature:", isValidSignature);

    const { data: tripCheck, error: tripCheckErr } = await supabaseAdmin
        .from('trip_instances')
        .select('captain_id')
        .eq('id', tripId)
        .maybeSingle();

    console.log("TripCheck Result:", tripCheck, "Error:", tripCheckErr);

    // 2. Fetch Trip Details
    const { data: trip, error: tripErr } = await supabaseAdmin
        .from('trip_instances')
        .select('id, date, status, captain_id, listing_templates(trip_type, location, meeting_area, description, duration)')
        .eq('id', tripId)
        .maybeSingle();

    console.log("Trip Query Result:", trip ? "SUCCESS" : "NULL", "Error:", tripErr);

    // 3. Fetch Bookings
    const { data: bookings, error: bookingsErr } = await supabaseAdmin
        .from('bookings')
        .select('id, group_size, status, customers(name, phone, email)')
        .eq('trip_instance_id', tripId)
        .not('status', 'in', '("canceled","forfeited")');

    console.log("Bookings Query Result:", bookings?.length || 0, "Error:", bookingsErr);
}

testLoad();
