/**
 * @file /app/actions/add-staff.ts
 * @description Dual-table onboarding for SunBuggy Employees.
 */
'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const AddStaffSchema = z.object({
  mode: z.enum(['invite', 'silent']),
  email: z.string().email(),
  fullName: z.string().min(2),
  phone: z.string().optional(),
  employeeId: z.string().optional(),
  department: z.string().min(2), // Captured from UI
  location: z.string().min(2),   // Captured from UI
  userLevel: z.coerce.number().default(300),
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function addStaffMember(prevState: any, formData: FormData) {
  const validated = AddStaffSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!validated.success) return { message: 'Validation failed', success: false };

  const { mode, email, fullName, phone, employeeId, department, location, userLevel } = validated.data;
  let newUserId = '';

  // 1. Create Identity in Auth/Users
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
    skip_sent: mode === 'silent'
  });

  if (authError) return { message: authError.message, success: false };
  newUserId = authData.user.id;

  // 2. Step One: Update the 'users' table (Core Info)
  await supabaseAdmin
    .from('users')
    .update({ 
      full_name: fullName,
      phone: phone, 
      user_level: userLevel,
      user_type: 'employee' 
    })
    .eq('id', newUserId);

  // 3. Step Two: Populate 'employee_details' (Work Info)
  // This ensures the Roster knows EXACTLY where they belong immediately.
  const { error: detailError } = await supabaseAdmin
    .from('employee_details')
    .upsert({
      user_id: newUserId,
      primary_work_location: location,
      primary_position: department,
      emp_id: employeeId,
      work_phone: phone,
    });

  if (detailError) console.error("Employee Detail Sync Error:", detailError);

  revalidatePath('/biz/users');
  revalidatePath('/biz/schedule');
  return { success: true, message: `Onboarded ${fullName} successfully.` };
}