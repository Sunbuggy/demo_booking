"use server";

import { createClient } from '@supabase/supabase-js';
import { createClient as createUserClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/**
 * IMPACT ANALYSIS: Hierarchical Sync
 * Added 'department' to handle Roster sorting groups.
 * Added 'hire_date' for seniority tracking.
 */
const ProfileSchema = z.object({
  userId: z.string().uuid(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  stageName: z.string().optional().nullable(),
  email: z.string().email("Invalid email address"),
  userLevel: z.coerce.number(),
  // Employee Details fields
  location: z.string().optional().nullable(),
  department: z.string().optional().nullable(), // Drives Roster Grouping
  position: z.string().optional().nullable(),   // Specific Role (ATV TECH, etc)
  hireDate: z.string().optional().nullable(),
  workPhone: z.string().optional().nullable(),
  dialpadNumber: z.string().optional().nullable(),
  payrollId: z.string().optional().nullable(),
});

/**
 * Admin Client: Bypasses RLS to allow managers to update 
 * employee metadata from the central roster portal.
 */
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function updateEmployeeProfile(prevState: any, formData: FormData) {
  // 1. Verify Authorization
  const userClient = await createUserClient();
  const { data: { user: actor } } = await userClient.auth.getUser();
  if (!actor) return { message: 'Unauthorized', success: false };

  const supabaseAdmin = getAdminClient();

  // 2. Validate & Map FormData (Matches UserForm 'name' attributes)
  const validated = ProfileSchema.safeParse({
    userId: formData.get('userId'),
    firstName: formData.get('first_name'),
    lastName: formData.get('last_name'),
    stageName: formData.get('stage_name'),
    email: formData.get('email'), // This will no longer be null
    userLevel: formData.get('user_level'),
    location: formData.get('location'),
    department: formData.get('department'),
    position: formData.get('position'),
    hireDate: formData.get('hire_date'),
    workPhone: formData.get('phone'),
    dialpadNumber: formData.get('dialpad_number'),
    payrollId: formData.get('payroll_id'),
  });

  if (!validated.success) {
    const errorMsg = validated.error.issues.map(i => `${i.path}: ${i.message}`).join(', ');
    return { message: `Validation failed: ${errorMsg}`, success: false };
  }

  const data = validated.data;
  const fullName = `${data.firstName} ${data.lastName}`.trim();

  try {
    // 3. Update IDENTITY (public.users)
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

    if (userError) throw new Error(`Users table error: ${userError.message}`);

    // 4. Update OPERATIONS (public.employee_details)
    // Critical: Upsert even if level < 300 to clean up stale records if needed,
    // or keep your original logic of level >= 300 only.
    if (data.userLevel >= 300) {
      const { error: empError } = await supabaseAdmin
        .from('employee_details')
        .upsert({
          user_id: data.userId,
          department: data.department,       // Resolves Jed sorting issue
          primary_position: data.position,   // e.g. BUGGY-TECH
          primary_work_location: data.location,
          hire_date: data.hireDate || null,
          emp_id: data.payrollId,
          dialpad_number: data.dialpadNumber,
        }, { onConflict: 'user_id' });

      if (empError) throw new Error(`Employee details error: ${empError.message}`);
    }

    // 5. Cache Invalidation
    revalidatePath('/biz/schedule');
    revalidatePath('/account');
    revalidatePath(`/biz/users/${data.userId}`);
    
    return { message: 'Profile synced successfully', success: true };

  } catch (error: any) {
    console.error('Update Action Failure:', error.message);
    return { message: error.message, success: false };
  }
}