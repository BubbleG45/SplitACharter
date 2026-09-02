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
    const tripId = '4df12777-ea80-414d-a8cf-11ae9749a958';
    
    // 1. Fetch trip
    const { data: trip, error: tripErr } = await supabase
        .from('trip_instances')
        .select('id, status, date, listing_template_id, listing_templates(trip_type, location, meeting_area)')
        .eq('id', tripId)
        .single();

    if (tripErr || !trip) {
        console.error("Trip not found:", tripErr);
        return;
    }

    console.log("Trip found:", trip);

    // 2. Update status to 'confirmed'
    const { data: updateData, error: updateErr } = await supabase
        .from('trip_instances')
        .update({ status: 'confirmed' })
        .eq('id', tripId)
        .select();

    console.log("Updated trip status to confirmed:", updateData, "Error:", updateErr);

    // 3. Auto-spawn fresh 0-of-2 trip instance if not already spawned
    const { data: existingFresh } = await supabase
        .from('trip_instances')
        .select('id')
        .eq('listing_template_id', trip.listing_template_id)
        .eq('date', trip.date)
        .in('status', ['open', 'half-booked'])
        .maybeSingle();

    if (!existingFresh) {
        const { data: freshTrip, error: freshErr } = await supabase
            .from('trip_instances')
            .insert({
                listing_template_id: trip.listing_template_id,
                date: trip.date,
                status: 'open'
            })
            .select();
        console.log("Auto-spawned fresh trip instance:", freshTrip, "Error:", freshErr);
    } else {
        console.log("Fresh open trip instance already exists:", existingFresh.id);
    }

    // 4. Dispatch captain blast to all eligible active captains
    const tripDetails = trip.listing_templates;
    const tripType = tripDetails?.trip_type;
    const location = tripDetails?.location;

    const { data: captains } = await supabase
        .from('captains')
        .select('id, name, phone, trip_types, locations')
        .eq('active', true);

    const eligible = (captains || []).filter(c =>
        c.trip_types?.includes(tripType) && c.locations?.includes(location)
    );

    console.log(`Eligible captains for ${tripType} @ ${location}:`, eligible.map(c => `${c.name} (${c.phone})`));

    const { data: setting } = await supabase
        .from('admin_notification_settings')
        .select('*')
        .eq('trigger_name', 'captain_blast')
        .maybeSingle();

    const baseUrl = 'https://splitacharter.boats';

    for (const c of eligible) {
        if (c.phone) {
            const acceptUrl = `${baseUrl}/api/captain-match/accept?tripId=${trip.id}&captainId=${c.id}`;
            let smsTemplate = setting?.sms_template || 'SplitACharter Alert: A confirmed charter of type "{trip_type}" is available on {trip_date} at {location}. Tap to accept: {accept_url}';
            
            const msgBody = smsTemplate
                .replace(/{trip_type}/g, tripType)
                .replace(/{trip_date}/g, trip.date)
                .replace(/{location}/g, location)
                .replace(/{accept_url}/g, acceptUrl);

            console.log(`Sending Captain Blast SMS to ${c.name} (${c.phone}):\n  ${msgBody}`);

            // If twilio configured, send real SMS
            const accountSid = env.TWILIO_ACCOUNT_SID;
            const authUsername = env.TWILIO_API_KEY_SID || env.TWILIO_ACCOUNT_SID;
            const authPassword = env.TWILIO_API_KEY_SECRET || env.TWILIO_AUTH_TOKEN;
            const sourceNumber = env.TWILIO_PHONE_NUMBER || env.TWILIO_MESSAGING_SERVICE_SID;

            const isMock = !accountSid || !authUsername || !authPassword || !sourceNumber || accountSid.includes('placeholder');

            let success = false;
            let errorMsg = null;
            if (isMock) {
                success = true;
                console.log(`[MOCK SMS DELIVERED] To: ${c.phone}`);
            } else {
                try {
                    const credentials = Buffer.from(`${authUsername}:${authPassword}`).toString('base64');
                    const payload = { To: c.phone, Body: msgBody };
                    if (sourceNumber.startsWith('MG')) payload.MessagingServiceSid = sourceNumber;
                    else payload.From = sourceNumber;

                    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Basic ${credentials}`,
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        body: new URLSearchParams(payload).toString()
                    });
                    const resJson = await res.json();
                    if (res.ok) {
                        success = true;
                        console.log(`[Twilio Success] SID: ${resJson.sid}`);
                    } else {
                        errorMsg = resJson.message;
                        console.error(`[Twilio Error]`, resJson);
                    }
                } catch (e) {
                    errorMsg = e.message;
                }
            }

            // Log to notification_logs
            await supabase.from('notification_logs').insert({
                recipient: c.phone,
                channel: 'sms',
                template: 'captain_blast',
                content: msgBody,
                status: success ? 'delivered' : `failed: ${errorMsg}`
            });
        }
    }
}

inspect();

