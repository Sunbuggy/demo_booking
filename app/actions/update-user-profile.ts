'use server';

import { createClient } from '@supabase/supabase-js';
import { createClient as createUserClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/**
 * IMPACT ANALYSIS: Schema Sync
 * We use .nullable() and .optional() for all employee-specific fields.
 * This ensures that Customer updates (Level < 300) don't trigger validation errors.
 */
const ProfileSchema = z.object({
  userId: z.string().uuid(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  stageName: z.string().optional().nullable(),
  email: z.string().email("Invalid email address"),
  userLevel: z.coerce.number(),
  // Employee Details fields
  position: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  workPhone: z.string().optional().nullable(),
  dialpadNumber: z.string().optional().nullable(),
  payrollId: z.string().optional().nullable(),
});

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function updateEmployeeProfile(prevState: any, formData: FormData) {
  const userClient = await createUserClient();
  const { data: { user: actor } } = await userClient.auth.getUser();
  
  if (!actor) return { message: 'Unauthorized', success: false };

  const supabaseAdmin = getAdminClient();

  // DEBUG: If updates fail, check console for this log
  // console.log("Form Payload:", Object.fromEntries(formData.entries()));

  const validated = ProfileSchema.safeParse({
    userId: formData.get('userId'),
    firstName: formData.get('first_name'),
    lastName: formData.get('last_name'),
    stageName: formData.get('stage_name'),
    email: formData.get('email'),
    userLevel: formData.get('user_level'),
    position: formData.get('position'),
    location: formData.get('location'),
    workPhone: formData.get('phone'), // Maps UI 'phone' to schema 'workPhone'
    dialpadNumber: formData.get('dialpad_number'),
    payrollId: formData.get('payroll_id'),
  });

  if (!validated.success) {
    const errorMsg = validated.error.issues.map(i => `${i.path}: ${i.message}`).join(', ');
    return { message: `Validation failed: ${errorMsg}`, success: false };
  }

  const data = validated.data;
  const fullName = `${data.firstName} ${data.lastName}`.trim();

  // 1. Update IDENTITY (public.users)
  const { error: userError } = await supabaseAdmin
    .from('users')
    .update({
      first_name: data.firstName,
      last_name: data.lastName,
      stage_name: data.stageName || data.firstName,
      full_name: fullName,
      user_level: data.userLevel,
      phone: data.workPhone,
      email: data.email
    })
    .eq('id', data.userId);

  if (userError) return { message: `Users table error: ${userError.message}`, success: false };

  // 2. Update OPERATIONS (public.employee_details)
  // Only upsert if user is Staff or if they already have a details record
  if (data.userLevel >= 300) {
    const { error: empError } = await supabaseAdmin
      .from('employee_details')
      .upsert({
        user_id: data.userId,
        primary_position: data.position,
        primary_work_location: data.location,
        emp_id: data.payrollId,
        dialpad_number: data.dialpadNumber,
        // CRITICAL: We omit work_phone if it's missing from your DB schema
        // If you ran the SQL ALTER TABLE, you can uncomment the line below:
        // work_phone: data.workPhone 
      }, { onConflict: 'user_id' });

    if (empError) return { message: `Employee details error: ${empError.message}`, success: false };
  }

  // Clear cache for both the list and the specific profile
  revalidatePath('/biz/users');
  revalidatePath(`/biz/users/${data.userId}`);
  
  return { message: 'Profile updated successfully', success: true };
}