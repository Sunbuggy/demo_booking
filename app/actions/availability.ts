'use server';

import { createClient } from '@/utils/supabase/server'; // 1. For User Session (Async)
import { createClient as createAdminClient } from '@supabase/supabase-js'; // 2. For Admin Power (Standard)
import { revalidatePath } from 'next/cache';

// Helper: Create the Admin Client correctly using the core library
function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { 
      auth: { 
        autoRefreshToken: false, 
        persistSession: false 
      } 
    }
  );
}

export async function addAvailabilityRule(prevState: any, formData: FormData) {
  // 1. Get the current user session (Standard Client)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { message: 'Unauthorized', success: false };

  // 2. Determine who we are adding this rule for
  const targetUserId = formData.get('targetUserId') as string;
  let effectiveUserId = user.id;
  let useAdminClient = false;

  if (targetUserId && targetUserId !== user.id) {
    // We are trying to edit someone else. Check if we are an Admin.
    const { data: userData } = await supabase
      .from('users')
      .select('user_level')
      .eq('id', user.id)
      .single();
      
    if (!userData || userData.user_level < 500) {
      return { message: 'Unauthorized to edit others', success: false };
    }
    
    // Permission Granted. Use the target ID and switch to Admin Mode.
    effectiveUserId = targetUserId;
    useAdminClient = true;
  }

  // 3. Select the correct DB connection
  // If Admin Mode, use the Service Role key. Otherwise, use the User's session.
  const db = useAdminClient ? getAdminClient() : supabase;

  // 4. Extract Form Data
  const dayOfWeek = parseInt(formData.get('dayOfWeek') as string);
  const startTime = formData.get('startTime') as string;
  const endTime = formData.get('endTime') as string;
  const preferenceLevel = formData.get('preferenceLevel') as string;

  // 5. Insert the Rule
  const { error } = await db
    .from('employee_availability_patterns')
    .insert({
      user_id: effectiveUserId,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      preference_level: preferenceLevel
    });

  if (error) {
    console.error("Availability Add Error:", error);
    return { message: error.message, success: false };
  }

  // 6. Refresh Views
  revalidatePath('/account'); // For the user themselves
  revalidatePath(`/biz/users/${effectiveUserId}`); // For the admin view
  
  return { message: 'Availability rule added', success: true };
}

export async function deleteAvailabilityRule(ruleId: string, targetUserId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  let useAdminClient = false;

  // Check Permissions if deleting for someone else
  if (targetUserId && targetUserId !== user.id) {
     const { data: userData } = await supabase.from('users').select('user_level').eq('id', user.id).single();
     if (!userData || userData.user_level < 500) return; 
     useAdminClient = true;
  }

  const db = useAdminClient ? getAdminClient() : supabase;

  await db.from('employee_availability_patterns').delete().eq('id', ruleId);

  revalidatePath('/account');
  if (targetUserId) revalidatePath(`/biz/users/${targetUserId}`);
}