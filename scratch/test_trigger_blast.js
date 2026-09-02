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
    const tripId = '4df12777-ea80-414d-a8cf-11ae9749a958';
    const { data: trip } = await supabase.from('trip_instances').select('*, listing_templates(*)').eq('id', tripId).single();
    console.log("TRIP:", trip);
    const { data: logs } = await supabase.from('notification_logs').select('*').ilike('content', `%${tripId}%`);
    console.log("BLAST LOGS:", JSON.stringify(logs, null, 2));
}

testBlast();
