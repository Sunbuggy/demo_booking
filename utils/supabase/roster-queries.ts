// utils/supabase/queries/roster-queries.ts

export const getRosterData = async (supabase: SupabaseClient, start: string, end: string) => {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id, full_name, user_level,
      // Fetch Shifts
      shifts:schedule_shifts(id, start_time, end_time, position_id)
        .gte('start_time', start)
        .lte('start_time', end),
      
      // Fetch Time Off (Filter out denied in UI or here)
      time_off_requests(id, start_date, end_date, reason, status)
        .or('status.eq.approved,status.eq.pending') 
        .gte('end_date', start) // Overlap logic
        .lte('start_date', end),
        
      // Fetch Availability
      availability:employee_availability_patterns(*)
    `)
    .eq('active', true);
    
  return data;
};