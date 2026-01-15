'use server';

import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

/**
 * Admin Client: Bypasses RLS for manager-level overrides.
 */
function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * SUBMIT: Handles time off requests with a strict string-based date fix.
 */
export async function submitTimeOffRequest(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { message: 'Unauthorized', success: false };

  const targetUserId = formData.get('targetUserId') as string;
  let effectiveUserId = user.id;
  let status = 'pending';
  let useAdminClient = false;

  if (targetUserId && targetUserId !== user.id) {
    const { data: actor } = await supabase
      .from('users')
      .select('user_level')
      .eq('id', user.id)
      .single();

    if (!actor || actor.user_level < 500) {
      return { message: 'Unauthorized to manage others', success: false };
    }

    effectiveUserId = targetUserId;
    status = 'approved'; 
    useAdminClient = true;
  }

  const db = useAdminClient ? getAdminClient() : supabase;
  
  // 1. RAW STRING EXTRACTION
  const rawStart = formData.get('startDate') as string;
  const rawEnd = formData.get('endDate') as string;
  const reason = formData.get('reason') as string;

  if (!rawStart || !rawEnd) {
    return { message: 'Dates are required', success: false };
  }

  /**
   * 2. THE ABSOLUTE DATE FIX:
   * We skip 'new Date()' entirely. 
   * If the input is '2026-01-09', we send exactly '2026-01-09'.
   * This prevents any UTC/Local conversion 'jumps' to the 8th.
   */
  const startDate = rawStart.split('T')[0];
  const endDate = rawEnd.split('T')[0];

  // 3. DATABASE INSERTION
  const { error } = await db
    .from('time_off_requests')
    .insert({
      user_id: effectiveUserId,
      start_date: startDate,
      end_date: endDate,
      reason: reason,
      status: status
    });

  if (error) return { message: error.message, success: false };

  // 4. CACHE REVALIDATION
  revalidatePath('/account');
  revalidatePath(`/account?userId=${effectiveUserId}`); 
  revalidatePath('/biz/payroll'); 
  revalidatePath('/biz/schedule'); 
  revalidatePath(`/biz/users/${effectiveUserId}`);
  
  return { 
    message: useAdminClient ? 'Time off logged & approved' : 'Request submitted', 
    success: true 
  };
}

/**
 * UPDATE STATUS: For the Payroll Review hub to approve/deny.
 */
export async function updateTimeOffStatus(requestId: string, targetUserId: string, newStatus: 'approved' | 'denied' | 'pending') {
  const supabase = await createClient();
  const { data: { user: actor } } = await supabase.auth.getUser();

  if (!actor) return { success: false, message: 'Not authenticated' };

  const { data: actorProfile } = await supabase
    .from('users')
    .select('user_level')
    .eq('id', actor.id)
    .single();

  if (!actorProfile || actorProfile.user_level < 500) {
    return { success: false, message: 'Insufficient permissions' };
  }

  const adminDb = getAdminClient();
  const { error } = await adminDb
    .from('time_off_requests')
    .update({ status: newStatus })
    .eq('id', requestId);

  if (error) return { success: false, message: error.message };

  revalidatePath('/account');
  revalidatePath('/biz/payroll');
  revalidatePath('/biz/schedule'); 
  revalidatePath(`/account?userId=${targetUserId}`); 
  revalidatePath(`/biz/users/${targetUserId}`);

  return { success: true };
}

/**
 * CANCEL: Handles request deletion.
 */
export async function cancelTimeOffRequest(requestId: string, targetUserId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  let useAdminClient = false;
  let effectiveUserId = user.id;

  if (targetUserId && targetUserId !== user.id) {
     const { data: actor } = await supabase.from('users').select('user_level').eq('id', user.id).single();
     if (!actor || actor.user_level < 500) return;
     useAdminClient = true;
     effectiveUserId = targetUserId;
  }

  const db = useAdminClient ? getAdminClient() : supabase;
  let query = db.from('time_off_requests').delete().eq('id', requestId);
  
  if (!useAdminClient) {
    query = query.eq('user_id', user.id).eq('status', 'pending');
  }

  await query;

  revalidatePath('/account');
  revalidatePath(`/account?userId=${effectiveUserId}`);
  revalidatePath('/biz/schedule');
  revalidatePath(`/biz/users/${effectiveUserId}`);
}