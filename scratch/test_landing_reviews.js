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

async function checkAndUpdate() {
    console.log("Checking landing_reviews table in Supabase...");
    const { data, error } = await supabase.from('landing_reviews').select('*');
    if (error) {
        console.error("Error from Supabase:", error);
    } else {
        console.log("Data count:", data.length);
        const first = data[0];
        console.log("Updating item id:", first.id);
        const updateRes = await supabase.from('landing_reviews').update({ name: first.name }).eq('id', first.id).select('*');
        console.log("Update result error:", updateRes.error);
        console.log("Update result data:", updateRes.data);
    }
}

checkAndUpdate();
