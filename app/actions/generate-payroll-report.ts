/**
 * ACTION: Generate Payroll Report
 * Path: app/actions/generate-payroll-report.ts
 * Description: Generates a "hybrid" CSV export containing:
 * 1. A summary section at the top (with Reg/OT/DT calculations).
 * 2. A detailed punch-by-punch section at the bottom.
 * * UPDATES:
 * - Re-enabled 'notes' fetching (now that DB column exists).
 * - Robust error logging.
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
  notes: string | null; // Re-enabled
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

  // ---------------------------------------------------------------------------
  // 1. FETCH USERS & DETAILS
  // ---------------------------------------------------------------------------
  const { data: employees, error: empError } = await supabase
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

  if (empError) {
    console.error("GENERATE_REPORT_ERROR [Fetching Users]:", empError.message);
    throw new Error(`Failed to load staff list: ${empError.message}`);
  }

  if (!employees) throw new Error('Failed to fetch employee roster');

  // ---------------------------------------------------------------------------
  // 2. FILTER EMPLOYEES
  // ---------------------------------------------------------------------------
  const filteredEmployees = employees.filter((u: any) => {
    if (filterLoc === 'ALL') return true;
    
    // Safety check: handle if employee_details is missing or array
    const details = Array.isArray(u.employee_details) ? u.employee_details[0] : u.employee_details;
    const loc = details?.primary_work_location?.toUpperCase() || '';
    
    // Fuzzy match for locations
    if (filterLoc === 'VEGAS') return loc.includes('VEGAS');
    if (filterLoc === 'PISMO') return loc.includes('PISMO');
    if (filterLoc === 'SILVER') return loc.includes('SILVER');
    return loc.includes(filterLoc);
  });

  const validUserIds = filteredEmployees.map(u => u.id);
  
  if (validUserIds.length === 0) {
    return 'Error: No employees found matching the selected location filters.';
  }

  // ---------------------------------------------------------------------------
  // 3. FETCH TIME ENTRIES
  // ---------------------------------------------------------------------------
  const queryEnd = format(addDays(parseISO(endDate), 1), 'yyyy-MM-dd');

  // UPDATED: 'notes' is now included in the selection
  const { data: entries, error: entryError } = await supabase
    .from('time_entries')
    .select('id, user_id, start_time, end_time, notes') 
    .in('user_id', validUserIds)
    .gte('start_time', startDate)
    .lt('start_time', queryEnd)
    .not('end_time', 'is', null) // Only completed shifts
    .order('user_id', { ascending: true }) 
    .order('start_time', { ascending: true });

  if (entryError) {
    console.error("GENERATE_REPORT_ERROR [Fetching Entries]:", entryError);
    throw new Error(`Database Error: ${entryError.message}`);
  }

  if (!entries) {
    throw new Error('No entries returned from database.');
  }

  // ---------------------------------------------------------------------------
  // 4. PREPARE DATA MAPS
  // ---------------------------------------------------------------------------
  const summaryMap = new Map<string, EmployeeSummary>();
  const userMap = new Map<string, any>(); // Quick lookup for detail section

  filteredEmployees.forEach((u: any) => {
    userMap.set(u.id, u);

    const details = Array.isArray(u.employee_details) ? u.employee_details[0] : u.employee_details;
    const company = details?.payroll_company || 'NV-Default';
    const loc = details?.primary_work_location || 'Unknown';
    
    let stateRule = 'NV'; 
    if (company.toUpperCase().startsWith('CA') || loc.toUpperCase().includes('PISMO')) {
      stateRule = 'CA';
    } else if (company.toUpperCase().startsWith('MI')) {
      stateRule = 'MI';
    }

    summaryMap.set(u.id, {
      userId: u.id,
      fullName: u.full_name,
      empId: details?.emp_id || 'MISSING',
      company,
      location: loc,
      state: stateRule,
      regHours: 0,
      otHours: 0,
      dtHours: 0,
      totalHours: 0,
    });
  });

  // ---------------------------------------------------------------------------
  // 5. CALCULATE HOURS & OVERTIME
  // ---------------------------------------------------------------------------
  const entriesByUser = new Map<string, PayrollEntry[]>();
  
  // Group entries
  entries.forEach((e: any) => {
    if (!entriesByUser.has(e.user_id)) entriesByUser.set(e.user_id, []);
    
    const minutes = differenceInMinutes(parseISO(e.end_time), parseISO(e.start_time));
    const hours = round(minutes / 60);
    
    if (hours > 0) {
        entriesByUser.get(e.user_id)?.push({ ...e, duration: hours });
    }
  });

  // Apply Rules
  summaryMap.forEach((summary) => {
    const userEntries = entriesByUser.get(summary.userId) || [];
    if (userEntries.length === 0) return;

    if (summary.state === 'CA') {
      // --- CALIFORNIA LOGIC ---
      let weeklyRegAccumulator = 0;
      userEntries.forEach((entry) => {
        let dailyReg = entry.duration;
        let dailyOT = 0;
        let dailyDT = 0;

        // Daily DT (>12)
        if (dailyReg > 12) {
          dailyDT = dailyReg - 12;
          dailyReg = 12;
        }
        // Daily OT (>8)
        if (dailyReg > 8) {
          dailyOT = dailyReg - 8;
          dailyReg = 8;
        }
        // Weekly OT (>40 Accum)
        if (weeklyRegAccumulator + dailyReg > 40) {
          const room = Math.max(0, 40 - weeklyRegAccumulator);
          const overflow = dailyReg - room;
          dailyReg = room;
          dailyOT += overflow;
        }

        weeklyRegAccumulator += dailyReg;
        summary.regHours += dailyReg;
        summary.otHours += dailyOT;
        summary.dtHours += dailyDT;
        summary.totalHours += entry.duration;
      });
    } else {
      // --- NV/MI LOGIC ---
      let totalWeekHours = 0;
      userEntries.forEach(e => totalWeekHours += e.duration);
      
      summary.totalHours = totalWeekHours;
      if (totalWeekHours > 40) {
        summary.regHours = 40;
        summary.otHours = totalWeekHours - 40;
      } else {
        summary.regHours = totalWeekHours;
      }
    }

    // Final Rounding
    summary.regHours = round(summary.regHours);
    summary.otHours = round(summary.otHours);
    summary.dtHours = round(summary.dtHours);
    summary.totalHours = round(summary.totalHours);
  });

  // ---------------------------------------------------------------------------
  // 6. BUILD CSV OUTPUT
  // ---------------------------------------------------------------------------

  // --- SECTION A: SUMMARY ---
  const summaryHeader = [
    '--- WEEKLY SUMMARY ---',
    '', '', '', '', '', '', ''
  ].join(',');

  const tableHeader = [
    'Employee Name',
    'Employee ID',
    'Location',
    'State Rule',
    'Regular',
    'Overtime',
    'Double Time',
    'Total Hours'
  ].join(',');

  const summaryRows = Array.from(summaryMap.values())
    .filter(s => s.totalHours > 0)
    .sort((a, b) => a.fullName.localeCompare(b.fullName))
    .map(s => [
      `"${s.fullName}"`,
      `"${s.empId}"`,
      `"${s.location}"`,
      s.state,
      s.regHours.toFixed(2),
      s.otHours.toFixed(2),
      s.dtHours.toFixed(2),
      s.totalHours.toFixed(2)
    ].join(','));

  // --- SECTION B: DETAILS ---
  const spacer = ['', '', '', '', '', '', ''].join(','); 
  
  const detailTitle = [
    '--- INDIVIDUAL PUNCH DETAILS ---',
    '', '', '', '', '', ''
  ].join(',');

  const detailHeader = [
    'Date',
    'Employee Name',
    'Start Time',
    'End Time',
    'Duration',
    'Location',
    'Notes'
  ].join(',');

  const detailRows = entries.map((entry: any) => {
    const user = userMap.get(entry.user_id);
    const startObj = parseISO(entry.start_time);
    const endObj = parseISO(entry.end_time);
    const mins = differenceInMinutes(endObj, startObj);
    const hrs = round(mins / 60);

    // Active Notes Handling: Escapes double quotes
    const safeNotes = entry.notes ? entry.notes.replace(/"/g, '""') : '';
    
    // Use user's primary location
    const details = Array.isArray(user?.employee_details) ? user.employee_details[0] : user?.employee_details;
    const loc = details?.primary_work_location || '';

    return [
      format(startObj, 'yyyy-MM-dd'),
      `"${user?.full_name || 'Unknown'}"`,
      format(startObj, 'h:mm a'),
      format(endObj, 'h:mm a'),
      hrs.toFixed(2),
      `"${loc}"`,
      `"${safeNotes}"`
    ].join(',');
  });

  // --- COMBINE ALL ---
  return [
    summaryHeader,
    tableHeader,
    ...summaryRows,
    spacer,
    spacer,
    detailTitle,
    detailHeader,
    ...detailRows
  ].join('\n');
}