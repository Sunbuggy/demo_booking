// app/(biz)/utils/get-users.ts
import { createClient } from '@/utils/supabase/server';

export async function getStaffUsers() {
  const supabase = await createClient();

  // We strictly join 'users' -> 'employee_details'
  // The !inner ensures we only get users who actually HAVE employee details (if that's desired)
  // OR we use standard join to get all users and fill in details where available.
  
  const { data: staff, error } = await supabase
    .from('users')
    .select(`
      id,
      full_name,
      email,
      user_level,
      job_title,
      employee_details!user_id (  
        payroll_company,
        emp_id,
        primary_work_location
      )
    `)
    // FILTER: Staff = Level 300+
    .gte('user_level', 300)
    .order('full_name', { ascending: true });

  if (error) {
    console.error('CRITICAL: Join failed. Check Foreign Key.', error);
    return [];
  }

  return staff;
}