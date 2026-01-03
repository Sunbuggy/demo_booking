import { VehicleType } from '@/app/(biz)/biz/vehicles/admin/page';
import { Database } from '@/types_db';
import { SupabaseClient } from '@supabase/supabase-js';
import { cache } from 'react';

// -----------------------------------------------------------------------------
// USER & AUTH QUERIES
// -----------------------------------------------------------------------------

export const getUser = cache(async (supabase: SupabaseClient) => {
  try {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    // console.log('run getUser');
    return user;
  } catch (error) {
    console.error(error);
  }
});

export type UserDetails = {
  avatar_url: string | null;
  full_name: string | null;
  id: string;
  user_level?: number | null;
  email?: string | null;
  homepage?: string | null;
};

export const getUserDetails = cache(
  async (supabase: any): Promise<any[] | null | undefined> => {
    try {
      if (!supabase) {
        console.error('getUserDetails: No supabase client provided');
        return null;
      }

      // Check if auth is available
      if (!supabase.auth) {
        return null;
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) {
        console.error(authError);
        return null;
      }

      const id = user?.id;
      if (!id) {
        console.log('getUserDetails: No user ID found');
        return null;
      }

      const { data: userDetails, error: err } = await supabase
        .from('users')
        .select('*')
        .eq('id', id);

      if (err) {
        console.error(err);
        return null;
      }

      return userDetails;
    } catch (error) {
      console.error('getUserDetails error:', error);
      return null;
    }
  }
);

export const getUserDetailsById = cache(
  async (
    supabase: SupabaseClient,
    id: string
  ): Promise<UserDetails[] | null | undefined> => {
    try {
      if (!supabase) {
        return null;
      }
      const { data: userDetails } = await supabase
        .from('users')
        .select('*')
        .eq('id', id);

      return userDetails as UserDetails[];
    } catch (error) {
      console.error(error);
    }
  }
);

export const getUserById = cache(
  async (supabase: SupabaseClient, id: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id);
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }
);

export const getAllUsers = cache(async (supabase: SupabaseClient) => {
  const { data, error } = await supabase.from('users').select();
  if (error) {
    console.error(error);
    return [];
  }
  return data;
});

// -----------------------------------------------------------------------------
// STAFF ROSTER & EMPLOYEE MANAGEMENT (NEW SECTION)
// -----------------------------------------------------------------------------

/**
 * Fetches the staff roster for a specific location.
 * Joins 'users' with 'employee_details' to allow sorting by hire_date.
 */
// Find the getStaffRoster function and update it:

/**
 * @file queries.ts
 * Updated getStaffRoster to exclude former employees (Level < 300)
 */
export const getStaffRoster = cache(async (supabase: SupabaseClient, location: string) => {
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      employee_details!inner (
        hire_date,
        department,
        primary_position,
        primary_work_location,
        timeclock_blocked
      )
    `)
    // CRITICAL FIX: Only fetch active staff members (Level 300+)
    .gte('user_level', 300) 
    
    // Filter by location in the related table
    .eq('employee_details.primary_work_location', location)
    
    // Sorting: Managers first, then by seniority
    .order('user_level', { ascending: false })
    .order('hire_date', { foreignTable: 'employee_details', ascending: true });

  if (error) {
    console.error('Detailed Roster Error:', error.message);
    return [];
  }

  // Flatten for the Roster Page
  return data.map((user: any) => ({
    ...user,
    hire_date: user.employee_details?.hire_date || null,
    department: user.employee_details?.department || 'Unassigned',
    job_title: user.employee_details?.primary_position || 'Staff',
    primary_work_location: user.employee_details?.primary_work_location,
    timeclock_blocked: !!user.employee_details?.timeclock_blocked
  }));
});

export const getEmployeeDetails = cache(
  async (supabase: SupabaseClient, user_id: string) => {
    const { data, error } = await supabase
      .from('employee_details')
      .select()
      .eq('user_id', user_id);
    if (error) {
      console.error(error);
      return [];
    }
    return data as Database['public']['Tables']['employee_details']['Row'][];
  }
);

/**
 * Modified version of getEmployeeDetails.
 * Returns null instead of an empty array if not found.
 */
export const getEmployeeDetailsSafe = cache(
  async (supabase: SupabaseClient, user_id: string) => {
    const { data, error } = await supabase
      .from('employee_details')
      .select()
      .eq('user_id', user_id)
      .maybeSingle();

    if (error) {
      console.error('getEmployeeDetailsSafe Error:', error);
      return null;
    }
    return data;
  }
);

export const upsertEmployeeDetails = cache(
  async (
    supabase: SupabaseClient,
    employee_details: Database['public']['Tables']['employee_details']['Insert']
  ) => {
    const { data, error } = await supabase
      .from('employee_details')
      .upsert(employee_details);
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }
);

/**
 * Highly efficient unified fetch for the Profile Page.
 * Uses a LEFT JOIN to ensure Customers (who have no employee_details) 
 * still load successfully without a 404.
 */
export const getFullUserProfile = cache(
  async (supabase: SupabaseClient, userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        employee_details (
          primary_work_location,
          primary_position,
          emp_id,
          dialpad_number,
          work_phone,
          hire_date,
          department
        )
      `)
      .eq('id', userId)
      .single();

    if (error) {
      console.error('getFullUserProfile Error:', error.message);
      return null;
    }
    return data;
  }
);

