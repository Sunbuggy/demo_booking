'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const AvailabilitySchema = z.object({
  dayOfWeek: z.coerce.number().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
  // UPDATED: Replaced 'preferred' with 'preferred_off'
  preferenceLevel: z.enum(['unavailable', 'available', 'preferred_off']),
});

export async function addAvailabilityRule(prevState: any, formData: FormData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: 'Not authenticated', success: false };

  const validated = AvailabilitySchema.safeParse({
    dayOfWeek: formData.get('dayOfWeek'),
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime'),
    preferenceLevel: formData.get('preferenceLevel'),
  });

  if (!validated.success) {
    return { message: 'Invalid data format', success: false };
  }

  const { error } = await supabase.from('employee_availability_patterns').insert({
    user_id: user.id,
    day_of_week: validated.data.dayOfWeek,
    start_time: validated.data.startTime,
    end_time: validated.data.endTime,
    preference_level: validated.data.preferenceLevel,
  });

  if (error) {
    console.error('Availability Error:', error);
    return { message: 'Failed to save rule', success: false };
  }

  revalidatePath('/account'); 
  return { message: 'Availability rule added', success: true };
}

export async function deleteAvailabilityRule(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('employee_availability_patterns').delete().eq('id', id);
  
  if (error) {
    console.error('Delete Error:', error);
    return { success: false };
  }
  
  revalidatePath('/account');
  return { success: true };
}