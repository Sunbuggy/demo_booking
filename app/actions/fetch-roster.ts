// app/actions/fetch-roster.ts
'use server';

import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { format, addDays, subDays } from 'date-fns';

// Initialize the Admin Client (Bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, 
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function fetchFullRosterData(date: string) {
  // 1. SECURITY CHECK: Ensure the user is actually a staff member (Level 300+)
  const supabaseUser = await createServerClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  
  if (!user) return { error: 'Not Authenticated' };

  // Fetch user profile to confirm level
  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('user_level')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.user_level || 0) < 300) {
    return { error: 'Unauthorized: Staff access required' };
  }

  // 2. PREPARE DATES
  const targetDate = new Date(date);
  const startRange = format(subDays(targetDate, 10), 'yyyy-MM-dd');
  const endRange = format(addDays(targetDate, 10), 'yyyy-MM-dd');

  // 3. FETCH EVERYTHING IN PARALLEL (Using Admin Client)
  try {
    const [staffRes, shiftsRes, requestsRes, availRes] = await Promise.all([
      // A. Staff & Details
      supabaseAdmin
        .from('users')
        .select(`
          *,
          employee_details (
            primary_work_location,
            department,
            primary_position,  
            job_title,
            hire_date,
            timeclock_blocked
          )
        `)
        // Ensuring we get only active/relevant staff
        .gte('user_level', 300)
        .order('full_name'),

      // B. Shifts
      supabaseAdmin
        .from('employee_schedules')
        .select('*')
        .gte('start_time', `${startRange}T00:00:00`)
        .lte('start_time', `${endRange}T23:59:59`),

      // C. Time Off Requests
      supabaseAdmin
        .from('time_off_requests')
        .select('*')
        .gte('end_date', startRange)
        .lte('start_date', endRange),

      // D. Availability Patterns
      supabaseAdmin
        .from('employee_availability_patterns')
        .select('*')
    ]);

    if (staffRes.error) throw staffRes.error;
    if (shiftsRes.error) throw shiftsRes.error;

    // 4. TRANSFORM STAFF DATA (Flatten the join)
    const employees = (staffRes.data || []).map((u: any) => {
        // ROBUST FIX: Handle both Array (1:Many) and Object (1:1) responses from Supabase
        const rawDetails = u.employee_details;
        const details = Array.isArray(rawDetails) ? rawDetails[0] : (rawDetails || {});

        return {
            id: u.id,
            full_name: u.full_name,
            stage_name: u.stage_name || u.full_name.split(' ')[0], 
            
            // Location Mapping
            location: details.primary_work_location || u.location || 'Las Vegas',
            
            // Department Mapping
            department: details.department || u.department || 'General',
            
            // Job Title / Position Mapping (CRITICAL FOR SORTING)
            // We prioritize 'primary_position' so that specific roles (e.g. "OPPS")
            // are correctly caught by the ROLE_GROUPS logic in page.tsx
            job_title: details.primary_position || details.job_title || 'STAFF',
            
            hire_date: details.hire_date || u.hire_date || null,
            user_level: u.user_level,
            timeclock_blocked: !!details.timeclock_blocked,
            email: u.email,
            phone: u.phone,
            avatar_url: u.avatar_url
        };
    });

    return {
      employees,
      shifts: shiftsRes.data || [],
      requests: requestsRes.data || [],
      availability: availRes.data || []
    };

  } catch (err: any) {
    console.error("Roster Fetch Error:", err);
    return { error: err.message };
  }
}