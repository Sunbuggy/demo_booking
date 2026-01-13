import { createClient } from '@/utils/supabase/server';
import { fetchGroups, fetchGroupVehicles } from '@/utils/supabase/queries';
import { GroupsType, GroupVehiclesType } from '../../../types';

export interface GroupsData {
  groups: GroupsType[];
  groupVehicles: GroupVehiclesType[];
  guides: { id: string; full_name: string }[];
  timings: any[];
}

export async function fetchDailyGroupsData(date: string): Promise<GroupsData> {
  const supabase = await createClient();
  const dt = new Date(date);

  // 1. Fetch Core Group Data
  const groupsPromise = fetchGroups(supabase, dt) as Promise<GroupsType[]>;
  const vehiclesPromise = fetchGroupVehicles(supabase, dt) as Promise<GroupVehiclesType[]>;

  // 2. Fetch Guides (Logic extracted from MainGroups)
  const guidesPromise = supabase
    .from('employee_schedules')
    .select('user_id, role, users(full_name, department)')
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
          full_name: s.users?.full_name || 'Restricted User'
        }))
        // Unique guides only
        .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
    });

  // Execute Initial Parallel Fetch
  const [groups, groupVehicles, guides] = await Promise.all([
    groupsPromise,
    vehiclesPromise,
    guidesPromise
  ]);

  // 3. Fetch Timings (Dependent on groups existing)
  let timings: any[] = [];
  if (groups && groups.length > 0) {
    const groupIds = groups.map(g => g.id);
    const { data } = await supabase
      .from('group_timings')
      .select('group_id, launched_at, landed_at')
      .in('group_id', groupIds);
    timings = data || [];
  }

  return {
    groups: groups || [],
    groupVehicles: groupVehicles || [],
    guides,
    timings
  };
}