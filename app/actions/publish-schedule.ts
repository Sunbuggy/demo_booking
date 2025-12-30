/**
 * @file /app/actions/publish-schedule.ts
 * @description Refactored SunBuggy scheduling service.
 * Handles throttled email delivery via Resend and updates 'last_notified' status in Supabase.
 */
'use server';

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import moment from 'moment';

// Initialize Supabase Admin with Service Role for bypass RLS on schedule updates
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Utility to prevent 429 Rate Limit Errors.
 * Resend free/standard tiers often limit to 2-10 requests per second.
 */
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function publishWeeklySchedule(
  weekStart: string, 
  weekEnd: string, 
  targetLocation: string
) {
  try {
    // 1. Fetch shifts and associated user data
    let query = supabaseAdmin
      .from('employee_schedules')
      .select(`
        *,
        users (
          id,
          email,
          first_name,
          stage_name,
          full_name
        )
      `)
      .gte('start_time', weekStart)
      .lte('start_time', weekEnd)
      .order('start_time', { ascending: true });

    if (targetLocation && targetLocation !== 'ALL') {
      query = query.eq('location', targetLocation);
    }

    const { data: shifts, error } = await query;

    if (error) throw new Error(error.message);
    if (!shifts || shifts.length === 0) {
      return { 
        success: false, 
        message: `No shifts found for ${targetLocation === 'ALL' ? 'any location' : targetLocation}.` 
      };
    }

    // 2. Group shifts by User ID to prevent duplicate emails per person
    const staffMap = new Map();
    shifts.forEach((shift: any) => {
      const userData = Array.isArray(shift.users) ? shift.users[0] : shift.users;

      if (!userData || !userData.email) return; 

      if (!staffMap.has(userData.id)) {
        staffMap.set(userData.id, {
          email: userData.email,
          name: userData.stage_name || userData.first_name || 'Staff',
          shifts: []
        });
      }
      staffMap.get(userData.id).shifts.push(shift);
    });

    if (staffMap.size === 0) {
      return { success: false, message: "Shifts found, but no valid employee emails linked." };
    }

    // 3. Sequential Mailing with Throttling and Logging
    let emailCount = 0;
    const errors: string[] = [];
    const locationLabel = targetLocation === 'ALL' ? '' : `${targetLocation} `;
    const staffEntries = Array.from(staffMap.entries());

    for (let i = 0; i < staffEntries.length; i++) {
      const [userId, data] = staffEntries[i];
      const { email, name, shifts: userShifts } = data;
      const shiftIds = userShifts.map((s: any) => s.id);

      // Generate Shift Rows for HTML
      const shiftRows = userShifts.map((s: any) => {
         const start = moment(s.start_time);
         const end = moment(s.end_time);
         return `<li style="margin-bottom: 8px; border-bottom: 1px solid #f0f0f0; padding-bottom: 4px;">
            <strong>${start.format('dddd, MMM D')}:</strong> ${start.format('h:mm A')} - ${end.format('h:mm A')} 
            <span style="color: #f97316; font-size: 0.85em;">(${s.role || 'Shift'} @ ${s.location})</span>
         </li>`;
      }).join('');

      const htmlContent = `
        <div style="font-family: sans-serif; color: #333; max-width: 600px;">
          <h2 style="color: #000;">Hi ${name},</h2>
          <p>Your <strong>${locationLabel}</strong> schedule is ready for the week of <strong>${moment(weekStart).format('MMM D')}</strong>.</p>
          
          <ul style="background: #ffffff; padding: 20px; border: 1px solid #ddd; border-radius: 8px; list-style: none;">
            ${shiftRows}
          </ul>

          <p style="margin-top: 25px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://sunbuggy.com'}/biz/schedule" 
               style="background: #f97316; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
               View Live Roster
            </a>
          </p>
          <p style="font-size: 0.8em; color: #999; margin-top: 30px;">
            SunBuggy Fleet Management System // Automated Update
          </p>
        </div>
      `;

      // Trigger Resend API
      const { error: sendError } = await resend.emails.send({
        from: 'SunBuggy Schedule <ops@sunbuggy.com>', 
        to: email,
        subject: `☀️ ${locationLabel}Schedule: ${moment(weekStart).format('MMM D')}`,
        html: htmlContent,
      });

      if (sendError) {
        console.error(`Failed to email ${email}:`, sendError);
        errors.push(`${name}: ${sendError.message}`);
      } else {
        // Logging Step: Record the notification in Supabase
        await supabaseAdmin
          .from('employee_schedules')
          .update({ last_notified: new Date().toISOString() })
          .in('id', shiftIds);

        emailCount++;
      }

      /**
       * Impact Analysis: Throttling to bypass 429 Rate Limit.
       * 600ms delay ensures ~1.6 emails per second.
       */
      if (i < staffEntries.length - 1) {
        await delay(600);
      }
    }

    return { 
      success: true, 
      message: `Successfully notified ${emailCount} staff members.`, 
      errors: errors.length > 0 ? errors : undefined 
    };

  } catch (err: any) {
    console.error("Critical Publish Error:", err);
    return { message: err.message, success: false };
  }
}