// -----------------------------------------------------------------------------
// USER UPDATES
// -----------------------------------------------------------------------------

export const updateUserName = cache(
  async (supabase: SupabaseClient, name: string) => {
    const { data, error } = await supabase
      .from('users')
      .update({ full_name: name })
      .eq('id', await getUser(supabase).then((user) => user?.id));
    return { data, error };
  }
);

export const updatePhoneNumber = cache(
  async (supabase: SupabaseClient, phone: string) => {
    const { data, error } = await supabase
      .from('users')
      .update({ phone })
      .eq('id', await getUser(supabase).then((user) => user?.id));
    return { data, error };
  }
);

export const updateUserLevel = cache(
  async (supabase: SupabaseClient, user_level: number) => {
    const { data, error } = await supabase
      .from('users')
      .update({ user_level })
      .eq('id', await getUser(supabase).then((user) => user?.id));
    return { data, error };
  }
);

export const updateUser = cache(
  async (
    supabase: SupabaseClient,
    user: Database['public']['Tables']['users']['Update'],
    id: string
  ) => {
    const { data, error } = await supabase
      .from('users')
      .update(user)
      .eq('id', id);
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }
);

export const checkIfUserHasLevel = cache(
  async (supabase: SupabaseClient, user_id: string, user_level: number) => {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('id', user_id)
      .gte('user_level', user_level);
    if (error) {
      console.error(error);
      return false;
    }
    return data.length > 0;
  }
);

// -----------------------------------------------------------------------------
// BOOKING GROUPS & VEHICLES
// -----------------------------------------------------------------------------

export const fetchHotels = cache(async (supabase: SupabaseClient) => {
  const { data, error } = await supabase.from('hotels').select();
  if (error) {
    console.error(error);
    return [];
  }
  return data;
});

export const fetchGroups = cache(
  async (supabase: SupabaseClient, date: Date) => {
    const isoDate = date.toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('groups')
      .select()
      .filter('group_date', 'eq', isoDate);
    if (error) {
      console.error(error, `fetchGroups Error! date: ${isoDate}`);
      return [];
    }
    return data;
  }
);

export const updateGroup = cache(
  async (
    supabase: SupabaseClient,
    updates: Partial<Database['public']['Tables']['groups']['Update']>,
    groupId: string
  ) => {
    const { data, error } = await supabase
      .from('groups')
      .update(updates)
      .eq('id', groupId)
      .select();
    
    if (error) {
      console.error('Error updating group:', error);
      throw error;
    }
    return data;
  }
);

export const fetchGroupVehicles = cache(
  async (supabase: SupabaseClient, date: Date) => {
    const isoDate = date.toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('group_vehicles')
      .select(
        `id, quantity, old_vehicle_name, old_booking_id, groups(group_name, group_date)`
      )
      .filter('groups.group_date', 'eq', isoDate);

    if (error) {
      console.error(error, `fetchGroupVehicles Error! group_date: ${isoDate}`);
      return [];
    }
    return data;
  }
);

export const fetchGroupNames = cache(
  async (supabase: SupabaseClient, old_booking_id: number) => {
    const { data, error } = await supabase
      .from('group_vehicles')
      .select('groups(group_name)')
      .eq('old_booking_id', old_booking_id);
    if (error) {
      console.error(
        error,
        `fetchGroupNames Error! old_booking_id: ${old_booking_id}`
      );
      return [];
    }
    return data;
  }
);

// -----------------------------------------------------------------------------
// TIME CLOCK & BREAKS
// -----------------------------------------------------------------------------

export const fetchTimeEntryByUserId = cache(
  async (supabase: SupabaseClient, userId: string) => {
    const { data, error } = await supabase
      .from('time_entries')
      .select(
        `id,
        date,
        user_id,
        clock_in_id,
        clock_out_id,
        clock_in (clock_in_time, lat, long),
        clock_out (clock_out_time, lat, long)
        `
      )
      .eq('user_id', userId)
      .is('clock_out_id', null);
    if (error) {
      console.error(
        error,
        `fetchTodayTimeEntryByUserId Error! userId: ${userId}`
      );
      return [];
    }
    return data;
  }
);

