'use server';

import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js'; // For Admin Writes
import { revalidatePath } from 'next/cache';

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function submitTimeOffRequest(prevState: any, formData: FormData) {
  const supabase = await createClient(); // Standard Client
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { message: 'Unauthorized', success: false };

  // 1. Check for Admin Override
  const targetUserId = formData.get('targetUserId') as string;
  let effectiveUserId = user.id;
  let status = 'pending';
  let useAdminClient = false;

  if (targetUserId && targetUserId !== user.id) {
    // Verify Admin Status
    const { data: actor } = await supabase
      .from('users')
      .select('user_level')
      .eq('id', user.id)
      .single();

    if (!actor || actor.user_level < 500) {
      return { message: 'Unauthorized to manage others', success: false };
    }

    // Permission Granted
    effectiveUserId = targetUserId;
    status = 'approved'; // Admins auto-approve their own inputs
    useAdminClient = true;
  }

  // 2. Select DB Connection
  const db = useAdminClient ? getAdminClient() : supabase;

  // 3. Extract Data
  const startDate = formData.get('startDate') as string;
  const endDate = formData.get('endDate') as string;
  const reason = formData.get('reason') as string;

  if (!startDate || !endDate) {
    return { message: 'Dates are required', success: false };
  }

  // 4. Insert
  const { error } = await db
    .from('time_off_requests')
    .insert({
      user_id: effectiveUserId,
      start_date: startDate,
      end_date: endDate,
      reason: reason,
      status: status
    });

  if (error) {
    return { message: error.message, success: false };
  }

  revalidatePath('/account');
  revalidatePath(`/biz/users/${effectiveUserId}`);
  
  return { 
    message: useAdminClient ? 'Time off logged & approved' : 'Request submitted', 
    success: true 
  };
}

export async function cancelTimeOffRequest(requestId: string, targetUserId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  let useAdminClient = false;

  if (targetUserId && targetUserId !== user.id) {
     const { data: actor } = await supabase.from('users').select('user_level').eq('id', user.id).single();
     if (!actor || actor.user_level < 500) return;
     useAdminClient = true;
  }

  const db = useAdminClient ? getAdminClient() : supabase;

  // If user, can only delete own pending requests. If admin, can delete any.
  let query = db.from('time_off_requests').delete().eq('id', requestId);
  
  if (!useAdminClient) {
    query = query.eq('user_id', user.id).eq('status', 'pending');
  }

  await query;

  revalidatePath('/account');
  if (targetUserId) revalidatePath(`/biz/users/${targetUserId}`);
}