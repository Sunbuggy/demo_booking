'use server';

import { createClient } from '@supabase/supabase-js'; // Admin client for bypassing RLS
import { createClient as createAuthClient } from '@/utils/supabase/server'; // Auth client
import { Resend } from 'resend';
import { format, addDays, parseISO, differenceInMinutes } from 'date-fns';

// 1. CONFIGURATION
// Use the Environment Variable if set, otherwise fallback to current live site.
// This allows you to change the domain in Vercel settings without redeploying code.
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://book.sunbuggy.com';

// 2. SETUP ADMIN CLIENT (Service Role)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendConfig {
  scope: 'individual' | 'department' | 'location' | 'all';
  targetIds: string[]; // List of UserIDs, Dept Names, or Location Names
  weekDate: string; // YYYY-MM-DD
  subject: string;
  body: string; // HTML allowed
  cc?: string;
  bcc?: string;
}

export async function publishScheduleV2(config: SendConfig) {
  try {
    // 3. AUTHENTICATION CHECK (User Context)
    const authClient = await createAuthClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    
    if (authError || !user) throw new Error("Unauthorized: Please sign in.");

    // 4. FETCH RECIPIENTS (Admin Context)
    // Fetch ALL staff first, then filter in memory.
    const { data: allStaff, error: staffError } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email, location, department, user_level')
      .gte('user_level', 300)
      .not('email', 'is', null);

    if (staffError || !allStaff) throw new Error("Failed to load staff directory: " + staffError.message);

    // Filter based on Scope
    const recipients = allStaff.filter(emp => {
      if (config.scope === 'all') return true;
      if (config.scope === 'individual') return config.targetIds.includes(emp.id);
      if (config.scope === 'location') return config.targetIds.includes(emp.location);
      if (config.scope === 'department') return config.targetIds.includes(emp.department);
      return false;
    });

    if (recipients.length === 0) return { success: false, message: "No recipients selected." };

    // 5. FETCH SHIFTS FOR TARGET WEEK (Admin Context)
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

    // 6. GENERATE & SEND PERSONALIZED EMAILS
    // We assume production environment for the sender domain.
    const emailPromises = recipients.map(async (recipient) => {
      
      // A. Build Personal Schedule Summary & Calculate Hours
      const myShifts = (shifts || [])
        .filter(s => s.user_id === recipient.id)
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

      let totalMinutes = 0; // TRACKER

      let scheduleHtml = `<div style="margin: 15px 0; padding: 10px; background-color: #f8fafc; border-left: 4px solid #d97706; border-radius: 4px;">`;
      
      if (myShifts.length === 0) {
        scheduleHtml += `<p style="color: #64748b; font-style: italic; margin: 0;">No shifts scheduled this week.</p>`;
      } else {
        myShifts.forEach(s => {
          const start = parseISO(s.start_time);
          const end = parseISO(s.end_time);
          
          // Calculate duration in minutes
          const diff = differenceInMinutes(end, start);
          totalMinutes += diff;

          const date = format(start, 'EEEE, MMM do');
          const time = `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
          
          scheduleHtml += `
            <div style="margin-bottom: 6px; font-size: 14px; color: #1e293b;">
              <strong style="color: #334155;">${date}:</strong> ${time} 
              <span style="background-color: #e2e8f0; color: #475569; font-size: 11px; padding: 2px 6px; border-radius: 4px; margin-left: 6px; text-transform: uppercase;">${s.role}</span>
            </div>`;
        });
      }
      scheduleHtml += `</div>`;

      // Format Total Hours (e.g. "38.5")
      const totalHours = (totalMinutes / 60).toFixed(1).replace('.0', '');

      // B. Inject Variables into Template
      let finalBody = config.body
        .replace(/{{staff_name}}/g, recipient.full_name.split(' ')[0]) // First name only
        .replace(/{{full_name}}/g, recipient.full_name)
        .replace(/{{department}}/g, recipient.department || 'Staff')
        .replace(/{{location}}/g, recipient.location || 'Las Vegas')
        .replace(/{{week_start}}/g, format(weekStart, 'MMM do'))
        .replace(/{{schedule_summary}}/g, scheduleHtml)
        .replace(/{{total_hours}}/g, totalHours)
        .replace(/{{link_roster}}/g, `${BASE_URL}/biz/schedule`); // DYNAMIC LINK

      // C. Wrap in SunBuggy Shell (Responsive)
      const htmlWrapper = `
        <!DOCTYPE html>
        <html lang="en">
        <head><style>body { font-family: sans-serif; }</style></head>
        <body style="margin:0; padding:0; background-color: #ffffff;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; color: #333333; line-height: 1.6;">
            ${finalBody}
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center;">
              <p style="margin: 0;">Access your full dashboard:</p>
              <a href="${BASE_URL}/biz" style="color: #d97706; text-decoration: none; font-weight: bold;">SunBuggy Staff Portal</a>
            </div>
          </div>
        </body>
        </html>
      `;

      // D. Send via Resend
      return resend.emails.send({
        from: 'SunBuggy Schedule <managers@sunbuggy.com>',
        to: recipient.email!,
        cc: config.cc ? config.cc.split(',').map(e => e.trim()) : undefined,
        bcc: config.bcc ? config.bcc.split(',').map(e => e.trim()) : undefined,
        subject: config.subject.replace(/{{week_start}}/g, format(weekStart, 'MMM d')),
        html: htmlWrapper,
      });
    });

    // Wait for all to finish
    await Promise.all(emailPromises);

    // 7. LOG NOTIFICATION (Audit Trail) - Admin Context
    if (shifts && shifts.length > 0) {
        const shiftIds = shifts.map(s => s.id);
        await supabaseAdmin
            .from('employee_schedules')
            .update({ last_notified: new Date().toISOString() })
            .in('id', shiftIds);
    }

    return { success: true, count: recipients.length };

  } catch (error: any) {
    console.error("Publish Error:", error);
    return { success: false, message: error.message || "Unknown error" };
  }
}