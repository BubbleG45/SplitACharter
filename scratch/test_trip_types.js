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

async function check() {
    const { data: tt } = await supabase.from('trip_types').select('*');
    const { data: lt } = await supabase.from('listing_templates').select('trip_type, title, location, duration_hours');
    console.log("trip_types table:", tt);
    console.log("listing_templates unique trip_type:", Array.from(new Set(lt?.map(l => l.trip_type))));
}

check();
