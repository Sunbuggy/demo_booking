/**
 * ADMIN PAYROLL ACTIONS
 * Path: app/actions/admin-payroll.ts
 * Description: Server actions for Managers/Admins to audit time cards, 
 * approve correction requests, and manually edit punches with full accountability.
 */

'use server';

import { createClient } from '@supabase/supabase-js'; 
import { createClient as createUserClient } from '@/utils/supabase/server'; 
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import moment from 'moment';

/**
 * Helper: Create a Supabase Admin Client
 * This client bypasses Row Level Security (RLS) to allow Managers to 
 * edit other users' data (which they normally can't do with their own token).
 */
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// ------------------------------------------------------------------
// 1. APPROVE CORRECTION REQUEST
// ------------------------------------------------------------------
/**
 * Takes a pending request from an employee (e.g., "I forgot to clock out")
 * and converts it into a real 'time_entry' record.
 */
export async function approveCorrectionRequest(requestId: string) {
  const userClient = await createUserClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return { message: 'Unauthorized', success: false };
  
  const supabaseAdmin = getAdminClient();

  // A. Fetch the Request Data
  const { data: request, error: reqError } = await supabaseAdmin
    .from('time_sheet_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (reqError || !request) return { message: 'Request not found', success: false };

  // B. Calculate Duration for the new entry
  const start = moment(request.start_time);
  const end = moment(request.end_time);
  const durationMinutes = end.diff(start, 'minutes');
  const durationHours = parseFloat((durationMinutes / 60).toFixed(2));

  // C. Insert the "Real" Time Entry
  const { data: newEntry, error: entryError } = await supabaseAdmin
    .from('time_entries') 
    .insert({
      user_id: request.user_id,
      start_time: request.start_time,
      end_time: request.end_time,
      date: request.start_time.split('T')[0], // Extract YYYY-MM-DD
      status: 'completed',             
      duration: durationHours,
      location: 'Admin Correction',    // Mark source as admin fix
      role: 'employee'                 
    })
    .select()
    .single();

  if (entryError) {
    console.error('Time Entry Creation Failed:', entryError);
    return { message: `DB Error: ${entryError.message}`, success: false };
  }

  // D. Mark Request as Accepted
  await supabaseAdmin
    .from('time_sheet_requests')
    .update({ status: 'accepted' })
    .eq('id', requestId);

  // E. Increment the "Correction Count" on the employee's profile (for tracking reliability)
  const { data: empDetails } = await supabaseAdmin
    .from('employee_details')
    .select('time_correction_count')
    .eq('user_id', request.user_id)
    .single();

  const newCount = (empDetails?.time_correction_count || 0) + 1;

  await supabaseAdmin
    .from('employee_details')
    .update({ time_correction_count: newCount })
    .eq('user_id', request.user_id);

  // F. System Audit Log (Security Log)
  await supabaseAdmin.from('audit_logs').insert({
    user_id: user.id, 
    action: 'APPROVE_TIME_REQUEST',
    table_name: 'time_sheet_requests',
    record_id: requestId,
    new_data: { 
      approved_entry_id: newEntry.id, 
      employee_id: request.user_id,
      correction_reason: request.reason
    }
  });

  revalidatePath('/biz/payroll');
  return { message: 'Request approved.', success: true };
}


// ------------------------------------------------------------------
// 2. DENY CORRECTION REQUEST
// ------------------------------------------------------------------
/**
 * Simply marks the request as rejected. Does not create a time entry.
 */
export async function denyCorrectionRequest(requestId: string) {
  const supabaseAdmin = getAdminClient();
  
  const { error } = await supabaseAdmin
    .from('time_sheet_requests')
    .update({ status: 'rejected' }) 
    .eq('id', requestId);

  if (error) {
    console.error('Deny Request Failed:', error);
    return { message: `Error: ${error.message}`, success: false };
  }
  
  revalidatePath('/biz/payroll');
  return { message: 'Request denied.', success: true };
}


// ------------------------------------------------------------------
// 3. MANUAL DIRECT EDIT (WITH AUDIT TRAIL)
// ------------------------------------------------------------------
/**
 * Allows a Manager to directly change start/end times on an existing entry.
 * CRITICAL: This updates the 'audit_trail' JSON column on the row to leave a history.
 */
const EditSchema = z.object({
  entryId: z.string(),
  newStart: z.string(),
  newEnd: z.string().nullable(), // Nullable because a shift might still be active
  reason: z.string().min(3, "Reason is required")
});

export async function manualEditTimeEntry(prevState: any, formData: FormData) {
  // A. Auth Check
  const userClient = await createUserClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return { message: 'Unauthorized', success: false };

  const supabaseAdmin = getAdminClient();

  // B. Get the Editor's Name (To show "Edited by Scott" in the UI)
  const { data: editor } = await supabaseAdmin
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .single();

  const editorName = editor?.full_name || 'Manager';

  // C. Validate Input Data
  const validated = EditSchema.safeParse({
    entryId: formData.get('entryId'),
    newStart: formData.get('newStart'),
    newEnd: formData.get('newEnd'),
    reason: formData.get('reason'),
  });

  if (!validated.success) return { message: 'Invalid Data', success: false };
  const { entryId, newStart, newEnd, reason } = validated.data;

  // D. Fetch OLD entry 
  // We need this to (1) Preserve existing history and (2) Compare old vs new times
  const { data: oldEntry } = await supabaseAdmin
    .from('time_entries')
    .select('audit_trail, start_time, end_time')
    .eq('id', entryId)
    .single();

  if (!oldEntry) return { message: 'Entry not found', success: false };

  // E. Recalculate Duration (if end time is present)
  let durationVal = null;
  if (newEnd) {
     const s = moment(newStart);
     const e = moment(newEnd);
     durationVal = parseFloat((e.diff(s, 'minutes') / 60).toFixed(2));
  }

  // F. Create the Audit Log Item
  // Helper to make times readable (e.g. "8:00 AM")
  const format = (t: string | null) => t ? moment(t).format('h:mm A') : 'Active';
  
  const newLogItem = {
    edited_by: editorName,
    edited_at: new Date().toISOString(),
    note: reason,
    // This string summary is what shows up in the UI tooltip
    changes: `${format(oldEntry.start_time)} - ${format(oldEntry.end_time)} → ${format(newStart)} - ${format(newEnd)}`
  };

  // Append new item to the existing array (or start a new one)
  const updatedTrail = [...(oldEntry.audit_trail || []), newLogItem];

  // G. Update the Record
  const { error: updateError } = await supabaseAdmin
    .from('time_entries')
    .update({
      start_time: newStart, 
      end_time: newEnd,
      duration: durationVal,
      status: newEnd ? 'completed' : 'active', // If we removed end_time, set back to active
      audit_trail: updatedTrail // <--- SAVES THE HISTORY ON THE ROW
    })
    .eq('id', entryId);

  if (updateError) {
    console.error("Update Error:", updateError);
    return { message: 'Update failed', success: false };
  }

  // H. System Audit Log (Optional Backup)
  // This writes to a separate table for security auditing if the row itself is deleted later
  await supabaseAdmin.from('audit_logs').insert({
    user_id: user.id,
    action: 'MANUAL_TIME_EDIT',
    table_name: 'time_entries',
    record_id: entryId,
    new_data: { newStart, newEnd, reason }
  });

  revalidatePath('/biz/payroll');
  return { message: 'Time entry updated successfully.', success: true };
}


// ------------------------------------------------------------------
// 4. DELETE ENTRY
// ------------------------------------------------------------------
/**
 * Permanently removes a time entry. Should be used sparingly.
 * Logs the action to 'audit_logs' with a backup of the data.
 */
const DeleteSchema = z.object({
  entryId: z.string(),
  reason: z.string().min(3, "Reason is required for deletion"),
});

export async function deleteTimeEntry(prevState: any, formData: FormData) {
  const userClient = await createUserClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return { message: 'Unauthorized', success: false };

  const supabaseAdmin = getAdminClient();

  const validated = DeleteSchema.safeParse({
    entryId: formData.get('entryId'),
    reason: formData.get('reason'),
  });

  if (!validated.success) {
    return { message: 'A valid reason is required to delete.', success: false };
  }
  
  const { entryId, reason } = validated.data;

  // A. Fetch the entry first (so we can log what was deleted)
  const { data: entryToDelete } = await supabaseAdmin
    .from('time_entries')
    .select('*')
    .eq('id', entryId)
    .single();

  if (!entryToDelete) return { message: 'Entry not found', success: false };

  // B. Delete the Entry
  const { error: deleteError } = await supabaseAdmin
    .from('time_entries')
    .delete()
    .eq('id', entryId);

  if (deleteError) {
    console.error("Delete Error:", deleteError);
    return { message: 'Delete failed', success: false };
  }

  // C. Audit Log (Preserves the deleted data in the 'new_data' JSON column)
  await supabaseAdmin.from('audit_logs').insert({
    user_id: user.id,
    action: 'DELETE_TIME_ENTRY',
    table_name: 'time_entries',
    record_id: entryId,
    new_data: { 
      deleted_entry_backup: entryToDelete, 
      reason: reason 
    }
  });

  revalidatePath('/biz/payroll');
  return { message: 'Entry deleted successfully.', success: true };
}