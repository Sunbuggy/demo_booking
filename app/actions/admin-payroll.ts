/**
 * ADMIN PAYROLL ACTIONS
 * Path: app/actions/admin-payroll.ts
 * Description: Server actions for Managers/Admins to audit time cards, 
 * approve correction requests, and manually edit punches.
 * * FEATURES:
 * - Service Role: Bypasses RLS for admin actions.
 * - Enum Safety: Uses 'accepted'/'rejected' to match DB constraints.
 * - Locking & Overlap: Prevents conflicts and edits to finalized weeks.
 * - Conflict Resolution: Handles 'forceOverride' to fix overlaps.
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
  isAfter
} from 'date-fns';

// --- HELPERS --------------------------------------------------------

function getAdminClient() {
  // Uses Service Role Key to bypass RLS policies
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const toDate = (d: string | Date) => (typeof d === 'string' ? parseISO(d) : d);

async function isPeriodLocked(supabaseAdmin: any, dateToCheck: string) {
  const dateObj = toDate(dateToCheck);
  const startOfWeek = format(startOfISOWeek(dateObj), 'yyyy-MM-dd');
  const endOfWeek = format(endOfISOWeek(dateObj), 'yyyy-MM-dd');

  const { data } = await supabaseAdmin
    .from('payroll_reports')
    .select('id')
    .eq('period_start', startOfWeek)
    .eq('period_end', endOfWeek)
    .eq('status', 'locked')
    .maybeSingle();

  return !!data;
}

// Renamed helper to return ALL conflicts, not just the first one
async function getConflicts(supabaseAdmin: any, userId: string, start: string, end: string | null, excludeEntryId?: string) {
  const targetStart = toDate(start);
  const targetEnd = end ? toDate(end) : new Date(); 

  // Query a wider range to catch shifts crossing midnight or long shifts
  const queryStart = new Date(targetStart.getTime() - 86400000).toISOString(); 
  const queryEnd = new Date(targetEnd.getTime() + 86400000).toISOString();     

  let query = supabaseAdmin
    .from('time_entries')
    .select('id, start_time, end_time')
    .eq('user_id', userId)
    .gte('start_time', queryStart) 
    .lte('start_time', queryEnd);

  if (excludeEntryId) {
    query = query.neq('id', excludeEntryId);
  }

  const { data: entries } = await query;
  if (!entries || entries.length === 0) return [];

  // Filter precisely in JS 
  return entries.filter((entry: any) => {
    const existingStart = parseISO(entry.start_time);
    const existingEnd = entry.end_time ? parseISO(entry.end_time) : new Date();
    // Overlap logic: (StartA < EndB) AND (EndA > StartB)
    return isBefore(targetStart, existingEnd) && isAfter(targetEnd, existingStart);
  });
}

// Old helper wrapper for backward compatibility if needed, though we use getConflicts mostly now
async function checkOverlap(supabaseAdmin: any, userId: string, start: string, end: string | null, excludeEntryId?: string) {
  const conflicts = await getConflicts(supabaseAdmin, userId, start, end, excludeEntryId);
  return conflicts.length > 0 ? conflicts[0] : null;
}

// --- ACTIONS --------------------------------------------------------

// UPDATED: Now accepts forceOverride flag
export async function approveCorrectionRequest(requestId: string, forceOverride = false) {
  const userClient = await createUserClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return { message: 'Unauthorized', success: false };
  
  const supabaseAdmin = getAdminClient();

  try {
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

    // C. Check Overlap (Conflict Detection)
    const conflicts = await getConflicts(supabaseAdmin, request.user_id, request.start_time, request.end_time);
    const hasConflict = conflicts.length > 0;

    if (hasConflict) {
      // 1. If NOT forcing, return conflict info to UI
      if (!forceOverride) {
        return { 
          success: false, 
          isConflict: true, 
          conflictingEntry: conflicts[0], // Pass the first conflict to the resolver
          message: 'Time overlap detected.' 
        };
      } 
      
      // 2. If FORCING, delete the conflicting entries
      else {
        const conflictIds = conflicts.map((c: any) => c.id);
        
        // Audit log the deletion before it happens
        await supabaseAdmin.from('audit_logs').insert({
          user_id: user.id,
          action: 'OVERWRITE_CONFLICT',
          table_name: 'time_entries',
          record_id: conflictIds.join(','),
          new_data: { deleted_ids: conflictIds, reason: `Overwritten by Request ${requestId}` }
        });

        const { error: delError } = await supabaseAdmin
            .from('time_entries')
            .delete()
            .in('id', conflictIds);

        if (delError) throw new Error(`Failed to clear conflict: ${delError.message}`);
      }
    }

    // D. Create New Entry
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
        role: 'employee',
        notes: `Correction Approved: ${request.reason}` // Added reason to notes
      })
      .select()
      .single();

    if (entryError) return { message: `DB Error: ${entryError.message}`, success: false };

    // E. Update Request Status (Enum: 'accepted')
    const { error: updateError } = await supabaseAdmin
      .from('time_sheet_requests')
      .update({ status: 'accepted' }) 
      .eq('id', requestId);

    if (updateError) return { message: `Failed to update status: ${updateError.message}`, success: false };
    
    // Increment Correction Count
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

  } catch (error: any) {
    return { success: false, message: error.message || "Unknown error occurred" };
  }
}

export async function denyCorrectionRequest(requestId: string) {
  const supabaseAdmin = getAdminClient();
  
  // Status Enum: 'rejected'
  const { error } = await supabaseAdmin
    .from('time_sheet_requests')
    .update({ status: 'rejected' }) 
    .eq('id', requestId);

  if (error) return { message: `Error: ${error.message}`, success: false };
  
  revalidatePath('/biz/payroll');
  return { message: 'Request denied.', success: true };
}

export async function manualEditTimeEntry(prevState: any, formData: FormData) {
  const userClient = await createUserClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return { message: 'Unauthorized', success: false };

  const supabaseAdmin = getAdminClient();
  const { data: editor } = await supabaseAdmin.from('users').select('full_name').eq('id', user.id).single();
  const editorName = editor?.full_name || 'Manager';

  const entryId = formData.get('entryId') as string;
  const newStart = formData.get('newStart') as string; 
  let newEnd = formData.get('newEnd') as string | null;
  const reason = formData.get('reason') as string;
  const resumeShift = formData.get('resumeShift') === 'true';

  if (!entryId || !newStart || !reason) return { message: 'Missing required fields', success: false };
  if (!newEnd) newEnd = null;
  if (resumeShift) newEnd = null;

  const { data: oldEntry } = await supabaseAdmin.from('time_entries').select('*, user_id').eq('id', entryId).single();
  if (!oldEntry) return { message: 'Entry not found', success: false };

  if (await isPeriodLocked(supabaseAdmin, oldEntry.start_time)) {
    return { message: 'Payroll period is locked.', success: false };
  }

  const conflict = await checkOverlap(supabaseAdmin, oldEntry.user_id, newStart, newEnd, entryId);
  if (conflict) {
    const conflictTime = format(parseISO(conflict.start_time), 'MMM d h:mm a');
    return { message: `Overlap Error: Conflicts with entry at ${conflictTime}.`, success: false };
  }

  let durationVal = null;
  if (newEnd) {
     durationVal = parseFloat(
       (differenceInMinutes(parseISO(newEnd), parseISO(newStart)) / 60).toFixed(2)
     );
  }

  const fmt = (t: string | null) => t ? format(parseISO(t), 'h:mm a') : 'Active';
  let changeDescription = `${fmt(oldEntry.start_time)} - ${fmt(oldEntry.end_time)} -> ${fmt(newStart)} - ${fmt(newEnd)}`;
  if (resumeShift) changeDescription = `RESUMED SHIFT (Cleared Clock Out): ${fmt(oldEntry.end_time)} removed.`;

  const newLogItem = {
    edited_by: editorName,
    edited_at: new Date().toISOString(),
    note: reason,
    changes: changeDescription
  };

  const updatedTrail = [...(oldEntry.audit_trail || []), newLogItem];

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

export async function addTimeEntry(prevState: any, formData: FormData) {
  const userClient = await createUserClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return { message: 'Unauthorized', success: false };

  const supabaseAdmin = getAdminClient();

  const userId = formData.get('userId') as string;
  const start = formData.get('start') as string;
  const end = formData.get('end') as string || null;
  const reason = formData.get('reason') as string;

  if (await isPeriodLocked(supabaseAdmin, start)) {
    return { success: false, message: 'Payroll period is locked.' };
  }

  const conflict = await checkOverlap(supabaseAdmin, userId, start, end);
  if (conflict) {
    const conflictTime = format(parseISO(conflict.start_time), 'MMM d h:mm a');
    return { success: false, message: `Overlap: Entry exists at ${conflictTime}.` };
  }

  let durationVal = 0;
  if (end) {
    durationVal = parseFloat(
      (differenceInMinutes(parseISO(end), parseISO(start)) / 60).toFixed(2)
    );
  }

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

export async function deleteTimeEntry(prevState: any, formData: FormData) {
  const userClient = await createUserClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return { message: 'Unauthorized', success: false };

  const supabaseAdmin = getAdminClient();
  const entryId = formData.get('entryId') as string;
  const reason = formData.get('reason') as string || "No reason provided";

  const { data: entryToDelete } = await supabaseAdmin.from('time_entries').select('*').eq('id', entryId).single();

  if (!entryToDelete) return { message: 'Entry not found', success: false };

  if (await isPeriodLocked(supabaseAdmin, entryToDelete.start_time)) {
    return { message: 'Cannot delete: Period is locked.', success: false };
  }

  const { error: deleteError } = await supabaseAdmin.from('time_entries').delete().eq('id', entryId);

  if (deleteError) return { message: 'Delete failed', success: false };

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

export async function togglePayrollLock(weekStart: string, action: 'lock' | 'unlock') {
    const userClient = await createUserClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const supabaseAdmin = getAdminClient();
    
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
        const { error } = await supabaseAdmin.from('payroll_reports')
            .delete()
            .eq('period_start', start)
            .eq('period_end', end);
        if (error) return { success: false, message: error.message };
    }

    revalidatePath('/biz/payroll');
    return { success: true };
}