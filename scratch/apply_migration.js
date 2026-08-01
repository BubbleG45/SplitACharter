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

const url = env.PUBLIC_SUPABASE_URL;
const projectRef = url ? url.replace('https://', '').split('.')[0] : '';
console.log('Project Ref:', projectRef);

const migrationSql = fs.readFileSync('supabase/migrations/20260729133000_landing_reviews.sql', 'utf8');
console.log('Migration SQL length:', migrationSql.length);
