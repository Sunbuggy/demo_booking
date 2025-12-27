'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const TimeOffSchema = z.object({
  startDate: z.string().date(), // Validates YYYY-MM-DD format
  endDate: z.string().date(),
  reason: z.string().min(3, "Reason is required"),
});

export async function submitTimeOffRequest(prevState: any, formData: FormData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: 'Not authenticated', success: false };

  const validated = TimeOffSchema.safeParse({
    startDate: formData.get('startDate'),
    endDate: formData.get('endDate'),
    reason: formData.get('reason'),
  });

  if (!validated.success) {
    return { message: 'Invalid dates or missing reason', success: false };
  }

  // Prevent start date being after end date
  if (new Date(validated.data.startDate) > new Date(validated.data.endDate)) {
      return { message: 'Start date cannot be after end date', success: false };
  }

  const { error } = await supabase.from('time_off_requests').insert({
    user_id: user.id,
    start_date: validated.data.startDate,
    end_date: validated.data.endDate,
    reason: validated.data.reason,
    status: 'pending'
  });

  if (error) {
    console.error('Time Off Error:', error);
    return { message: 'Failed to submit request', success: false };
  }

  revalidatePath('/account'); 
  return { message: 'Time off request submitted', success: true };
}

export async function cancelTimeOffRequest(id: string) {
  const supabase = await createClient();
  // Users can only delete their own pending requests via RLS, 
  // but good to add a status check if we wanted to be strict.
  const { error } = await supabase.from('time_off_requests').delete().eq('id', id);
  
  if (error) {
    console.error('Delete Error:', error);
    return { success: false };
  }
  
  revalidatePath('/account');
  return { success: true };
}