/**
 * @file app/actions/publish-schedule.ts
 * @description Generates and emails the Roster to active staff.
 * UPDATES:
 * 1. LOCATION FILTERING: Now accepts a 'targetLocation' to send specific schedules.
 * 2. INTEGRATION: Includes Approved Time Off (Yellow) vs Shifts (Blue/Green).
 * 3. TECH: Uses Date-FNS and Resend.
 */
'use server';

import { createClient } from '@supabase/supabase-js'; // Admin client for bypassing RLS
import { createClient as createAuthClient } from '@/utils/supabase/server'; // Standard client for checking current user
import { Resend } from 'resend';
import { format, addDays, parseISO } from 'date-fns';

// Initialize Admin Client (Service Role)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const resend = new Resend(process.env.RESEND_API_KEY);

// --- TYPES ---
type Shift = {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  role: string;
  location?: string;
};

type TimeOff = {
  user_id: string;
  start_date: string;
  end_date: string;
  status: string;
};

type StaffMember = {
  id: string;
  full_name: string;
  email: string;
  primary_work_location: string;
};

/**
 * Main Action: Generates and Emails the Schedule
 * @param weekStart ISO Date String (YYYY-MM-DD) of the Monday starting the week
 * @param targetLocation 'ALL' or specific location name (e.g., 'Las Vegas')
 */
