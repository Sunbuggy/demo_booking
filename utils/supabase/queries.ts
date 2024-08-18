import { SupabaseClient } from '@supabase/supabase-js';
import { equal } from 'assert';
import { cache } from 'react';

// Utility function to get the current date and time in PST

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

export const getAllUsers = cache(async (supabase: SupabaseClient) => {
  const { data, error } = await supabase.from('users').select();
  if (error) {
    console.error(error);
    return [];
  }
  // console.log(data.length);
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
    totalClockinHours: number
  ) => {
    const looseClockedInData = await fetchTimeEntryByUserId(supabase, userId);
    // First insert into clock_out table clock_out_time, lat, long
    const { data, error } = await supabase
      .from('clock_out')
      .insert([
        {
          clock_out_time: new Date().toISOString(),
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
      .eq('id', looseClockedInData[0]?.id);

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
    return timeEntryData;
  }
);
