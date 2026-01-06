/**
 * ADMIN PAYROLL ACTIONS
 * Path: app/actions/admin-payroll.ts
 * Description: Server actions for Managers/Admins to audit time cards, 
 * approve correction requests, and manually edit punches with full accountability.
 * * FEATURES:
 * - Date-FNS: Replaced all Moment.js logic for modular/lighter date handling.
 * - Payroll Locking: Prevents edits to finalized weeks via 'payroll_reports'.
 * - Overlap Prevention: Strict checks to prevent double-billing.
 * - Resume Shift: Logic to clear a clock-out time and restore 'active' status.
 */

'use server';

import { createClient } from '@supabase/supabase-js'; 
import { createClient as createUserClient } from '@/utils/supabase/server'; 
import { revalidatePath } from 'next/cache';
import { 
  parseISO, 
  startOfISOWeek, 
  endOfISOWeek, 
  format, 
  differenceInMinutes, 
  isBefore, 
  isAfter,
  addDays
} from 'date-fns';

// --- HELPERS --------------------------------------------------------

/**
 * 1. Service Role Client
 * Bypasses Row Level Security (RLS) so Managers can edit/audit Employees 
 * even if RLS normally restricts visibility.
 */
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * Helper: Parse strings to Date safely.
 * If strictly ISO string from DB, parseISO handles it correctly in UTC context.
 */
const toDate = (d: string | Date) => (typeof d === 'string' ? parseISO(d) : d);

/**
 * 2. Period Lock Check
 * Returns true if the entry's date falls within a LOCKED payroll report.
 * Uses ISO Week (Monday-Sunday) to match the Roster standard.
 */
async function isPeriodLocked(supabaseAdmin: any, dateToCheck: string) {
  const dateObj = toDate(dateToCheck);
  
  // Calculate the Monday and Sunday of the week for this date
  const startOfWeek = format(startOfISOWeek(dateObj), 'yyyy-MM-dd');
  const endOfWeek = format(endOfISOWeek(dateObj), 'yyyy-MM-dd');

  // Check if a 'locked' report exists for this range
  const { data } = await supabaseAdmin
    .from('payroll_reports')
    .select('id')
    .eq('period_start', startOfWeek)
    .eq('period_end', endOfWeek)
    .eq('status', 'locked')
    .single();

  return !!data;
}

/**
 * 3. Overlap Check
 * Returns the conflicting entry object if one exists, or null.
 * * CRITICAL LOGIC FIX:
 * When checking an "Active" shift (end == null), we treat its effective end time as "NOW".
 * This prevents the system from assuming an active shift lasts forever (or 24h), 
 * which would falsely flag conflicts with shifts scheduled for tomorrow.
 */
async function checkOverlap(supabaseAdmin: any, userId: string, start: string, end: string | null, excludeEntryId?: string) {
  const targetStart = toDate(start);
  
  // If active (end is null), treat effective end as NOW for the purpose of past-overlap checks.
  const targetEnd = end ? toDate(end) : new Date(); 

  // Broad Fetch Range: Get entries for +/- 24 hours around the target to be safe.
  // We explicitly convert to ISO strings for the DB query.
  const queryStart = new Date(targetStart.getTime() - 86400000).toISOString(); // -24h
  const queryEnd = new Date(targetEnd.getTime() + 86400000).toISOString();     // +24h

  let query = supabaseAdmin
    .from('time_entries')
    .select('id, start_time, end_time')
    .eq('user_id', userId)
    .gte('start_time', queryStart) 
    .lte('start_time', queryEnd);

  // Exclude the entry itself if we are editing it
  if (excludeEntryId) {
    query = query.neq('id', excludeEntryId);
  }

  const { data: entries } = await query;

  if (!entries || entries.length === 0) return null;

  // JS Filter for strict overlap
  // Overlap Formula: (StartA < EndB) and (EndA > StartB)
  const conflict = entries.find((entry: any) => {
    const existingStart = parseISO(entry.start_time);
    const existingEnd = entry.end_time ? parseISO(entry.end_time) : new Date();

    return isBefore(targetStart, existingEnd) && isAfter(targetEnd, existingStart);
  });

  return conflict || null;
}

// --- ACTIONS --------------------------------------------------------

/**
 * ACTION: Approve Correction Request
 * Transforms a 'request' into a real 'time_entry'.
 */
