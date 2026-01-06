/**
 * ACTION: Generate Payroll Report
 * Path: app/actions/generate-payroll-report.ts
 * Description: Generates a CSV export of payroll hours with state-specific overtime logic.
 * Rules:
 * - CA: Daily OT (>8h), Daily DT (>12h), Weekly OT (>40h Reg).
 * - NV/MI: Weekly OT (>40h total).
 */

'use server';

import { createClient } from '@/utils/supabase/server';
import { parseISO, differenceInMinutes, format, startOfDay } from 'date-fns';

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
  state: string; // 'CA', 'NV', 'MI'
  regHours: number;
  otHours: number;
  dtHours: number;
  totalHours: number;
};

// Helper: Round to 2 decimals
const round = (num: number) => Math.round(num * 100) / 100;

export async function generatePayrollReport(startDate: string, endDate: string) {
  const supabase = await createClient();

  // 1. Fetch Users & Details
  // We need to join users with employee_details to get payroll info
  const { data: employees } = await supabase
    .from('users')
    .select(`
      id, 
      full_name,
      employee_details (
        payroll_company,
        emp_id
      )
    `)
    .order('full_name');

  // 2. Fetch Time Entries for the Period
  // We add buffer to end date to ensure we get the full day
  const { data: entries } = await supabase
    .from('time_entries')
    .select('id, user_id, start_time, end_time')
    .gte('start_time', startDate)
    .lte('start_time', endDate + 'T23:59:59')
    .not('end_time', 'is', null) // Only completed shifts
    .order('start_time', { ascending: true });

  if (!employees || !entries) {
    throw new Error('Failed to fetch payroll data');
  }

  // 3. Process Data per Employee
  const summaryMap = new Map<string, EmployeeSummary>();

  // Initialize Summaries
  employees.forEach((u: any) => {
    const details = u.employee_details?.[0] || {};
    // Extract state from "NV-ModernHR" -> "NV"
    const company = details.payroll_company || 'NV-Default';
    const state = company.substring(0, 2).toUpperCase();

    summaryMap.set(u.id, {
      userId: u.id,
      fullName: u.full_name,
      empId: details.emp_id || 'MISSING',
      company: company,
      state: ['CA', 'MI', 'NV'].includes(state) ? state : 'NV', // Default to NV logic if unknown
      regHours: 0,
      otHours: 0,
      dtHours: 0,
      totalHours: 0,
    });
  });

  // Group Entries by User
  const entriesByUser = new Map<string, PayrollEntry[]>();
  entries.forEach((e: any) => {
    if (!entriesByUser.has(e.user_id)) entriesByUser.set(e.user_id, []);
    
    // Calculate Duration in Hours
    const minutes = differenceInMinutes(parseISO(e.end_time), parseISO(e.start_time));
    const hours = round(minutes / 60);
    
    entriesByUser.get(e.user_id)?.push({
      ...e,
      duration: hours
    });
  });

  // 4. Calculate Overtime Logic
  summaryMap.forEach((summary) => {
    const userEntries = entriesByUser.get(summary.userId) || [];
    
    if (userEntries.length === 0) return;

    // --- CALIFORNIA LOGIC ---
    if (summary.state === 'CA') {
      let weeklyRegAccumulator = 0;

      userEntries.forEach((entry) => {
        const hours = entry.duration;
        let dailyReg = hours;
        let dailyOT = 0;
        let dailyDT = 0;

        // Daily Double Time (> 12h)
        if (dailyReg > 12) {
          dailyDT = dailyReg - 12;
          dailyReg = 12;
        }

        // Daily Overtime (> 8h)
        if (dailyReg > 8) {
          dailyOT = dailyReg - 8;
          dailyReg = 8;
        }

        // Weekly Overtime Check (> 40h Reg)
        // If adding this day's REGULAR hours pushes weekly REG over 40...
        if (weeklyRegAccumulator + dailyReg > 40) {
          const spaceUnder40 = Math.max(0, 40 - weeklyRegAccumulator);
          const shiftOverflow = dailyReg - spaceUnder40;
          
          // Transfer from Reg to OT
          dailyReg = spaceUnder40;
          dailyOT += shiftOverflow;
        }

        // Accumulate
        weeklyRegAccumulator += dailyReg;
        summary.regHours += dailyReg;
        summary.otHours += dailyOT;
        summary.dtHours += dailyDT;
        summary.totalHours += hours;
      });
    } 
    
    // --- NEVADA / MICHIGAN LOGIC (Standard FLSA Weekly) ---
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
      summary.dtHours = 0; // Standard states usually don't dictate DT
    }

    // Round final numbers
    summary.regHours = round(summary.regHours);
    summary.otHours = round(summary.otHours);
    summary.dtHours = round(summary.dtHours);
    summary.totalHours = round(summary.totalHours);
  });

  // 5. Build CSV
  // Header
  const header = [
    'Employee Name',
    'Employee ID',
    'Payroll Company',
    'State Rule',
    'Regular Hours',
    'Overtime Hours',
    'Double Time Hours',
    'Total Hours'
  ].join(',');

  // Rows
  const rows = Array.from(summaryMap.values())
    .filter(s => s.totalHours > 0) // Only show active employees
    .sort((a, b) => a.fullName.localeCompare(b.fullName))
    .map(s => [
      `"${s.fullName}"`,
      `"${s.empId}"`,
      `"${s.company}"`,
      s.state,
      s.regHours.toFixed(2),
      s.otHours.toFixed(2),
      s.dtHours.toFixed(2),
      s.totalHours.toFixed(2)
    ].join(','));

  return [header, ...rows].join('\n');
}