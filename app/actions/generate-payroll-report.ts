/**
 * ACTION: Generate Payroll Report
 * Path: app/actions/generate-payroll-report.ts
 * Description: Generates a CSV export of payroll hours with state-specific overtime logic.
 * * FEATURES:
 * - Location Filtering: Respects the 'filterLoc' passed from the dashboard.
 * - OT Rules: Applies CA (Daily >8, DT >12) vs NV/MI (Weekly >40) rules.
 * - Summary Output: One row per employee with Reg/OT/DT totals.
 */

'use server';

import { createClient } from '@/utils/supabase/server';
import { parseISO, differenceInMinutes, format, addDays } from 'date-fns';

type PayrollEntry = {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  duration: number; // in hours
};

type EmployeeSummary = {
  userId: string;
  fullName: string;
  empId: string;
  company: string;
  location: string;
  state: string; // 'CA', 'NV', 'MI'
  regHours: number;
  otHours: number;
  dtHours: number;
  totalHours: number;
};

// Helper: Round to 2 decimals to match accounting standards
const round = (num: number) => Math.round(num * 100) / 100;

export async function generatePayrollReport(startDate: string, endDate: string, filterLoc: string) {
  const supabase = await createClient();

  // 1. Fetch Users & Details
  // We grab the location and company info to determine rules + filtering
  const { data: employees } = await supabase
    .from('users')
    .select(`
      id, 
      full_name,
      employee_details (
        payroll_company,
        emp_id,
        primary_work_location
      )
    `)
    .order('full_name');

  if (!employees) throw new Error('Failed to fetch employee roster');

  // --- FILTERING LOGIC ---
  // If a location filter is active (VEGAS, PISMO, etc), remove non-matching users
  const filteredEmployees = employees.filter((u: any) => {
    if (filterLoc === 'ALL') return true;
    
    const loc = u.employee_details?.primary_work_location?.toUpperCase() || '';
    // Check if user's location matches the filter code (VEGAS, PISMO, SILVER)
    return loc.includes(filterLoc);
  });

  const validUserIds = filteredEmployees.map(u => u.id);
  if (validUserIds.length === 0) return 'No employees found for this selection.';

  // 2. Fetch Time Entries
  // We extend the endDate by 1 day to ensure we capture the full 24h of the last day
  const queryEnd = format(addDays(new Date(endDate), 1), 'yyyy-MM-dd');

  const { data: entries } = await supabase
    .from('time_entries')
    .select('id, user_id, start_time, end_time')
    .in('user_id', validUserIds)
    .gte('start_time', startDate)
    .lt('start_time', queryEnd) // Use less-than next day logic for safety
    .not('end_time', 'is', null) // Only completed shifts count for payroll
    .order('start_time', { ascending: true });

  if (!entries) throw new Error('Failed to fetch time records');

  // 3. Initialize Summaries
  const summaryMap = new Map<string, EmployeeSummary>();

  filteredEmployees.forEach((u: any) => {
    // Flatten the joined object
    // Note: Supabase returns arrays for joins, usually [0] is correct for 1:1 relations
    const details = Array.isArray(u.employee_details) ? u.employee_details[0] : u.employee_details;
    
    // Determine Logic State based on Payroll Company or Location
    // Heuristic: If company starts with "CA-", it's CA. Or if loc is Pismo.
    const company = details?.payroll_company || 'NV-Default';
    const loc = details?.primary_work_location || 'Unknown';
    
    let stateRule = 'NV'; // Default
    if (company.toUpperCase().startsWith('CA') || loc.toUpperCase().includes('PISMO')) {
      stateRule = 'CA';
    } else if (company.toUpperCase().startsWith('MI')) {
      stateRule = 'MI';
    }

    summaryMap.set(u.id, {
      userId: u.id,
      fullName: u.full_name,
      empId: details?.emp_id || 'MISSING',
      company: company,
      location: loc,
      state: stateRule,
      regHours: 0,
      otHours: 0,
      dtHours: 0,
      totalHours: 0,
    });
  });

  // 4. Group Entries by User & Calc Durations
  const entriesByUser = new Map<string, PayrollEntry[]>();
  entries.forEach((e: any) => {
    if (!entriesByUser.has(e.user_id)) entriesByUser.set(e.user_id, []);
    
    // Strict minute calculation converted to hours
    const minutes = differenceInMinutes(parseISO(e.end_time), parseISO(e.start_time));
    const hours = round(minutes / 60);
    
    if (hours > 0) {
        entriesByUser.get(e.user_id)?.push({ ...e, duration: hours });
    }
  });

  // 5. Calculate Overtime Logic
  summaryMap.forEach((summary) => {
    const userEntries = entriesByUser.get(summary.userId) || [];
    if (userEntries.length === 0) return;

    // --- CALIFORNIA LOGIC ---
    // Daily OT > 8, Daily DT > 12, Weekly OT > 40 (Accumulated Reg)
    if (summary.state === 'CA') {
      let weeklyRegAccumulator = 0;

      userEntries.forEach((entry) => {
        let dailyReg = entry.duration;
        let dailyOT = 0;
        let dailyDT = 0;

        // 1. Daily Double Time (> 12h)
        if (dailyReg > 12) {
          dailyDT = dailyReg - 12;
          dailyReg = 12;
        }

        // 2. Daily Overtime (> 8h)
        if (dailyReg > 8) {
          dailyOT = dailyReg - 8;
          dailyReg = 8;
        }

        // 3. Weekly Overtime Check (> 40h Accumulated Regular)
        // Does adding today's regular hours push us over 40 for the week?
        if (weeklyRegAccumulator + dailyReg > 40) {
          const hoursAllowedBefore40 = Math.max(0, 40 - weeklyRegAccumulator);
          const shiftOverflow = dailyReg - hoursAllowedBefore40;
          
          // Move the overflow from Reg to OT
          dailyReg = hoursAllowedBefore40;
          dailyOT += shiftOverflow;
        }

        // Commit to totals
        weeklyRegAccumulator += dailyReg;
        
        summary.regHours += dailyReg;
        summary.otHours += dailyOT;
        summary.dtHours += dailyDT;
        summary.totalHours += entry.duration;
      });
    } 
    
    // --- STANDARD LOGIC (NV/MI) ---
    // Simple Weekly Bucket: Total > 40 = OT
    else {
      let totalWeekHours = 0;
      userEntries.forEach(e => totalWeekHours += e.duration);

      summary.totalHours = totalWeekHours;
      
      if (totalWeekHours > 40) {
        summary.regHours = 40;
        summary.otHours = totalWeekHours - 40;
      } else {
        summary.regHours = totalWeekHours;
        summary.otHours = 0;
      }
      summary.dtHours = 0; 
    }

    // Final Rounding
    summary.regHours = round(summary.regHours);
    summary.otHours = round(summary.otHours);
    summary.dtHours = round(summary.dtHours);
    summary.totalHours = round(summary.totalHours);
  });

  // 6. Build CSV String
  const header = [
    'Employee Name',
    'Employee ID',
    'Work Location',
    'Payroll Company',
    'State Rule',
    'Regular Hours',
    'Overtime Hours',
    'Double Time Hours',
    'Total Hours'
  ].join(',');

  const rows = Array.from(summaryMap.values())
    .filter(s => s.totalHours > 0) // Only export employees with hours
    .sort((a, b) => a.fullName.localeCompare(b.fullName)) // Alphabetical
    .map(s => [
      `"${s.fullName}"`,
      `"${s.empId}"`,
      `"${s.location}"`,
      `"${s.company}"`,
      s.state,
      s.regHours.toFixed(2),
      s.otHours.toFixed(2),
      s.dtHours.toFixed(2),
      s.totalHours.toFixed(2)
    ].join(','));

  return [header, ...rows].join('\n');
}