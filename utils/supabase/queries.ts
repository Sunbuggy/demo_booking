import { VehicleType } from '@/app/(biz)/biz/vehicles/admin/page';
import { Database } from '@/types_db';
import { SupabaseClient } from '@supabase/supabase-js';
import { cache } from 'react';

// Utility function to get the current date and time in PST

// Get Generated uuid from supabase

// Usage
export const getUser = cache(async (supabase: SupabaseClient) => {
  try {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    console.log('run getUser');
    return user;
  } catch (error) {
    console.error(error);
  }
});
export type UserDetails = {
  avatar_url: string | null;
  full_name: string | null;
  id: string;
  user_level?: number | null; // Add user_level to the type definition
  email?: string | null;
};

export const getUserDetails = cache(
  async (supabase: SupabaseClient): Promise<any[] | null | undefined> => {
    try {
      if (!supabase) {
        return null;
      }
      const {
        data: { user }
      } = await supabase.auth.getUser();

      const id = user?.id;
      if (!id) {
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
      console.error(error);
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
    const isoDate = date.toISOString().split('T')[0]; // Convert to ISO string and extract the date part
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
export const fetchGroupVehicles = cache(
  async (supabase: SupabaseClient, date: Date) => {
    // Join with groups table with group_id then pull results that match the date
    const isoDate = date.toISOString().split('T')[0]; // Convert to ISO string and extract the date part
    const { data, error } = await supabase
      .from('group_vehicles')
      .select(
        `
       id, quantity, old_vehicle_name, old_booking_id, groups(group_name, group_date) `
      )
      .filter('groups.group_date', 'eq', isoDate);

    if (error) {
      console.error(error, `fetchGroupVehicles Error! group_date: ${isoDate}`);
      return [];
    }
    return data;
  }
);

// Grab all the group_name(s) fro the selected old_booking_id
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
    long: number
  ) => {
    // If this user_id has a time_entry that has a clock_in_id but no clock_out_id, then return and do nothing
    const looseClockedInData = await fetchTimeEntryByUserId(supabase, userId);
    if (looseClockedInData.length > 0) {
      return [];
    }
    // First insert into clock_in table clock_in_time, lat, long
    const { data, error } = await supabase
      .from('clock_in')
      .insert([
        {
          clock_in_time: new Date().toISOString(),
          lat,
          long
        }
      ])
      .select();
    if (error) {
      console.error(error, `insertIntoClockIn Error! userId: ${userId}`);
      return [];
    }

    // Then insert into time_entries table user_id, date, and clock_in_id from the clock_in table above
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

    // Go to users table and change the time_entry_status to 'clocked_in'
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
    clockOutTime?: string
  ) => {
    // check the users table and get the time_entry_status
    const { data: urData, error: usError } = await supabase
      .from('users')
      .select('time_entry_status')
      .eq('id', userId);
    if (usError) {
      console.error(usError, `insertIntoClockOut Error! userId: ${userId}`);
      return [];
    }
    const time_clock_status = urData[0]?.time_entry_status;
    if (time_clock_status === 'on_break') {
      // First get the user's time entry that has a clock_in_id but no clock_out_id
      const looseClockedInData = await fetchTimeEntryByUserId(supabase, userId);
      if (looseClockedInData.length === 0) {
        return [];
      }
      const { data, error } = await supabase
        .from('breaks')
        .update({ break_end: new Date().toISOString() })
        .eq('entry_id', looseClockedInData[0]?.id)
        .select();

      // Update the user's time_entry_status to 'clocked_in'
      const { data: userData, error: userError } = await supabase
        .from('users')
        .update({ time_entry_status: 'clocked_in' })
        .eq('id', userId);

      if (userError) {
        console.error(userError, `insertIntoBreakEnd Error! userId: ${userId}`);
        return [];
      }

      if (error) {
        console.error(error, `insertIntoBreakEnd Error! userId: ${userId}`);
        return [];
      }
    }

    const looseClockedInData = await fetchTimeEntryByUserId(supabase, userId);
    // First insert into clock_out table clock_out_time, lat, long
    const { data, error } = await supabase
      .from('clock_out')
      .insert([
        {
          clock_out_time: clockOutTime || new Date().toISOString(),
          lat,
          long
        }
      ])
      .select();
    if (error) {
      console.error(error, `insertIntoClockOut Error! userId: ${userId}`);
      return [];
    }

    // Then insert into time_entries table user_id, date, and clock_out_id from the clock_out table above
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

    // Go to users table and change the time_entry_status to 'clocked_out'
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
    // First get the user's time entry that has a clock_in_id but no clock_out_id
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

    // Update the user's time_entry_status to 'on_break'
    const { data: userData, error: userError } = await supabase
      .from('users')
      .update({ time_entry_status: 'on_break' })
      .eq('id', userId);

    if (userError) {
      console.error(userError, `insertIntoBreak Error! userId: ${userId}`);
      return [];
    }

    if (error) {
      console.error(error, `insertIntoBreak Error! userId: ${userId}`);
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
    // First get the user's time entry that has a clock_in_id but no clock_out_id
    const looseClockedInData = await fetchTimeEntryByUserId(supabase, userId);
    if (looseClockedInData.length === 0) {
      return [];
    }
    const { data, error } = await supabase
      .from('breaks')
      .update({ break_end: new Date().toISOString() })
      .eq('entry_id', looseClockedInData[0]?.id)
      .select();

    // Update the user's time_entry_status to 'clocked_in'
    const { data: userData, error: userError } = await supabase
      .from('users')
      .update({ time_entry_status: 'clocked_in' })
      .eq('id', userId);

    if (userError) {
      console.error(userError, `insertIntoBreakEnd Error! userId: ${userId}`);
      return [];
    }

    if (error) {
      console.error(error, `insertIntoBreakEnd Error! userId: ${userId}`);
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
    // First get entry_id from time_entries table by userId
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

    // Then get breaks by entry_ids
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
    const seconds = Math.floor(data / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
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

export const fetchVehicles = cache(async (supabase: SupabaseClient) => {
  const { data, error } = await supabase.from('vehicles').select();
  if (error) {
    console.error(error);
    return [];
  }
  return data as VehicleType[];
});

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
      .select('id, vehicle_status')
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

// create a checkandchangevehiclestatus function
// check all the statuses inside the vehicle_tag table for the given vehicle_id
// if all the statuses are 'closed' then change the vehicle status to 'fine'
// if any of the statuses are 'open' and all their statuses are 'maintenance' then change the vehicle status to 'maintenance'
// if any of the statuses are 'open' and any of their statuses are 'repair' then change the vehicle status to 'broken'

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
      .select()
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
      .select('id, link, scanned_at, location, latitude, longitude')
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

// atv
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
// forklift
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
// truck
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

// Get all vehicle locations
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

// Get vehicle locations by vehicle_id
export const fetchVehicleLocations = cache(
  async (supabase: SupabaseClient, vehicle_id: string) => {
    const { data, error } = await supabase
      .from('vehicle_locations')
      .select()
      .eq('vehicle_id', vehicle_id);
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }
);
// Insert into vehicle locations
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
// insert into vehicle_inventory_location
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

// fetch vehicle inventory location
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

// Check the vehicle_future_location table then if today is the future date or if it has passed copy the future_location to the city column of the  vehicle_location table along with created_at and created_by with the same names for the same vehicle_id vehicles. Then clear the vehicle_future_location table for that vehicle_id

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
    return data;
  }
);
