'use server';

import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js'; // Required for Admin access
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// --- EXISTING TIME OFF LOGIC ---

const ActionSchema = z.object({
  requestId: z.string().uuid(),
  status: z.enum(['approved', 'denied']),
  adminNote: z.string().optional(),
});

export async function processTimeOffRequest(formData: FormData) {
  // Use the standard server client (which respects Auth) for writes
  const supabase = await createServerClient();

  // 1. Auth Check (Security Level 500+)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };
  
  // Note: Add your specific Level 500+ check here (e.g., getUserProfile)

  // 2. Parse Data
  const rawData = {
    requestId: formData.get('requestId'),
    status: formData.get('status'),
    adminNote: formData.get('adminNote'),
  };

  const validated = ActionSchema.safeParse(rawData);
  if (!validated.success) return { error: 'Invalid data' };

  const { requestId, status, adminNote } = validated.data;

  // 3. Update DB
  const { error } = await supabase
    .from('time_off_requests')
    .update({ 
      status: status,
      manager_note: adminNote || (status === 'approved' ? 'Quick approved via Roster' : 'Denied via Roster'),
      updated_at: new Date().toISOString()
    })
    .eq('id', requestId);

  if (error) return { error: error.message };

  // 4. Refresh Roster immediately
  revalidatePath('/biz/schedule'); 
  return { success: true };
}

// --- NEW ADMIN FETCH LOGIC (Bypasses RLS) ---

export async function fetchStaffRosterAdmin(location: string) {
  // 1. Verify the current user is actually logged in (Security First)
  //    We use the standard client here to check THEIR permissions.
  const supabaseUser = await createServerClient();
  const { data: { user } } = await supabaseUser.auth.getUser();

  if (!user) return [];

  // Optional: Add a check here to ensure user.user_level >= 300

  // 2. Initialize ADMIN Client (Service Role)
  //    This client has "God Mode" and ignores RLS policies.
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  // 3. Fetch Data with the Admin Client
  //    We join 'users' with 'employee_details' to get the job titles and locations
  const { data, error } = await supabaseAdmin
    .from('users')
    .select(`
      *,
      employee_details (
        primary_work_location,
        department,
        job_title,
        hire_date,
        timeclock_blocked
      )
    `)
    .gte('user_level', 300) // Only fetch staff
    .order('full_name');

  if (error) {
    console.error('Admin Roster Fetch Error:', error);
    return [];
  }

  // 4. Filter by Location (if provided) and Flatten Data
  const filteredData = data
    .map((u: any) => {
        const details = u.employee_details?.[0] || {};
        // If employee_details has a location, use it. Otherwise fallback to Las Vegas
        const empLoc = details.primary_work_location || u.location || 'Las Vegas';
        
        return {
            id: u.id,
            full_name: u.full_name,
            // If stage_name is missing, fallback to first name
            stage_name: u.stage_name || u.full_name.split(' ')[0], 
            location: empLoc,
            department: details.department || u.department || 'General',
            job_title: details.job_title || details.primary_position || 'STAFF',
            hire_date: details.hire_date || u.hire_date,
            user_level: u.user_level,
            timeclock_blocked: !!details.timeclock_blocked,
            email: u.email,
            phone: u.phone,
            avatar_url: u.avatar_url
        };
    })
    // Filter: If 'location' arg is passed, only show employees at that location
    .filter((u: any) => !location || u.location === location);

  return filteredData;
}