export async function approveCorrectionRequest(requestId: string) {
  const userClient = await createUserClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return { message: 'Unauthorized', success: false };
  
  const supabaseAdmin = getAdminClient();

  // A. Fetch Request
  const { data: request, error: reqError } = await supabaseAdmin
    .from('time_sheet_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (reqError || !request) return { message: 'Request not found', success: false };

  // B. Check Locking
  if (await isPeriodLocked(supabaseAdmin, request.start_time)) {
    return { message: 'Cannot approve: Payroll period is locked.', success: false };
  }

  // C. Check Overlap
  const conflict = await checkOverlap(supabaseAdmin, request.user_id, request.start_time, request.end_time);
  if (conflict) {
    const conflictTime = format(parseISO(conflict.start_time), 'MMM d h:mm a');
    return { message: `Cannot approve: Overlaps with entry at ${conflictTime}.`, success: false };
  }

  // D. Create Entry
  // date-fns differenceInMinutes handles strict time math
  const durationHours = parseFloat(
    (differenceInMinutes(parseISO(request.end_time), parseISO(request.start_time)) / 60).toFixed(2)
  );

  const { data: newEntry, error: entryError } = await supabaseAdmin
    .from('time_entries') 
    .insert({
      user_id: request.user_id,
      start_time: request.start_time,
      end_time: request.end_time,
      date: request.start_time.split('T')[0],
      status: 'completed',             
      duration: durationHours,
      location: 'Admin Correction',
      role: 'employee'                 
    })
    .select()
    .single();

  if (entryError) return { message: `DB Error: ${entryError.message}`, success: false };

  // E. Update Request Status & Correction Counter
  await supabaseAdmin.from('time_sheet_requests').update({ status: 'accepted' }).eq('id', requestId);
  
  const { data: empDetails } = await supabaseAdmin.from('employee_details').select('time_correction_count').eq('user_id', request.user_id).single();
  const newCount = (empDetails?.time_correction_count || 0) + 1;
  await supabaseAdmin.from('employee_details').update({ time_correction_count: newCount }).eq('user_id', request.user_id);

  // F. Audit Log
  await supabaseAdmin.from('audit_logs').insert({
    user_id: user.id, 
    action: 'APPROVE_TIME_REQUEST',
    table_name: 'time_sheet_requests',
    record_id: requestId,
    new_data: { approved_entry_id: newEntry.id, employee_id: request.user_id }
  });

  revalidatePath('/biz/payroll');
  return { message: 'Request approved.', success: true };
}

/**
 * ACTION: Deny Correction Request
 */
export async function denyCorrectionRequest(requestId: string) {
  const supabaseAdmin = getAdminClient();
  const { error } = await supabaseAdmin.from('time_sheet_requests').update({ status: 'rejected' }).eq('id', requestId);
  if (error) return { message: `Error: ${error.message}`, success: false };
  revalidatePath('/biz/payroll');
  return { message: 'Request denied.', success: true };
}

/**
 * ACTION: Manual Edit / Resume Shift
 * Allows editing start/end times OR clearing end time to "Resume" a shift.
 */
export async function manualEditTimeEntry(prevState: any, formData: FormData) {
  const userClient = await createUserClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return { message: 'Unauthorized', success: false };

  const supabaseAdmin = getAdminClient();

  // A. Identify Editor
  const { data: editor } = await supabaseAdmin.from('users').select('full_name').eq('id', user.id).single();
  const editorName = editor?.full_name || 'Manager';

  // B. Parse Inputs
  const entryId = formData.get('entryId') as string;
  const newStart = formData.get('newStart') as string; // ISO string from datetime-local input
  let newEnd = formData.get('newEnd') as string | null;
  const reason = formData.get('reason') as string;
  const resumeShift = formData.get('resumeShift') === 'true';

  if (!entryId || !newStart || !reason) return { message: 'Missing required fields', success: false };
  if (!newEnd) newEnd = null;

  // C. Apply Resume Logic
  if (resumeShift) {
    newEnd = null;
  }

  // D. Fetch Original Entry
  const { data: oldEntry } = await supabaseAdmin.from('time_entries').select('*, user_id').eq('id', entryId).single();
  if (!oldEntry) return { message: 'Entry not found', success: false };

  // E. Check Locking
  if (await isPeriodLocked(supabaseAdmin, oldEntry.start_time)) {
    return { message: 'Payroll period is locked.', success: false };
  }

  // F. Check Overlap
  const conflict = await checkOverlap(supabaseAdmin, oldEntry.user_id, newStart, newEnd, entryId);
  if (conflict) {
    const conflictTime = format(parseISO(conflict.start_time), 'MMM d h:mm a');
    return { message: `Overlap Error: Conflicts with entry at ${conflictTime}.`, success: false };
  }

  // G. Calculate Duration
  let durationVal = null;
  if (newEnd) {
     durationVal = parseFloat(
       (differenceInMinutes(parseISO(newEnd), parseISO(newStart)) / 60).toFixed(2)
     );
  }

  // H. Generate Audit Text
  const fmt = (t: string | null) => t ? format(parseISO(t), 'h:mm a') : 'Active';
  
  let changeDescription = `${fmt(oldEntry.start_time)} - ${fmt(oldEntry.end_time)} -> ${fmt(newStart)} - ${fmt(newEnd)}`;
  if (resumeShift) {
    changeDescription = `RESUMED SHIFT (Cleared Clock Out): ${fmt(oldEntry.end_time)} removed.`;
  }

  const newLogItem = {
    edited_by: editorName,
    edited_at: new Date().toISOString(),
    note: reason,
    changes: changeDescription
  };

  const updatedTrail = [...(oldEntry.audit_trail || []), newLogItem];

  // I. Update DB
  const { error: updateError } = await supabaseAdmin
    .from('time_entries')
    .update({
      start_time: newStart, 
      end_time: newEnd,
      duration: durationVal,
      status: newEnd ? 'completed' : 'active',
      audit_trail: updatedTrail
    })
    .eq('id', entryId);

  if (updateError) return { message: 'Update failed', success: false };

  // J. Secondary Audit Log (Backup)
  await supabaseAdmin.from('audit_logs').insert({
    user_id: user.id,
    action: 'MANUAL_TIME_EDIT',
    table_name: 'time_entries',
    record_id: entryId,
    new_data: { newStart, newEnd, reason, resumeShift }
  });

  revalidatePath('/biz/payroll');
  return { message: resumeShift ? 'Shift resumed.' : 'Entry updated.', success: true };
}

/**
 * ACTION: Add Entry From Scratch
 */
export async function addTimeEntry(prevState: any, formData: FormData) {
  const userClient = await createUserClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return { message: 'Unauthorized', success: false };

  const supabaseAdmin = getAdminClient();

  const userId = formData.get('userId') as string;
  const start = formData.get('start') as string;
  const end = formData.get('end') as string || null;
  const reason = formData.get('reason') as string;

  // 1. Lock Check
  if (await isPeriodLocked(supabaseAdmin, start)) {
    return { success: false, message: 'Payroll period is locked.' };
  }

  // 2. Overlap Check
  const conflict = await checkOverlap(supabaseAdmin, userId, start, end);
  if (conflict) {
    const conflictTime = format(parseISO(conflict.start_time), 'MMM d h:mm a');
    return { success: false, message: `Overlap: Entry exists at ${conflictTime}.` };
  }

  // 3. Calc Duration
  let durationVal = 0;
  if (end) {
    durationVal = parseFloat(
      (differenceInMinutes(parseISO(end), parseISO(start)) / 60).toFixed(2)
    );
  }

  // 4. Insert
  const { data: newEntry, error } = await supabaseAdmin.from('time_entries').insert({
    user_id: userId,
    start_time: start,
    end_time: end,
    duration: durationVal,
    status: end ? 'completed' : 'active',
    location: 'Admin Manual',
    audit_trail: [{
        edited_by: user.email || 'Admin',
        edited_at: new Date().toISOString(),
        changes: 'Created Manual Entry',
        note: reason
    }]
  }).select().single();

  if (error) return { success: false, message: error.message };

  // 5. Audit Log
  await supabaseAdmin.from('audit_logs').insert({
    user_id: user.id,
    action: 'MANUAL_ENTRY_CREATE',
    table_name: 'time_entries',
    record_id: newEntry.id,
    new_data: { start, end, reason }
  });
  
  revalidatePath('/biz/payroll');
  return { success: true, message: 'Entry added successfully.' };
}

/**
 * ACTION: Delete Entry
 */
export async function deleteTimeEntry(prevState: any, formData: FormData) {
  const userClient = await createUserClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return { message: 'Unauthorized', success: false };

  const supabaseAdmin = getAdminClient();
  const entryId = formData.get('entryId') as string;
  const reason = formData.get('reason') as string || "No reason provided";

  // A. Fetch for Backup
  const { data: entryToDelete } = await supabaseAdmin.from('time_entries').select('*').eq('id', entryId).single();

  if (!entryToDelete) return { message: 'Entry not found', success: false };

  // B. Lock Check
  if (await isPeriodLocked(supabaseAdmin, entryToDelete.start_time)) {
    return { message: 'Cannot delete: Period is locked.', success: false };
  }

  // C. Delete
  const { error: deleteError } = await supabaseAdmin.from('time_entries').delete().eq('id', entryId);

  if (deleteError) return { message: 'Delete failed', success: false };

  // D. Audit Backup
  await supabaseAdmin.from('audit_logs').insert({
    user_id: user.id,
    action: 'DELETE_TIME_ENTRY',
    table_name: 'time_entries',
    record_id: entryId,
    new_data: { deleted_entry_backup: entryToDelete, reason: reason }
  });

  revalidatePath('/biz/payroll');
  return { message: 'Entry deleted.', success: true };
}

/**
 * ACTION: Toggle Payroll Lock
 * Creates or removes a record in 'payroll_reports' to lock a specific week.
 */
export async function togglePayrollLock(weekStart: string, action: 'lock' | 'unlock') {
    const userClient = await createUserClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const supabaseAdmin = getAdminClient();
    
    // Normalize to ISO Week to match isPeriodLocked logic
    const dateObj = parseISO(weekStart);
    const start = format(startOfISOWeek(dateObj), 'yyyy-MM-dd');
    const end = format(endOfISOWeek(dateObj), 'yyyy-MM-dd');

    if (action === 'lock') {
        const { error } = await supabaseAdmin.from('payroll_reports').insert({
            period_start: start,
            period_end: end,
            generated_by: user.id,
            status: 'locked'
        });
        if (error) return { success: false, message: error.message };
    } else {
        // Unlock means deleting the report record so edits can resume
        const { error } = await supabaseAdmin.from('payroll_reports')
            .delete()
            .eq('period_start', start)
            .eq('period_end', end);
        if (error) return { success: false, message: error.message };
    }

    revalidatePath('/biz/payroll');
    return { success: true };
}