export async function sendRosterEmail(weekStart: string, targetLocation: string = 'ALL') {
  try {
    // 1. AUTHENTICATION CHECK
    const authClient = await createAuthClient();
    const { data: { user } } = await authClient.auth.getUser();
    
    if (!user) return { success: false, error: 'Unauthorized: No session found.' };

    // 2. FETCH DATA (Admin Client)
    const startDate = parseISO(weekStart);
    const endDate = addDays(startDate, 6); // Sunday
    const weekLabel = `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;

    console.log(`[Email] Generating ${targetLocation} roster for ${weekLabel}...`);

    const [usersRes, shiftsRes, timeOffRes] = await Promise.all([
      // A. Active Staff
      supabaseAdmin
        .from('users')
        .select('id, full_name, email, primary_work_location')
        .eq('active', true),
      
      // B. Shifts for the week
      supabaseAdmin
        .from('employee_schedules')
        .select('*')
        .gte('start_time', startDate.toISOString())
        .lte('start_time', addDays(endDate, 1).toISOString()), 
      
      // C. Approved Time Off
      supabaseAdmin
        .from('time_off_requests')
        .select('user_id, start_date, end_date, status')
        .eq('status', 'approved') 
        .gte('end_date', weekStart)
        .lte('start_date', format(endDate, 'yyyy-MM-dd'))
    ]);

    if (usersRes.error) throw new Error(`User Fetch Error: ${usersRes.error.message}`);
    if (shiftsRes.error) throw new Error(`Shift Fetch Error: ${shiftsRes.error.message}`);

    const staff = (usersRes.data || []) as StaffMember[];
    const shifts = (shiftsRes.data || []) as Shift[];
    const timeOffs = (timeOffRes.data || []) as TimeOff[];

    // 3. FILTER LOCATIONS
    // If target is 'ALL', use all locations. Otherwise, just the target.
    const allLocations = ['Las Vegas', 'Pismo', 'Michigan'];
    const activeLocations = targetLocation === 'ALL' 
      ? allLocations 
      : allLocations.filter(loc => loc === targetLocation);

    if (activeLocations.length === 0) {
      return { success: false, error: "Invalid Location Selected" };
    }

    // 4. GENERATE HTML CONTENT
    const days = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
    const titleColor = targetLocation === 'Las Vegas' ? '#d97706' : targetLocation === 'Pismo' ? '#0284c7' : '#16a34a';

    let emailHtml = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 1000px; margin: 0 auto;">
        <div style="background-color: #f8fafc; padding: 20px; border-bottom: 4px solid ${titleColor};">
          <h2 style="margin: 0; color: ${titleColor};">${targetLocation === 'ALL' ? 'SunBuggy Master' : targetLocation} Schedule</h2>
          <p style="margin: 5px 0 0; color: #64748b;">${weekLabel}</p>
        </div>
        <div style="padding: 20px;">
          <p>The roster has been updated. Please review your shifts below.</p>
    `;

    // We will collect email addresses of staff who actually appear in this report
    const staffInReport = new Set<string>();

    activeLocations.forEach(loc => {
      // Find staff relevant to this location
      // Logic: Their home base is here, OR they have a shift here this week.
      const locStaff = staff.filter(u => 
        u.primary_work_location === loc || 
        shifts.some(s => s.user_id === u.id && s.location === loc)
      );

      // Filter out staff with NO activity (No shifts AND No time off)
      const activeStaff = locStaff.filter(u => {
        const hasShift = shifts.some(s => s.user_id === u.id);
        const hasTimeOff = timeOffs.some(t => t.user_id === u.id);
        return hasShift || hasTimeOff;
      });

      if (activeStaff.length === 0) return;

      // Add their emails to our recipient list
      activeStaff.forEach(u => { if (u.email) staffInReport.add(u.email); });

      // Sort alphabetically
      activeStaff.sort((a, b) => a.full_name.localeCompare(b.full_name));

      // Append Table Header
      emailHtml += `
        <h3 style="background: #334155; color: #fff; padding: 8px 12px; margin: 25px 0 0 0; border-radius: 6px 6px 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
          ${loc}
        </h3>
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; font-size: 11px; border-color: #cbd5e1;">
          <tr style="background: #e2e8f0;">
            <th style="width: 120px; text-align: left; padding: 10px;">Employee</th>
            ${days.map(d => `<th style="width: 11%; text-align: center;">${format(d, 'EEE d')}</th>`).join('')}
          </tr>
      `;

      // Append Rows
      activeStaff.forEach(emp => {
        const empShifts = shifts.filter(s => s.user_id === emp.id);
        const empOffs = timeOffs.filter(t => t.user_id === emp.id);

        emailHtml += `<tr><td style="font-weight: bold; background: #f8fafc;">${emp.full_name}</td>`;

        days.forEach(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          
          // Match Shift
          const shift = empShifts.find(s => s.start_time.startsWith(dateStr));
          // Match Time Off
          const isOff = empOffs.find(t => dateStr >= t.start_date.substring(0, 10) && dateStr <= t.end_date.substring(0, 10));

          let cellStyle = "text-align: center; color: #94a3b8;"; 
          let content = "-";

          if (shift) {
            const timeStart = format(parseISO(shift.start_time), 'h:mm a');
            const timeEnd = format(parseISO(shift.end_time), 'h:mm a');
            
            // Highlight if shift location differs from report location (traveling staff)
            const isAway = shift.location && shift.location !== loc;
            const colorBg = isAway ? "#fef3c7" : "#e0f2fe"; 
            const colorText = isAway ? "#92400e" : "#0369a1";

            cellStyle = `background: ${colorBg}; color: ${colorText}; text-align: center; font-weight: bold; border-bottom: 2px solid #fff;`;
            content = `${timeStart}<br/><span style="font-size: 9px; opacity: 0.8;">${timeEnd}</span>`;
            
            if (shift.role && shift.role !== 'Guide') {
              content += `<br/><span style="font-size: 8px; text-transform: uppercase; background: rgba(0,0,0,0.1); padding: 1px 3px; border-radius: 2px;">${shift.role}</span>`;
            }
          } 
          else if (isOff) {
            cellStyle = "background: #fef9c3; color: #854d0e; text-align: center; border-bottom: 2px solid #fff;"; 
            content = "OFF";
          }

          emailHtml += `<td style="${cellStyle}">${content}</td>`;
        });

        emailHtml += `</tr>`;
      });

      emailHtml += `</table>`;
    });

    emailHtml += `
          <div style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 11px; color: #94a3b8; text-align: center;">
            <p>You are receiving this email because you are listed as active staff at SunBuggy Fun Rentals.</p>
            <p><a href="https://book.sunbuggy.com/biz/schedule" style="color: #d97706; text-decoration: none;">View Live Roster</a></p>
          </div>
        </div>
      </div>
    `;

    // 5. SEND EMAIL
    // Only send to staff who were actually included in this specific report
    const recipients = Array.from(staffInReport)
      .filter(email => email.includes('@') && !email.endsWith('.test'));

    // SAFETY FOR DEV: Hardcoded for safety. Swap logic for production.
    const safeRecipients = ['scott@sunbuggy.com']; 
    // FOR PROD: const safeRecipients = recipients; 

    console.log(`[Email] Sending '${targetLocation}' schedule to ${recipients.length} recipients (Dev mode: ${safeRecipients.length})...`);

    const { error } = await resend.emails.send({
      from: 'SunBuggy Schedule <schedule@sunbuggy.fun>',
      to: safeRecipients, // In Prod, this would be `recipients` or BCC
      subject: `📅 ${targetLocation === 'ALL' ? 'Master' : targetLocation} Schedule: ${weekLabel}`,
      html: emailHtml,
    });

    if (error) {
      console.error("Resend API Error:", error);
      return { success: false, error: "Email provider rejected the request." };
    }

    // 6. AUDIT LOG (Update last_notified)
    // Update timestamps for the shifts included in this email
    // If Location is ALL, update all shifts in week. If specific, filter by location.
    let updateQuery = supabaseAdmin
      .from('employee_schedules')
      .update({ last_notified: new Date().toISOString() })
      .gte('start_time', startDate.toISOString())
      .lte('start_time', addDays(endDate, 1).toISOString());

    if (targetLocation !== 'ALL') {
      updateQuery = updateQuery.eq('location', targetLocation);
    }
    
    await updateQuery;

    return { 
      success: true, 
      count: recipients.length, 
      message: `Sent to ${recipients.length} staff members in ${targetLocation}.` 
    };

  } catch (err: any) {
    console.error("Critical Publish Error:", err);
    return { success: false, error: err.message || "Unknown server error" };
  }
}