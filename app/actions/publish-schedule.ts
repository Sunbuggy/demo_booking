'use server';

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import moment from 'moment';

// Initialize Admin Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function publishWeeklySchedule(
  weekStart: string, 
  weekEnd: string, 
  targetLocation: string
) {
  try {
    // 1. Build the Query
    // CHANGE: We removed the alias 'user:' and just use 'users' to be safe.
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

    // 2. Apply Location Filter
    if (targetLocation && targetLocation !== 'ALL') {
      query = query.eq('location', targetLocation);
    }

    const { data: shifts, error } = await query;

    if (error) throw new Error(error.message);
    
    if (!shifts || shifts.length === 0) {
      return { message: `No shifts found for ${targetLocation === 'ALL' ? 'any location' : targetLocation}.`, success: false };
    }

    // 3. Group Shifts by User
    const staffMap = new Map();
    let orphans = 0;

    shifts.forEach((shift: any) => {
      // HANDLE DATA STRUCTURE: Supabase might return 'users' as an object OR an array.
      const userData = Array.isArray(shift.users) ? shift.users[0] : shift.users;

      if (!userData || !userData.email) {
        orphans++;
        return; 
      }

      if (!staffMap.has(userData.id)) {
        staffMap.set(userData.id, {
          email: userData.email,
          name: userData.stage_name || userData.first_name || 'Staff',
          shifts: []
        });
      }
      staffMap.get(userData.id).shifts.push(shift);
    });

    // DIAGNOSTIC CHECK
    if (staffMap.size === 0) {
      return { 
        success: false, 
        message: `Found ${shifts.length} shifts, but could not link them to users with emails. (Orphans: ${orphans})` 
      };
    }

    // 4. Send Emails
    let emailCount = 0;
    const errors: string[] = [];
    const locationLabel = targetLocation === 'ALL' ? '' : `${targetLocation} `;

   for (const [userId, data] of Array.from(staffMap)) {
      const { email, name, shifts } = data;

      const shiftRows = shifts.map((s: any) => {
         const start = moment(s.start_time);
         const end = moment(s.end_time);
         return `<li style="margin-bottom: 8px;">
            <strong>${start.format('dddd, MMM D')}:</strong> ${start.format('h:mm A')} - ${end.format('h:mm A')} 
            <span style="color: #666;">(${s.role || 'Shift'} @ ${s.location})</span>
         </li>`;
      }).join('');

      const htmlContent = `
        <div style="font-family: sans-serif; color: #333;">
          <h2>Hi ${name},</h2>
          <p>Here is your <strong>${locationLabel}</strong>schedule for the week of <strong>${moment(weekStart).format('MMM D')}</strong>.</p>
          
          <ul style="background: #f9f9f9; padding: 15px 20px; border: 1px solid #eee; border-radius: 8px; list-style: none;">
            ${shiftRows}
          </ul>

          <p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/biz/schedule" 
               style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
               View Full Roster
            </a>
          </p>
        </div>
      `;

      const { error: sendError } = await resend.emails.send({
        from: 'SunBuggy Schedule <onboarding@resend.dev>', // Ensure this domain is verified in Resend
        to: email,
        subject: `📅 ${locationLabel}Schedule: ${moment(weekStart).format('MMM D')}`,
        html: htmlContent,
      });

      if (sendError) {
        console.error(`Failed to email ${email}`, sendError);
        errors.push(`${name}: ${sendError.message}`);
      } else {
        emailCount++;
      }
    }

    return { 
      success: true, 
      message: `Sent ${locationLabel}schedule to ${emailCount} staff members.`, 
      errors: errors.length > 0 ? errors : undefined 
    };

  } catch (err: any) {
    console.error("Publish Error:", err);
    return { message: err.message, success: false };
  }
}