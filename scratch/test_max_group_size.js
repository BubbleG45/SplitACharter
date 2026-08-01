import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

let env = {};
const envFile = fs.readFileSync('.env', 'utf8');
envFile.split(/\r?\n/).forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
        let value = match[2] ? match[2].trim() : '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        env[match[1]] = value;
    }
});

const supabase = createClient(env.PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
    console.log("Testing max_group_size on listing_templates...");
    const { data: listings, error } = await supabase
        .from('listing_templates')
        .select('id, trip_type, max_passengers, max_group_size');

    if (error) {
        console.error("Error querying listing_templates:", error);
    } else {
        console.log(`Queried ${listings.length} templates:`);
        listings.forEach(l => {
            console.log(`- ${l.trip_type}: max_passengers=${l.max_passengers}, max_group_size=${l.max_group_size}`);
        });
    }
}

test();
