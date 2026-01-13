import { createClient } from '@/utils/supabase/server';
import { fetchGroups } from '@/utils/supabase/queries';
import { GroupsType, GroupVehiclesType } from '../../../types';

export interface GroupsData {
  groups: any[]; 
  groupVehicles: GroupVehiclesType[];
  guides: { id: string; full_name: string; stage_name?: string }[];
  timings: any[];
}

export async function fetchDailyGroupsData(date: string): Promise<GroupsData> {
  const supabase = await createClient();
  const dt = new Date(date);

  // ---------------------------------------------------------
  // STEP 1: DEFINE ALL PROMISES (Parallel Execution)
  // ---------------------------------------------------------

  // A) Fetch Groups (Parent Records)
  const groupsPromise = fetchGroups(supabase, dt) as Promise<GroupsType[]>;

  // B) Fetch Working Guides (ALWAYS REQUIRED for the Dropdowns)
  // We must fetch this even if there are 0 groups, otherwise the "Create Group" dialog is empty.
  const guidesPromise = supabase
    .from('employee_schedules')
    .select('user_id, role, users(id, full_name, stage_name, department)')
    .gte('start_time', `${date}T00:00:00`)
    .lte('start_time', `${date}T23:59:59`)
    .then(({ data }) => {
      if (!data) return [];
      return data
        .filter((s: any) => {
          const dept = s.users?.department?.toLowerCase() || '';
          const role = s.role?.toLowerCase() || '';
          return dept.includes('dunes') || role.includes('guide') || dept.includes('guides');
        })
        .map((s: any) => ({
          id: s.user_id,
          // Prioritize Stage Name, fallback to Full Name
          full_name: s.users?.stage_name || s.users?.full_name || 'Restricted User',
        }))
        // Remove duplicates (e.g. split shifts)
        .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
    });

  // C) Fetch All Users (For resolving names of leads/sweeps who might not be on schedule)
  const allUsersPromise = supabase
    .from('users')
    .select('id, full_name, stage_name');

  // ---------------------------------------------------------
  // STEP 2: AWAIT CORE DATA
  // ---------------------------------------------------------
  // We await groups first to see if we need to fetch vehicles
  const [groupsRaw, guides, allUsersResult] = await Promise.all([
    groupsPromise,
    guidesPromise,
    allUsersPromise
  ]);

  const allUsers = allUsersResult.data || [];

  // If no groups exist, we still return the GUIDES so the user can create one.
  if (!groupsRaw || groupsRaw.length === 0) {
    return { 
      groups: [], 
      groupVehicles: [], 
      guides: guides || [], // <--- CRITICAL FIX: Return the guides!
      timings: [] 
    };
  }

  // ---------------------------------------------------------
  // STEP 3: FETCH DEPENDENCIES (Vehicles & Timings)
  // ---------------------------------------------------------
  // Only fetch these if we actually have groups to look up
  const groupIds = groupsRaw.map(g => g.id);

  const [vehiclesResult, timingsResult] = await Promise.all([
    supabase
      .from('group_vehicles')
      .select('group_id, quantity, old_vehicle_name, old_booking_id')
      .in('group_id', groupIds),
    supabase
      .from('group_timings')
      .select('group_id, launched_at, landed_at')
      .in('group_id', groupIds)
  ]);

  const allVehicles = (vehiclesResult.data || []) as GroupVehiclesType[];
  const timings = timingsResult.data || [];

  // ---------------------------------------------------------
  // STEP 4: DATA STITCHING
  // ---------------------------------------------------------
  const enrichedGroups = groupsRaw.map(group => {
    // 1. Resolve Names
    const leadUser = allUsers.find(u => u.id === group.lead);
    const sweepUser = allUsers.find(u => u.id === group.sweep);

    // 2. Attach Vehicles
    const myVehicles = allVehicles.filter(v => v.group_id === group.id);
    
    // 3. Calculate Total Pax
    const totalCount = myVehicles.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0);

    return {
      ...group,
      // Readable Names
      lead: leadUser ? (leadUser.stage_name || leadUser.full_name) : null,
      sweep: sweepUser ? (sweepUser.stage_name || sweepUser.full_name) : null,
      
      // Nested Data
      group_vehicles: myVehicles, 
      total_pax: totalCount,

      // Keep IDs
      lead_id: group.lead,
      sweep_id: group.sweep
    };
  });

  return {
    groups: enrichedGroups,
    groupVehicles: allVehicles,
    guides: guides || [],
    timings
  };
}