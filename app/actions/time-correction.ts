'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import moment from 'moment';

// Validation Schema
const CorrectionRequestSchema = z.object({
  date: z.string().date(), // YYYY-MM-DD
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid start time"), // HH:mm
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid end time"),     // HH:mm
  reason: z.string().min(5, "Please provide a valid reason (min 5 chars)."),
});

export async function submitTimeCorrection(prevState: any, formData: FormData) {
  const supabase = await createClient();

  // 1. Authenticate
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: 'Unauthorized', success: false };

  // 2. Validate Inputs
  const validated = CorrectionRequestSchema.safeParse({
    date: formData.get('date'),
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime'),
    reason: formData.get('reason'),
  });

  if (!validated.success) {
    return { 
      message: 'Invalid input. Please check all fields.', 
      errors: validated.error.flatten().fieldErrors,
      success: false 
    };
  }

  const { date, startTime, endTime, reason } = validated.data;

  // 3. Construct ISO Timestamps (handling timezone roughly by combining date+time)
  // In production, consider using strict UTC or the user's local timezone offset.
  // Here we assume the browser input matches the desired "wall clock" time.
  const startISO = moment(`${date}T${startTime}`).toISOString();
  const endISO = moment(`${date}T${endTime}`).toISOString();

  // Basic logic check
  if (moment(endISO).isBefore(moment(startISO))) {
      return { message: 'End time cannot be before Start time.', success: false };
  }

  // 4. Insert Request
  const { error } = await supabase.from('time_sheet_requests').insert({
    user_id: user.id,
    start_time: startISO,
    end_time: endISO,
    reason: reason,
    status: 'pending' // Enums: pending, accepted, rejected
  });

  if (error) {
    console.error('Correction Request Error:', error);
    return { message: 'Failed to submit request. Please try again.', success: false };
  }

  revalidatePath('/account'); 
  return { message: 'Correction request submitted for approval.', success: true };
}