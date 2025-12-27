'use server';

import { createClient } from '@supabase/supabase-js'; 
import { createClient as createUserClient } from '@/utils/supabase/server'; 
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import moment from 'moment';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// --- APPROVE REQUEST ---
export async function approveCorrectionRequest(requestId: string) {
  const userClient = await createUserClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return { message: 'Unauthorized', success: false };
  
  const supabaseAdmin = getAdminClient();

  // 1. Fetch Request
  const { data: request, error: reqError } = await supabaseAdmin
    .from('time_sheet_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (reqError || !request) return { message: 'Request not found', success: false };

  // 2. Create Time Entry (MATCHING YOUR SCHEMA)
  // We calculate the duration manually just in case
  const start = moment(request.start_time);
  const end = moment(request.end_time);
  const durationMinutes = end.diff(start, 'minutes');
  const durationHours = parseFloat((durationMinutes / 60).toFixed(2));

  const { data: newEntry, error: entryError } = await supabaseAdmin
    .from('time_entries') 
    .insert({
      user_id: request.user_id,
      start_time: request.start_time,  // Matches your DB schema
      end_time: request.end_time,      // Matches your DB schema
      date: request.start_time.split('T')[0], // Extract YYYY-MM-DD
      status: 'completed',             // Since it has an end time
      duration: durationHours,         // Optional: Populate the duration column
      location: 'Admin Correction',    // Metadata context
      role: 'employee'                 // Default role if required
    })
    .select()
    .single();

  if (entryError) {
    console.error('Time Entry Creation Failed:', entryError);
    return { message: `DB Error: ${entryError.message}`, success: false };
  }

  // 3. Update Request Status
  await supabaseAdmin
    .from('time_sheet_requests')
    .update({ status: 'accepted' })
    .eq('id', requestId);

  // 4. Increment Correction Count
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

  // 5. Audit Log
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

// --- DENY REQUEST ---
export async function denyCorrectionRequest(requestId: string) {
  const supabaseAdmin = getAdminClient();
  
  // CHANGED: 'denied' -> 'rejected' (Standard Enum Value)
  const { error } = await supabaseAdmin
    .from('time_sheet_requests')
    .update({ status: 'rejected' }) 
    .eq('id', requestId);

  if (error) {
    console.error('Deny Request Failed:', error); // This will show the real error in your terminal
    return { message: `Error: ${error.message}`, success: false };
  }
  
  revalidatePath('/biz/payroll');
  return { message: 'Request denied.', success: true };
}

// --- MANUAL DIRECT EDIT ---
const EditSchema = z.object({
  entryId: z.string(),
  newStart: z.string(),
  newEnd: z.string().nullable(),
  reason: z.string().min(3)
});

export async function manualEditTimeEntry(prevState: any, formData: FormData) {
  const userClient = await createUserClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return { message: 'Unauthorized', success: false };

  const supabaseAdmin = getAdminClient();

  const validated = EditSchema.safeParse({
    entryId: formData.get('entryId'),
    newStart: formData.get('newStart'),
    newEnd: formData.get('newEnd'),
    reason: formData.get('reason'),
  });

  if (!validated.success) return { message: 'Invalid Data', success: false };
  const { entryId, newStart, newEnd, reason } = validated.data;

  // Recalculate duration if end time exists
  let durationVal = null;
  if (newEnd) {
     const s = moment(newStart);
     const e = moment(newEnd);
     durationVal = parseFloat((e.diff(s, 'minutes') / 60).toFixed(2));
  }

  // 1. Update the Entry (Using start_time / end_time)
  const { error: updateError } = await supabaseAdmin
    .from('time_entries')
    .update({
      start_time: newStart, 
      end_time: newEnd,
      duration: durationVal,
      status: newEnd ? 'completed' : 'active'
    })
    .eq('id', entryId);

  if (updateError) {
    console.error("Update Error:", updateError);
    return { message: 'Update failed', success: false };
  }

  // 2. Audit Log
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
// --- DELETE ENTRY ---
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

  // 1. Fetch the entry first (so we can log what was deleted)
  const { data: entryToDelete } = await supabaseAdmin
    .from('time_entries')
    .select('*')
    .eq('id', entryId)
    .single();

  if (!entryToDelete) return { message: 'Entry not found', success: false };

  // 2. Delete the Entry
  const { error: deleteError } = await supabaseAdmin
    .from('time_entries')
    .delete()
    .eq('id', entryId);

  if (deleteError) {
    console.error("Delete Error:", deleteError);
    return { message: 'Delete failed', success: false };
  }

  // 3. Audit Log
  await supabaseAdmin.from('audit_logs').insert({
    user_id: user.id,
    action: 'DELETE_TIME_ENTRY',
    table_name: 'time_entries',
    record_id: entryId,
    new_data: { 
      deleted_entry_backup: entryToDelete, // Save the data in case we need to restore it
      reason: reason 
    }
  });

  revalidatePath('/biz/payroll');
  return { message: 'Entry deleted successfully.', success: true };
}