export const insertIntoClockIn = cache(
  async (
    supabase: SupabaseClient,
    userId: string,
    lat: number,
    long: number,
    imageUrl?: string 
  ) => {
    const looseClockedInData = await fetchTimeEntryByUserId(supabase, userId);
    if (looseClockedInData.length > 0) {
      return [];
    }
    
    const { data, error } = await supabase
      .from('clock_in')
      .insert([
        {
          clock_in_time: new Date().toISOString(),
          lat,
          long,
          image_url: imageUrl
        }
      ])
      .select();
    if (error) {
      console.error(error, `insertIntoClockIn Error! userId: ${userId}`);
      return [];
    }

    const clock_in_id = data[0]?.id;
    const { data: timeEntryData, error: timeEntryError } = await supabase
      .from('time_entries')
      .insert([
        {
          user_id: userId,
          date: new Date().toISOString().split('T')[0],
          clock_in_id
        }
      ]);
    if (timeEntryError) {
      console.error(
        timeEntryError,
        `insertIntoClockIn Error! userId: ${userId}`
      );
      return [];
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .update({ time_entry_status: 'clocked_in' })
      .eq('id', userId);
    if (userError) {
      console.error(userError, `insertIntoClockIn Error! userId: ${userId}`);
      return [];
    }

    return timeEntryData;
  }
);

export const insertIntoClockOut = cache(
  async (
    supabase: SupabaseClient,
    userId: string,
    lat: number,
    long: number,
    totalClockinHours: number,
    clockOutTime?: string,
    imageUrl?: string
  ) => {
    const { data: urData, error: usError } = await supabase
      .from('users')
      .select('time_entry_status')
      .eq('id', userId);
    if (usError) {
      console.error(usError, `insertIntoClockOut Error! userId: ${userId}`);
      return [];
    }
    const time_clock_status = urData[0]?.time_entry_status;
    
    // Handle break auto-close
    if (time_clock_status === 'on_break') {
      const looseClockedInData = await fetchTimeEntryByUserId(supabase, userId);
      if (looseClockedInData.length === 0) {
        return [];
      }
      const { data, error } = await supabase
        .from('breaks')
        .update({ break_end: new Date().toISOString() })
        .eq('entry_id', looseClockedInData[0]?.id)
        .select();

      const { data: userData, error: userError } = await supabase
        .from('users')
        .update({ time_entry_status: 'clocked_in' })
        .eq('id', userId);

      if (userError || error) {
        console.error(userError || error, `insertIntoBreakEnd Error! userId: ${userId}`);
        return [];
      }
    }

    const looseClockedInData = await fetchTimeEntryByUserId(supabase, userId);
    
    const { data, error } = await supabase
      .from('clock_out')
      .insert([
        {
          clock_out_time: clockOutTime || new Date().toISOString(),
          lat,
          long,
          image_url: imageUrl
        }
      ])
      .select();
    if (error) {
      console.error(error, `insertIntoClockOut Error! userId: ${userId}`);
      return [];
    }

    const clock_out_id = data[0]?.id;
    const { data: timeEntryData, error: timeEntryError } = await supabase
      .from('time_entries')
      .update({ clock_out_id, duration: totalClockinHours })
      .eq('user_id', userId)
      .eq('id', looseClockedInData[0]?.id)
      .select();

    if (timeEntryError) {
      console.error(
        timeEntryError,
        `insertIntoClockOut Error! userId: ${userId}`
      );
      return [];
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .update({ time_entry_status: 'clocked_out' })
      .eq('id', userId);
    if (userError) {
      console.error(userError, `insertIntoClockOut Error! userId: ${userId}`);
      return [];
    }
    return { timeEntryData };
  }
);

export const insertIntoBreak = cache(
  async (supabase: SupabaseClient, userId: string) => {
    const looseClockedInData = await fetchTimeEntryByUserId(supabase, userId);
    if (looseClockedInData.length === 0) {
      return [];
    }
    const { data, error } = await supabase
      .from('breaks')
      .insert([
        {
          break_start: new Date().toISOString(),
          entry_id: looseClockedInData[0]?.id
        }
      ])
      .select();

    const { data: userData, error: userError } = await supabase
      .from('users')
      .update({ time_entry_status: 'on_break' })
      .eq('id', userId);

    if (userError || error) {
      console.error(userError || error, `insertIntoBreak Error! userId: ${userId}`);
      return [];
    }
    return data;
  }
);

export const getSessionBreakStartTime = cache(
  async (supabase: SupabaseClient, userId: string) => {
    const looseClockedInData = await fetchTimeEntryByUserId(supabase, userId);
    if (looseClockedInData.length === 0) {
      return [];
    }
    const { data, error } = await supabase
      .from('breaks')
      .select('break_start')
      .eq('entry_id', looseClockedInData[0]?.id)
      .is('break_end', null);

    if (error) {
      console.error(error, `getSessionBreakStartTime Error! userId: ${userId}`);
      return [];
    }
    return data;
  }
);

export const insertIntoBreakEnd = cache(
  async (supabase: SupabaseClient, userId: string) => {
    const looseClockedInData = await fetchTimeEntryByUserId(supabase, userId);
    if (looseClockedInData.length === 0) {
      return [];
    }
    const { data, error } = await supabase
      .from('breaks')
      .update({ break_end: new Date().toISOString() })
      .eq('entry_id', looseClockedInData[0]?.id)
      .select();

    const { data: userData, error: userError } = await supabase
      .from('users')
      .update({ time_entry_status: 'clocked_in' })
      .eq('id', userId);

    if (userError || error) {
      console.error(userError || error, `insertIntoBreakEnd Error! userId: ${userId}`);
      return [];
    }
    return data;
  }
);

export const createTimeSheetRequest = cache(
  async (
    supabase: SupabaseClient,
    userId: string,
    start_time: Date,
    end_time: Date,
    reason: string
  ) => {
    const { data, error } = await supabase
      .from('time_sheet_requests')
      .insert([
        {
          user_id: userId,
          start_time: start_time.toISOString(),
          end_time: end_time.toISOString(),
          reason
        }
      ])
      .select();
    if (error) {
      console.error(error, `createTimeSheetRequest Error! userId: ${userId}`);
      return [];
    }
    return data;
  }
);

export const fetchTimeSheetRequests = cache(
  async (
    supabase: SupabaseClient,
    user_id: string,
    dateFrom: string,
    dateTo: string
  ) => {
    const { data, error } = await supabase
      .from('time_sheet_requests')
      .select()
      .eq('user_id', user_id)
      .filter('start_time', 'gte', dateFrom)
      .filter('start_time', 'lte', dateTo);
    if (error) {
      console.error(error, `fetchTimeSheetRequests Error!`);
      return [];
    }
    return data;
  }
);

export const fetchEmployeeTimeClockEntryData = cache(
  async (
    supabase: SupabaseClient,
    userId: string,
    dateFrom: string,
    dateTo: string
  ) => {
    const { data, error } = await supabase
      .from('time_entries')
      .select(
        `id,
        date,
        clock_in (clock_in_time, lat, long),
        clock_out (clock_out_time, lat, long)
        `
      )
      .eq('user_id', userId)
      .filter('date', 'gte', dateFrom)
      .filter('date', 'lte', dateTo);
    if (error) {
      console.error(
        error,
        `fetchEmployeeTimeClockEntryData Error! userId: ${userId}`
      );
      return [];
    }
    return data;
  }
);

export const fetchBreaksByUserId = cache(
  async (
    supabase: SupabaseClient,
    userId: string,
    dateFrom: string,
    dateTo: string
  ) => {
    const { data: timeEntries, error: timeEntryError } = await supabase
      .from('time_entries')
      .select('id')
      .eq('user_id', userId)
      .filter('date', 'gte', dateFrom)
      .filter('date', 'lte', dateTo);

    if (timeEntryError) {
      console.error(
        timeEntryError,
        `fetchBreaksByUserId Error! userId: ${userId}`
      );
      return [];
    }

    const entry_ids = timeEntries.map((entry) => entry.id);

    const { data, error } = await supabase
      .from('breaks')
      .select()
      .in('entry_id', entry_ids);

    if (error) {
      console.error(error, `fetchBreaksByUserId Error! userId: ${userId}`);
      return [];
    }
    return data;
  }
);

export const calculateTimeSinceClockIn = cache(
  async (supabase: SupabaseClient, userId: string) => {
    const looseClockedInData = await fetchTimeEntryByUserId(supabase, userId);
    if (looseClockedInData.length === 0) {
      return [];
    }
    const clock_in_id = looseClockedInData[0]?.clock_in_id;
    const { data: data_time, error } = await supabase
      .from('clock_in')
      .select('clock_in_time')
      .eq('id', clock_in_id);
    if (error) {
      console.error(
        error,
        `calculateTimeSinceClockIn Error! userId: ${userId}`
      );
      return [];
    }
    const clock_in_time = data_time[0]?.clock_in_time;
    const data = new Date().getTime() - new Date(clock_in_time).getTime();
    return { data };
  }
);

export const getClockedInTime = cache(
  async (supabase: SupabaseClient, userId: string) => {
    const looseClockedInData = await fetchTimeEntryByUserId(supabase, userId);
    if (looseClockedInData.length === 0) {
      return [];
    }
    const clock_in_id = looseClockedInData[0]?.clock_in_id;
    const { data, error } = await supabase
      .from('clock_in')
      .select('clock_in_time')
      .eq('id', clock_in_id);
    if (error) {
      console.error(error, `getClockedInTime Error! userId: ${userId}`);
      return [];
    }
    return data;
  }
);

// -----------------------------------------------------------------------------
// USER ROLE MANAGEMENT
// -----------------------------------------------------------------------------

export const makeUserEmployee = cache(
  async (supabase: SupabaseClient, userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .update({ user_level: 300, time_entry_status: 'clocked_out' })
      .eq('id', userId);
    if (error) {
      console.error(error, `makeUserEmployee Error! userId: ${userId}`);
      return [];
    }
    return data;
  }
);

export const makeUserPartner = cache(
  async (supabase: SupabaseClient, userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .update({ user_level: 250 })
      .eq('id', userId);
    if (error) {
      console.error(error, `makeUserPartner Error! userId: ${userId}`);
      return [];
    }
    return data;
  }
);

export const changeUserRole = cache(
  async (supabase: SupabaseClient, userId: string, user_level: number) => {
    const { data, error } = await supabase
      .from('users')
      .update({ user_level })
      .eq('id', userId);
    if (error) {
      console.error(error, `changeUserRole Error! userId: ${userId}`);
      return [];
    }
    return data;
  }
);

// -----------------------------------------------------------------------------
// DISPATCH GROUPS
// -----------------------------------------------------------------------------

export const removeDispatchGroup = async (
  supabase: SupabaseClient<Database>,
  userId: string,
  location: string
) => {
  const { error } = await supabase
    .from('dispatch_groups')
    .delete()
    .match({ user: userId, location: location });

  if (error) {
    console.error('Error removing dispatch group:', error);
    throw error;
  }
};

export const upsertDispatchGroup = cache(
  async (
    supabase: SupabaseClient,
    user: string,
    location: 'NV' | 'CA' | 'MI'
  ) => {
    const { data, error } = await supabase
      .from('dispatch_groups')
      .upsert([
        {
          user,
          location
        }
      ])
      .select();
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }
);

// -----------------------------------------------------------------------------
// VEHICLE MANAGEMENT
// -----------------------------------------------------------------------------

export const fetchVehicles = cache(async (supabase: SupabaseClient) => {
  const { data, error } = await supabase.from('vehicles').select();
  if (error) {
    console.error(error);
    return [];
  }
  return data as VehicleType[];
});

export const fetchVehiclesFromListOfIds = cache(
  async (supabase: SupabaseClient, vehicleIds: string[]) => {
    const { data, error } = await supabase
      .from('vehicles')
      .select()
      .in('id', vehicleIds);
    if (error) {
      console.error(error);
      return [];
    }
    return data as VehicleType[];
  }
);

export const removeVehicle = cache(
  async (supabase: SupabaseClient, vehicle_id: string) => {
    const { data, error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', vehicle_id);
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }
);

export const changeVehicleProfilePic = cache(
  async (
    supabase: SupabaseClient,
    vehicle_id: string,
    bucket: string,
    key: string
  ) => {
    const { data, error } = await supabase
      .from('vehicles')
      .update({
        profile_pic_bucket: bucket,
        profile_pic_key: key
      })
      .eq('id', vehicle_id);
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }
);

export const getVehicleProfilePic = cache(
  async (supabase: SupabaseClient, vehicle_id: string) => {
    const { data, error } = await supabase
      .from('vehicles')
      .select('profile_pic_bucket, profile_pic_key ')
      .eq('id', vehicle_id);
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }
);

export const insertIntoVehicles = cache(
  async (
    supabase: SupabaseClient,
    vehicle: Database['public']['Tables']['vehicles']['Insert']
  ) => {
    const { data, error } = await supabase.from('vehicles').insert([vehicle]);
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }
);

export const fetchVehicleInfo = cache(
  async (supabase: SupabaseClient, vehicle_id: string) => {
    const { data, error } = await supabase
      .from('vehicles')
      .select()
      .eq('id', vehicle_id);
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }
);

export const updateVehicle = cache(
  async (
    supabase: SupabaseClient,
    vehicle: Database['public']['Tables']['vehicles']['Update'],
    id: string
  ) => {
    const { data, error } = await supabase
      .from('vehicles')
      .update(vehicle)
      .eq('id', id);
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }
);

export const getVehicleIdFromName = cache(
  async (supabase: SupabaseClient, vehicle_name: string) => {
    const { data, error } = await supabase
      .from('vehicles')
      .select('id, vehicle_status, pet_name')
      .eq('name', vehicle_name);
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }
);

export const fetchVehicleNameFromId = cache(
  async (supabase: SupabaseClient, vehicle_id: string) => {
    const { data, error } = await supabase
      .from('vehicles')
      .select('name, id')
      .eq('id', vehicle_id);
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }
);

export const fetchVehicleNamesFromIds = cache(
  async (supabase: SupabaseClient, vehicle_ids: string[]) => {
    const { data, error } = await supabase
      .from('vehicles')
      .select('name, id')
      .in('id', vehicle_ids);
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }
);

// -----------------------------------------------------------------------------
// VEHICLE TAGS & STATUS
// -----------------------------------------------------------------------------

export const createVehicleTag = cache(
  async (
    supabase: SupabaseClient,
    tag: Database['public']['Tables']['vehicle_tag']['Insert']
  ) => {
    const { data, error } = await supabase
      .from('vehicle_tag')
      .insert([tag])
      .select('id');
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }
);

export const updateVehicleTag = cache(
  async (
    supabase: SupabaseClient,
    tag: Database['public']['Tables']['vehicle_tag']['Update'],
    id: string
  ) => {
    const { data, error } = await supabase
      .from('vehicle_tag')
      .update(tag)
      .eq('id', id);
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }
);

export const changeVehicleStatusToMaintenance = cache(
  async (supabase: SupabaseClient, vehicle_id: string) => {
    const { data, error } = await supabase
      .from('vehicles')
      .update({ vehicle_status: 'maintenance' })
      .eq('id', vehicle_id);
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }
);

export const changeVehicleStatusToBroken = cache(
  async (supabase: SupabaseClient, vehicle_id: string) => {
    const { data, error } = await supabase
      .from('vehicles')
      .update({ vehicle_status: 'broken' })
      .eq('id', vehicle_id);
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }
);

export const changeVehicleStatusToFine = cache(
  async (supabase: SupabaseClient, vehicle_id: string) => {
    const { data, error } = await supabase
      .from('vehicles')
      .update({ vehicle_status: 'fine' })
      .eq('id', vehicle_id);
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }
);

export const checkAndChangeVehicleStatus = async (
  supabase: SupabaseClient,
  vehicle_id: string
) => {
  const { data: vehicleTags, error: tagError } = await supabase
    .from('vehicle_tag')
    .select('tag_status, tag_type')
    .eq('vehicle_id', vehicle_id);
  if (tagError) {
    console.error(tagError);
    return [];
  }

  const allClosed = vehicleTags.every((tag) => tag.tag_status === 'closed');
  if (allClosed) {
    return changeVehicleStatusToFine(supabase, vehicle_id);
  }

  const allMaintenance = vehicleTags.every(
    (tag) => tag.tag_status === 'open' && tag.tag_type === 'maintenance'
  );
  if (allMaintenance) {
    return changeVehicleStatusToMaintenance(supabase, vehicle_id);
  }

  const allRepair = vehicleTags.some(
    (tag) => tag.tag_status === 'open' && tag.tag_type === 'repair'
  );
  if (allRepair) {
    return changeVehicleStatusToBroken(supabase, vehicle_id);
  }
};

// -----------------------------------------------------------------------------
// QR & PRETRIP FORMS
// -----------------------------------------------------------------------------

export const insertIntoQrHistorys = cache(
  async (
    supabase: SupabaseClient,
    qr_history: Database['public']['Tables']['qr_history']['Insert']
  ) => {
    const { data, error } = await supabase
      .from('qr_history')
      .insert([qr_history]);
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }
);

export const fetchQrHistoryInfo = cache(
  async (supabase: SupabaseClient, qr_history_id: string) => {
    const { data, error } = await supabase
      .from('qr_history')
      .select('id, vehicle_id, scanned_at, location, latitude, longitude')
      .eq('id', qr_history_id);
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }
);

export const fetchUserScanHistory = cache(
  async (supabase: SupabaseClient, userId: string) => {
    const { data, error } = await supabase
      .from('qr_history')
      .select('id, vehicle_id, scanned_at, location, latitude, longitude')
      .eq('user', userId)
      .order('scanned_at', { ascending: false });
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }
);

export const updateQrHistory = cache(
  async (
    supabase: SupabaseClient,
    qr_history: Database['public']['Tables']['qr_history']['Update'],
    id: string
  ) => {
    const { data, error } = await supabase
      .from('qr_history')
      .update(qr_history)
      .eq('id', id);
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }
);

export const fetchPretripFormHistory = cache(
  async (supabase: SupabaseClient, vehicle_id: string, veh_table: string) => {
    const { data, error } = await supabase
      .from(veh_table)
      .select()
      .eq('vehicle_id', vehicle_id);
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }
);

export const insertIntoShuttlePretripForm = cache(
  async (
    supabase: SupabaseClient,
    pretrip: Database['public']['Tables']['vehicle_pretrip_shuttle']['Insert'],
    veh_table: string
  ) => {
    const { data, error } = await supabase.from(veh_table).insert([pretrip]);
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }
);

export const insertIntoBuggyPretripForm = cache(
  async (
    supabase: SupabaseClient,
    pretrip: Database['public']['Tables']['vehicle_pretrip_buggy']['Insert'],
    veh_table: string
  ) => {
    const { data, error } = await supabase.from(veh_table).insert([pretrip]);
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }
);

export const insertIntoAtvPretripForm = cache(
  async (
    supabase: SupabaseClient,
    pretrip: Database['public']['Tables']['vehicle_pretrip_atv']['Insert'],
    veh_table: string
  ) => {
    const { data, error } = await supabase.from(veh_table).insert([pretrip]);
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }
);

export const insertIntoForkliftPretripForm = cache(
  async (
    supabase: SupabaseClient,
    pretrip: Database['public']['Tables']['vehicle_pretrip_forklift']['Insert'],
    veh_table: string
  ) => {
    const { data, error } = await supabase.from(veh_table).insert([pretrip]);
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }
);

export const insertIntoTruckPretripForm = cache(
  async (
    supabase: SupabaseClient,
    pretrip: Database['public']['Tables']['vehicle_pretrip_truck']['Insert'],
    veh_table: string
  ) => {
    const { data, error } = await supabase.from(veh_table).insert([pretrip]);
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }
);

// -----------------------------------------------------------------------------
// VEHICLE LOCATION TRACKING
// -----------------------------------------------------------------------------

export const fetchAllVehicleLocations = cache(
  async (supabase: SupabaseClient) => {
    const { data, error } = await supabase.from('vehicle_locations').select();
    if (error) {
      console.error(error);
      return [];
    }
    return data as Database['public']['Tables']['vehicle_locations']['Row'][];
  }
);

export const fetchVehicleLocations = cache(
  async (supabase: SupabaseClient, vehicle_id: string) => {
    const { data, error } = await supabase
      .from('vehicle_locations')
      .select()
      .eq('vehicle_id', vehicle_id)
      .order('created_at', { ascending: false });
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }
);

export const recordVehicleLocation = cache(
  async (
    supabase: SupabaseClient,
    vehicle_location: Database['public']['Tables']['vehicle_locations']['Insert']
  ) => {
    const { data, error } = await supabase
      .from('vehicle_locations')
      .insert([vehicle_location]);
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }
);

export const updateVehicleLocation = cache(
  async (
    supabase: SupabaseClient,
    vehicle_location: Database['public']['Tables']['vehicle_locations']['Update'],
    id: string
  ) => {
    const { data, error } = await supabase
      .from('vehicle_locations')
      .update(vehicle_location)
      .eq('id', id);
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }
);

export const insertIntoVehicleInventoryLocation = cache(
  async (
    supabase: SupabaseClient,
    vehicle_inventory_location: Database['public']['Tables']['vehicle_inventory_location']['Insert']
  ) => {
    const { data, error } = await supabase
      .from('vehicle_inventory_location')
      .insert([vehicle_inventory_location]);
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }
);

export const fetchVehicleInventoryLocation = cache(
  async (supabase: SupabaseClient, vehicle_id: string) => {
    const { data, error } = await supabase
      .from('vehicle_inventory_location')
      .select()
      .eq('vehicle_id', vehicle_id);
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }
);

export const insertIntoVehicleFutureLocation = cache(
  async (
    supabase: SupabaseClient,
    vehicle_future_location: Database['public']['Tables']['vehicle_future_location']['Insert']
  ) => {
    const { data, error } = await supabase
      .from('vehicle_future_location')
      .insert([vehicle_future_location]);
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }
);

export const fetchVehicleFutureLocationForVehicle = cache(
  async (supabase: SupabaseClient, vehicle_id: string) => {
    const { data, error } = await supabase
      .from('vehicle_future_location')
      .select()
      .eq('vehicle_id', vehicle_id);
    if (error) {
      console.error(error);
      return [];
    }
    return data as Database['public']['Tables']['vehicle_future_location']['Row'][];
  }
);

// Check the vehicle_future_location table
export const checkVehicleFutureLocation = cache(
  async (supabase: SupabaseClient) => {
    const { data: futureLocations, error: futureLocationError } = await supabase
      .from('vehicle_future_location')
      .select();
    if (futureLocationError) {
      console.error(futureLocationError);
      return [];
    }

    const today = new Date().toISOString().split('T')[0];

    for (const futureLocation of futureLocations) {
      const futureDate = futureLocation.future_date;
      const vehicle_id = futureLocation.vehicle_id;

      if (new Date(today) > new Date(futureDate)) {
        const { data, error } = await supabase
          .from('vehicle_future_location')
          .delete()
          .eq('vehicle_id', vehicle_id);
        if (error) {
          console.error(error);
          continue;
        }
      }

      if (today === futureDate) {
        const { data, error } = await supabase
          .from('vehicle_locations')
          .update({
            city: futureLocation.future_location,
            created_at: futureLocation.created_at,
            created_by: futureLocation.created_by
          })
          .eq('vehicle_id', vehicle_id);
        if (error) {
          console.error(error);
          continue;
        }

        const { data: clearData, error: clearError } = await supabase
          .from('vehicle_future_location')
          .delete()
          .eq('vehicle_id', vehicle_id);
        if (clearError) {
          console.error(clearError);
          continue;
        }
      }
    }
  }
);

// -----------------------------------------------------------------------------
// USER PREFERENCES & BG IMAGES
// -----------------------------------------------------------------------------

export const upsertUserBackgroundPreference = cache(
  async (
    supabase: SupabaseClient,
    user_id: string,
    background_image: string
  ) => {
    const { data, error } = await supabase
      .from('users')
      .upsert({ id: user_id, background_image });
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }
);

export const getUserBgImage = cache(
  async (supabase: SupabaseClient, user_id: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('bg_image')
      .eq('id', user_id);
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }
);

export const setUserBgImage = cache(
  async (supabase: SupabaseClient, user_id: string, bg_image: string) => {
    const { data, error } = await supabase
      .from('users')
      .upsert({ id: user_id, bg_image });
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }
);

// bg properties: bg_size, bg_repeat, bg_position.
export const setUserBgProperties = cache(
  async (
    supabase: SupabaseClient,
    user_id: string,
    bg_size: string,
    bg_repeat: string,
    bg_position: string
  ) => {
    const { data, error } = await supabase
      .from('users')
      .upsert({ id: user_id, bg_size, bg_repeat, bg_position });
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }
);

export const getUserBgProperties = cache(
  async (supabase: SupabaseClient, user_id: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('bg_size, bg_repeat, bg_position')
      .eq('id', user_id);
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }
);

// -----------------------------------------------------------------------------
// QR & AUDIT LOGS
// -----------------------------------------------------------------------------

export const getQrHistoryByUser = cache(
  async (supabase: SupabaseClient, user_id: string) => {
    const { data, error } = await supabase
      .from('qr_history')
      .select()
      .eq('user', user_id);
    if (error) {
      console.error(error);
      return [];
    }
    return data as Database['public']['Tables']['qr_history']['Row'][];
  }
);

export const fetchAuditLog = cache(async (supabase: SupabaseClient) => {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('id, created_at, action, user_id, table_name, row')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
  return data;
});

export const updateAuditLog = cache(
  async (
    supabase: SupabaseClient,
    audit_log: Database['public']['Tables']['audit_logs']['Update'],
    id: string
  ) => {
    const { data, error } = await supabase.from('audit_logs').update(audit_log);
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }
);

export const fetchAuditQueue = cache(async (supabase: SupabaseClient) => {
  const { data, error } = await supabase
    .from('audit_table_queue')
    .select('id, created_at, table')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
  return data;
});

export const updateAuditQueue = cache(
  async (
    supabase: SupabaseClient,
    audit_queue: Database['public']['Tables']['audit_table_queue']['Insert']
  ) => {
    const { data, error } = await supabase
      .from('audit_table_queue')
      .insert(audit_queue)
      .select();

    if (error) {
      console.error('Error inserting audit queue:', error);
      return null;
    }
    return data;
  }
);

export const deleteAuditQueue = async (
  supabase: SupabaseClient,
  id: string
) => {
  const { error } = await supabase
    .from('audit_table_queue')
    .delete()
    .eq('id', id);
  if (error) {
    console.error('Error deleting audit queue:', error);
    return null; // Return null on failure
  }
  return true;
};

// -----------------------------------------------------------------------------
// PISMO CHARGES & SHUTTLE ASSIGNMENTS
// -----------------------------------------------------------------------------

export const fetchChargesPismo = cache(async (supabase: SupabaseClient) => {
  const { data, error } = await supabase
    .from('charges_pismo')
    .select('id, created_at, table')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
  return data;
});

export const updateChargesPismo = cache(
  async (
    supabase: SupabaseClient,
    audit_log: Database['public']['Tables']['charges_pismo']['Update'],
    id: string
  ) => {
    const { data, error } = await supabase.from('charges_pismo').update(audit_log);
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }
);

export const fetchShuttleAssignment = cache(async (supabase: SupabaseClient) => {
  const { data, error } = await supabase
    .from('shuttle_assignment')
    .select(`
      id,
      created_at,
      date_assigned_for,
      employee_id,
      vehicle_id,
      vehicles:vehicle_id (id, name),
      users:employee_id (id, full_name)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching shuttle assignments:', error);
    return [];
  }
  return data;
});

export const updateShuttleAssignment = cache(
  async (
    supabase: SupabaseClient,
    audit_log: Database['public']['Tables']['shuttle_assignment']['Update'],
    id: string
  ) => {
    const { data, error } = await supabase.from('shuttle_assignment').update(audit_log);
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }
);

/**
 * Targeted fetch for the Torch Dashboard.
 * 1. Filters by Type: 'shuttle'
 * 2. Filters by Status: Excludes 'broken' AND 'former' (keeps 'maintenance' active)
 * 3. Filters by Location: Uses a specific Lat/Long bounding box for Las Vegas.
 * - Lat: 35.5 to 37.0 (Excludes Michigan & Phoenix)
 * - Long: -116.0 to -114.05 (Excludes CA & AZ)
 */
export const fetchShuttlesOnly = cache(async (supabase: SupabaseClient) => {
  // A. Fetch candidate vehicles (Shuttles that are active)
  const { data: vehicles, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('type', 'shuttle')
    .neq('vehicle_status', 'broken') // Exclude broken
    .neq('vehicle_status', 'former') // Exclude sold/retired vehicles
    .order('name', { ascending: true });

  if (error || !vehicles) {
    console.error('Error fetching shuttles:', error);
    return [];
  }

  // B. Get IDs to check location
  const vehicleIds = vehicles.map((v) => v.id);
  if (vehicleIds.length === 0) return [];

  // C. Fetch latest location history
  const { data: locations } = await supabase
    .from('vehicle_locations')
    .select('vehicle_id, latitude, longitude, created_at')
    .in('vehicle_id', vehicleIds)
    .order('created_at', { ascending: false });

  // D. Map latest location per vehicle
  const latestLocMap = new Map();
  locations?.forEach((loc) => {
    if (!latestLocMap.has(loc.vehicle_id)) {
      latestLocMap.set(loc.vehicle_id, loc);
    }
  });

  // E. Filter: Apply Las Vegas Bounding Box
  const vegasVehicles = vehicles.filter((v) => {
    const loc = latestLocMap.get(v.id);
    
    // If no location data exists, we assume it's valid to show (fallback)
    if (!loc) return true;

    const lat = loc.latitude;
    const lng = loc.longitude;

    // Check if inside Las Vegas Box
    const inVegasLat = lat > 35.5 && lat < 37.0;
    const inVegasLng = lng > -116.0 && lng < -114.05;

    return inVegasLat && inVegasLng;
  });
  
  return vegasVehicles as VehicleType[];
});
export const getIncompleteStaffProfiles = async (supabase: SupabaseClient) => {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      full_name,
      email,
      user_level,
      employee_details (
        department,
        primary_position,
        primary_work_location
      )
    `)
    .gte('user_level', 300); // Only check active staff

  if (error) return [];

  // Filter for users missing any critical roster field
  return data.filter(user => {
    const details = Array.isArray(user.employee_details) ? user.employee_details[0] : user.employee_details;
    return !details?.department || !details?.primary_position || !details?.primary_work_location;
  });
};