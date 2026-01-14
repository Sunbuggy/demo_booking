/**
 * ACTION: Get Timesheets
 * Path: app/actions/get-timesheets.ts
 * Description: Fetches time entries for the payroll grid, including GPS and Photos.
 */

'use server';

import { createClient } from '@/utils/supabase/server';
import { addDays, format } from 'date-fns';

export type TimeEntry = {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  status: string;
  location: string | null;
  // --- NEW FIELDS REQUIRED FOR MAP ---
  clock_in_lat?: number;
  clock_in_lon?: number;
  clock_out_lat?: number;
  clock_out_lon?: number;
  // -----------------------------------
  clock_in_photo_url: string | null;
  clock_out_photo_url: string | null;
  audit_trail: any[];
};

export async function getTimesheets(userIds: string[], startDate: string, endDate: string) {
  const supabase = await createClient();

  // Extend end date by 1 day to ensure we get the full range
  // (e.g. if endDate is "2026-01-14", we want everything before "2026-01-15")
  const queryEnd = format(addDays(new Date(endDate), 1), 'yyyy-MM-dd');

  const { data, error } = await supabase
    .from('time_entries')
    .select(`
      id,
      user_id,
      start_time,
      end_time,
      status,
      location,
      clock_in_lat,
      clock_in_lon,
      clock_out_lat,
      clock_out_lon,
      clock_in_photo_url,
      clock_out_photo_url,
      audit_trail
    `)
    .in('user_id', userIds)
    .gte('start_time', startDate)
    .lt('start_time', queryEnd)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching timesheets:', error);
    return [];
  }

  return data as TimeEntry[];
}