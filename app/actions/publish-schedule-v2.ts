'use server';

import { createClient } from '@supabase/supabase-js'; // Admin client for bypassing RLS
import { createClient as createAuthClient } from '@/utils/supabase/server'; // Auth client
import { Resend } from 'resend';
import { addDays, parseISO, differenceInMinutes, format } from 'date-fns';

// 1. CONFIGURATION
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://book.sunbuggy.com';
const TIMEZONE = 'America/Los_Angeles'; // STRICTLY FORCE VEGAS TIME

// 2. SETUP ADMIN CLIENT (Service Role)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendConfig {
  scope: 'individual' | 'department' | 'location' | 'all';
  targetIds: string[]; 
  weekDate: string; 
  subject: string;
  body: string; 
  cc?: string;
  bcc?: string;
}

// --- TIMEZONE HELPERS ---
// These functions force the Server (UTC) to format dates like it's in Vegas.

function formatVegasTime(isoString: string) {
  return new Date(isoString).toLocaleTimeString('en-US', {
    timeZone: TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatVegasDate(isoString: string) {
  return new Date(isoString).toLocaleDateString('en-US', {
    timeZone: TIMEZONE,
    weekday: 'long',
    month: 'short',
    day: 'numeric' // e.g. "Wednesday, Jan 14"
  });
}

// Adds "st, nd, rd, th" to the day number
function getOrdinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export async function publishScheduleV2(config: SendConfig) {
  try {
    // 3. AUTHENTICATION CHECK
    const authClient = await createAuthClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    
    if (authError || !user) throw new Error("Unauthorized: Please sign in.");

    // 4. FETCH RECIPIENTS
    const { data: allStaff, error: staffError } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email, location, department, user_level')
      .gte('user_level', 300)
      .not('email', 'is', null);

    if (staffError || !allStaff) throw new Error("Failed to load staff directory: " + staffError.message);

    // Filter Scope
    const recipients = allStaff.filter(emp => {
      if (config.scope === 'all') return true;
      if (config.scope === 'individual') return config.targetIds.includes(emp.id);
      if (config.scope === 'location') return config.targetIds.includes(emp.location);
      if (config.scope === 'department') return config.targetIds.includes(emp.department);
      return false;
    });

    if (recipients.length === 0) return { success: false, message: "No recipients selected." };

    // 5. FETCH SHIFTS
    const recipientIds = recipients.map(r => r.id);
    const weekStart = parseISO(config.weekDate);
    const weekEnd = addDays(weekStart, 7);

    const { data: shifts, error: shiftError } = await supabaseAdmin
      .from('employee_schedules')
      .select('*')
      .in('user_id', recipientIds)
      .gte('start_time', config.weekDate)
      .lt('start_time', format(weekEnd, 'yyyy-MM-dd'));

    if (shiftError) throw new Error("Failed to load schedule data.");

    // 6. BUILD EMAILS (BATCH PREP)
    const batchPayload = recipients.map((recipient) => {
      
      const myShifts = (shifts || [])
        .filter(s => s.user_id === recipient.id)
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

      let totalMinutes = 0;

      let scheduleHtml = `<div style="margin: 15px 0; padding: 10px; background-color: #f8fafc; border-left: 4px solid #d97706; border-radius: 4px;">`;
      
      if (myShifts.length === 0) {
        scheduleHtml += `<p style="color: #64748b; font-style: italic; margin: 0;">No shifts scheduled this week.</p>`;
      } else {
        myShifts.forEach(s => {
          // Duration Math: Safe to do in UTC (absolute difference)
          const startObj = parseISO(s.start_time);
          const endObj = parseISO(s.end_time);
          totalMinutes += differenceInMinutes(endObj, startObj);

          // Formatting: MUST use timezone helpers
          // "Wednesday, Jan 14"
          const dateStr = formatVegasDate(s.start_time); 
          
          // Add ordinal "th" manually
          // We get the day number relative to Vegas time to match the dateStr
          const dayNum = parseInt(new Date(s.start_time).toLocaleDateString('en-US', { timeZone: TIMEZONE, day: 'numeric' }));
          const finalDateStr = dateStr.replace(String(dayNum), getOrdinal(dayNum));

          // "7:00 AM - 3:00 PM"
          const timeStr = `${formatVegasTime(s.start_time)} - ${formatVegasTime(s.end_time)}`;
          
          scheduleHtml += `
            <div style="margin-bottom: 6px; font-size: 14px; color: #1e293b;">
              <strong style="color: #334155;">${finalDateStr}:</strong> ${timeStr} 
              <span style="background-color: #e2e8f0; color: #475569; font-size: 11px; padding: 2px 6px; border-radius: 4px; margin-left: 6px; text-transform: uppercase;">${s.role}</span>
            </div>`;
        });
      }
      scheduleHtml += `</div>`;

      const totalHours = (totalMinutes / 60).toFixed(1).replace('.0', '');

      // Inject Variables
      let finalBody = config.body
        .replace(/{{staff_name}}/g, recipient.full_name.split(' ')[0]) 
        .replace(/{{full_name}}/g, recipient.full_name)
        .replace(/{{department}}/g, recipient.department || 'Staff')
        .replace(/{{location}}/g, recipient.location || 'Las Vegas')
        .replace(/{{week_start}}/g, format(weekStart, 'MMM do'))
        .replace(/{{schedule_summary}}/g, scheduleHtml)
        .replace(/{{total_hours}}/g, totalHours)
        .replace(/{{link_roster}}/g, `${BASE_URL}/biz/schedule`);

      const htmlWrapper = `
        <!DOCTYPE html><html lang="en"><head><style>body{font-family:sans-serif;}</style></head>
        <body style="margin:0;padding:0;background-color:#ffffff;">
          <div style="max-width:600px;margin:0 auto;padding:20px;color:#333333;line-height:1.6;">
            ${finalBody}
            <div style="margin-top:30px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center;">
              <p style="margin:0;">Access your full dashboard:</p>
              <a href="${BASE_URL}/biz" style="color:#d97706;text-decoration:none;font-weight:bold;">SunBuggy Staff Portal</a>
            </div>
          </div>
        </body></html>
      `;

      return {
        from: 'SunBuggy Schedule <managers@sunbuggy.com>',
        to: recipient.email!,
        cc: config.cc ? config.cc.split(',').map(e => e.trim()) : undefined,
        bcc: config.bcc ? config.bcc.split(',').map(e => e.trim()) : undefined,
        subject: config.subject.replace(/{{week_start}}/g, format(weekStart, 'MMM d')),
        html: htmlWrapper,
        headers: { 'X-Entity-Ref-ID': recipient.id } 
      };
    });

    // 7. EXECUTE BATCH SEND (Batch Size: 100)
    const batchSize = 100;
    const results = [];
    
    for (let i = 0; i < batchPayload.length; i += batchSize) {
      const chunk = batchPayload.slice(i, i + batchSize);
      console.log(`[Email] Sending batch ${i / batchSize + 1}...`);
      const { data, error } = await resend.batch.send(chunk);
      if (error) {
        console.error("Batch Failed:", error);
        results.push(...chunk.map(() => ({ id: null, error }))); 
      } else if (data && data.data) {
        results.push(...data.data);
      }
    }

    // 8. DB LOGGING
    const logEntries = batchPayload.map((payload, index) => {
      const result = results[index] as any;
      const recipient = recipients[index];
      const isSuccess = result && result.id && !result.error;

      return {
        recipient_email: recipient.email,
        recipient_name: recipient.full_name,
        subject: payload.subject,
        status: isSuccess ? 'sent' : 'failed',
        error_message: isSuccess ? null : JSON.stringify(result?.error || 'Unknown Batch Error'),
        metadata: { scope: config.scope, week: config.weekDate, resend_id: result?.id },
        sent_by: user.id
      };
    });

    const { error: logError } = await supabaseAdmin.from('email_logs').insert(logEntries);
    if (logError) console.error("Failed to write email logs:", logError);

    // 9. AUDIT TRAIL (Update Last Notified)
    if (shifts && shifts.length > 0) {
        const shiftIds = shifts.map(s => s.id);
        await supabaseAdmin
            .from('employee_schedules')
            .update({ last_notified: new Date().toISOString() })
            .in('id', shiftIds);
    }

    const successCount = logEntries.filter(l => l.status === 'sent').length;
    
    return { 
      success: true, 
      count: successCount, 
      total: recipients.length,
      message: `Sent ${successCount} of ${recipients.length} emails.` 
    };

  } catch (error: any) {
    console.error("Publish Error:", error);
    return { success: false, message: error.message || "Unknown error" };
  }
}