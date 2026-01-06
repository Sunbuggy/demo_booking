'use server';

import { createClient } from '@/utils/supabase/server';
import { addDays, format } from 'date-fns';

// 1. Define Type based on YOUR ACTUAL SCHEMA
export type TimeEntry = {
  id: string;
  user_id: string;
  start_time: string;           // DB: start_time
  end_time: string | null;      // DB: end_time
  location: string | null;
  clock_in_photo_url: string | null;  // DB: clock_in_photo_url
  clock_out_photo_url: string | null; // DB: clock_out_photo_url
  status: 'PENDING' | 'APPROVED' | 'FLAGGED' | string;
};

export async function getTimesheets(userIds: string[], startDate: string, endDate: string) {
  const supabase = await createClient();

  if (userIds.length === 0) return [];

  // Query range: start_time >= startDate AND start_time < (endDate + 1 day)
  const queryEnd = format(addDays(new Date(endDate), 1), 'yyyy-MM-dd');

  const { data, error } = await supabase
    .from('time_entries')
    .select(`
      id,
      user_id,
      start_time,
      end_time,
      location,
      status,
      clock_in_photo_url,
      clock_out_photo_url
    `)
    .in('user_id', userIds)
    .gte('start_time', startDate)
    .lt('start_time', queryEnd)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Supabase Error fetching timesheets:', error);
    return [];
  }

  return data as TimeEntry[];
}