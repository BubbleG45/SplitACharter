import { verifyCaptainToken, generateCaptainToken } from '../src/lib/security.js';
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

process.env.SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const tripId = '13adf929-dd97-4f2c-9c04-51448b3ab0c4';
const captainId = '743ba0f1-4422-40b0-85e4-ed441c2cfa0e';
const tokenFromLog = '87ecf9b8cd2f7293e63c16f414b82b7c54408b85a384b31b3b11530149856ae9';

const expectedToken = generateCaptainToken(tripId, captainId);
console.log("Token from Log:", tokenFromLog);
console.log("Expected Token:", expectedToken);
console.log("Matches:", tokenFromLog === expectedToken);
