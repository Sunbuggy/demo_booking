'use server';

import { createClient } from '@supabase/supabase-js';
import { createClient as createUserClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const ProfileSchema = z.object({
  userId: z.string().uuid(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  stageName: z.string().optional(),
  email: z.string().email(),
  position: z.string().optional(),
  location: z.string().optional(),
  userLevel: z.coerce.number(),
  workPhone: z.string().optional(),
  dialpadNumber: z.string().optional(),
  payrollId: z.string().optional(),
});

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function updateEmployeeProfile(prevState: any, formData: FormData) {
  const userClient = await createUserClient();
  const { data: { user: actor } } = await userClient.auth.getUser();
  if (!actor) return { message: 'Unauthorized', success: false };

  const supabaseAdmin = getAdminClient();

  const validated = ProfileSchema.safeParse({
    userId: formData.get('userId'),
    firstName: formData.get('first_name'),
    lastName: formData.get('last_name'),
    stageName: formData.get('stage_name'),
    email: formData.get('email'),
    position: formData.get('position'),
    location: formData.get('location'),
    userLevel: formData.get('user_level'),
    workPhone: formData.get('phone'),
    dialpadNumber: formData.get('dialpad_number'),
    payrollId: formData.get('payroll_id'),
  });

  if (!validated.success) {
    return { message: 'Invalid data provided', success: false };
  }

  const data = validated.data;
  const fullName = `${data.firstName} ${data.lastName}`.trim();

  // 1. Update Identity (USERS Table)
  const { error: userError } = await supabaseAdmin
    .from('users')
    .update({
      first_name: data.firstName,
      last_name: data.lastName,
      stage_name: data.stageName || data.firstName,
      full_name: fullName,
      user_level: data.userLevel,
      phone: data.workPhone,
      email: data.email // <--- THIS WAS MISSING
    })
    .eq('id', data.userId);

  if (userError) {
    console.error("User Update Error:", userError);
    return { message: `User update failed: ${userError.message}`, success: false };
  }

  // 2. Update Job Details (EMPLOYEE_DETAILS Table)
  const { error: empError } = await supabaseAdmin
    .from('employee_details')
    .upsert({
      user_id: data.userId,
      primary_position: data.position,
      primary_work_location: data.location,
      emp_id: data.payrollId,
      dialpad_number: data.dialpadNumber,
      time_correction_count: 0 
    }, { 
      onConflict: 'user_id',
      ignoreDuplicates: false 
    });

  if (empError) {
    console.error("Details Update Error:", empError);
    return { message: `Details failed: ${empError.message}`, success: false };
  }

  // 3. OPTIONAL: Update Supabase Auth Login Email
  // If you want changing this box to ALSO change their actual login credentials,
  // uncomment the block below. Note: This might trigger a "Confirm Email" flow depending on settings.
  /*
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
    data.userId,
    { email: data.email }
  );
  if (authError) console.error("Auth Update Warning:", authError.message);
  */

  revalidatePath(`/biz/users/${data.userId}`);
  return { message: 'Profile updated successfully', success: true };
}