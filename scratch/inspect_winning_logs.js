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
    const { data: logs } = await supabase
        .from('notification_logs')
        .select('*')
        .eq('template', 'captain_details_link');

    console.log("=== CAPTAIN DETAILS LINK LOGS ===");
    console.log(`Count: ${logs?.length || 0}`);
    if (logs) {
        logs.forEach(l => console.log(`Log ID: ${l.id}\nRecipient: ${l.recipient}\nContent: ${l.content}\n`));
    }
}

inspect();
