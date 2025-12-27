'use server';

import { createClient } from '@supabase/supabase-js';
import { createClient as createUserClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const AddStaffSchema = z.object({
  mode: z.enum(['invite', 'silent']),
  email: z.string().email(),
  fullName: z.string().min(2),
  phone: z.string().optional(),
  employeeId: z.string().optional(),
  position: z.string().min(2, "Position is required"),
  userLevel: z.coerce.number().min(300),
  location: z.string().min(2, "Location is required"),
});

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function addStaffMember(prevState: any, formData: FormData) {
  const userClient = await createUserClient();
  const { data: { user: actor } } = await userClient.auth.getUser();
  if (!actor) return { message: 'Unauthorized', success: false };

  const supabaseAdmin = getAdminClient();

  // Validate Input
  const validated = AddStaffSchema.safeParse({
    mode: formData.get('mode'),
    email: formData.get('email'),
    fullName: formData.get('fullName'),
    phone: formData.get('phone'),
    employeeId: formData.get('employeeId'),
    position: formData.get('position'),
    userLevel: formData.get('userLevel'),
    location: formData.get('location'),
  });

  if (!validated.success) {
    return { message: 'Invalid input data', success: false };
  }

  const { mode, email, fullName, phone, employeeId, position, userLevel, location } = validated.data;
  let newUserId = '';

  // 1. Create the User (Invite vs Silent)
  if (mode === 'invite') {
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName }
    });
    if (error) return { message: `Invite failed: ${error.message}`, success: false };
    newUserId = data.user.id;
  } else {
    // Silent: Random password, auto-confirmed
    const tempPassword = crypto.randomUUID() + "!!A1";
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });
    if (error) return { message: `Create failed: ${error.message}`, success: false };
    newUserId = data.user.id;
  }

  // 2. Update Public Profile
  await supabaseAdmin
    .from('users')
    .update({ 
      full_name: fullName,
      user_level: userLevel,
      user_type: 'employee' 
    })
    .eq('id', newUserId);

  // 3. Create Employee Details
  const { error: empError } = await supabaseAdmin
    .from('employee_details')
    .upsert({
      user_id: newUserId,
      primary_position: position,
      primary_work_location: location,
      emp_id: employeeId,
      work_phone: phone,
      time_correction_count: 0
    }, { onConflict: 'user_id' });

  if (empError) console.error("Employee Details Error:", empError);

  revalidatePath('/biz/users');
  return { 
    message: mode === 'invite' ? `Invited ${fullName}` : `Added ${fullName} to roster`, 
    success: true 
  };
}