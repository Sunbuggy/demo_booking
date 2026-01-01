import React from 'react';
import { GroupsType, GroupVehiclesType, Reservation } from '../../../types';
import { vehiclesList } from '@/utils/old_db/helpers';
import { createClient } from '@/utils/supabase/server';
import { fetchGroups, fetchGroupVehicles } from '@/utils/supabase/queries';
import ReservationsList from './reservations-list';
import { DisplayGroupsInHourCard, DisplayExistingGroups } from './display-existing-groups';
import { PopoverGroupEdit } from './popover_group_edit';
import LaunchGroup from './launch-group';
import GroupPics from '../pictures/group-pics';

// --- TYPE DEFINITIONS ---
interface GroupTiming {
  group_id: string;
  launched_at: string | null;
  landed_at: string | null;
}

// --- HELPER: Fetch Scheduled Guides ---
async function fetchScheduledGuides(supabase: any, date: string) {
  const { data: schedules } = await supabase
    .from('employee_schedules')
    .select('user_id, role, users(full_name, department)')
    .gte('start_time', `${date}T00:00:00`)
    .lte('start_time', `${date}T23:59:59`);

  if (!schedules) return [];

  return schedules
    .filter((s: any) => {
        // SAFEGUARD 1: Check if 's.users' exists before asking for department
        const dept = s.users?.department?.toLowerCase() || '';
        const role = s.role?.toLowerCase() || '';
        return dept.includes('dunes') || role.includes('guide') || dept.includes('guides');
    })
    .map((s: any) => ({
      id: s.user_id,
      // SAFEGUARD 2: The actual fix for your error.
      // If s.users is null, use a placeholder name instead of crashing.
      full_name: s.users?.full_name || 'Restricted User' 
    }))
    .filter((v: any, i: any, a: any) => a.findIndex((t: any) => (t.id === v.id)) === i);
}
// --- HELPER: Fetch Timings from New Table ---
async function fetchGroupTimings(supabase: any, groupIds: string[]) {
  if (groupIds.length === 0) return [];
  
  const { data } = await supabase
    .from('group_timings')
    .select('group_id, launched_at, landed_at')
    .in('group_id', groupIds);
    
  return data || [];
}

const MainGroups = async ({
  groupHr,
  reservationsDataInLocation,
  date
}: {
  groupHr: string;
  reservationsDataInLocation: Reservation[][];
  date: string;
}) => {
  const dt = new Date(date);
  const supabase = await createClient(); // Await the client creation if strictly server components
  
  // 1. Fetch Legacy Data & Guides
  const [groups, groupVehicles, guides] = await Promise.all([
     fetchGroups(await supabase, dt) as Promise<GroupsType[]>,
     fetchGroupVehicles(await supabase, dt) as Promise<GroupVehiclesType[]>,
     fetchScheduledGuides(await supabase, date)
  ]);

  // 2. Fetch New Timings Data for these groups
  const groupIds = groups.map(g => g.id);
  const timings = await fetchGroupTimings(await supabase, groupIds);

  // 3. Merge Data: Create a map for fast lookup
  // FIX: Explicitly type the Map so TypeScript knows values are GroupTiming objects
  const timingsMap = new Map<string, GroupTiming>(
    timings.map((t: any) => [t.group_id, t])
  );

  function filterGroupsByHour(groups: GroupsType[], hr: string) {
    const targetHour = hr.split(':')[0];
    return groups.filter((group) => {
      const groupHour = group.group_name.match(/^(\d+)/)?.[1];
      return groupHour && parseInt(groupHour) === parseInt(targetHour);
    });
  }

  function filterGroupVehicleByGroupName(groupName: string) {
    return groupVehicles.filter((group) => {
      if (group.groups === null) return false;
      if (Array.isArray(group.groups)) {
        return group.groups
          .map((group) => group.group_name)
          .includes(groupName);
      } else {
        return group.groups.group_name === groupName;
      }
    });
  }

  const isVehicleInGroup = (
    groupName: string,
    resNo: string,
    vehicleName: string
  ): boolean => {
    const result = filterGroupVehicleByGroupName(groupName).some((group) => {
      if (Number(group.old_booking_id) === Number(resNo)) {
        if (vehicleName === group.old_vehicle_name) {
          return true;
        }
      }
    });
    return result;
  };

  return (
    <div className="flex flex-col w-full gap-1">
      {filterGroupsByHour(groups, groupHr)
        .sort((a, b) => {
          const getSortKey = (name: string) => {
            const match = name.match(/^(\d+)([A-Za-z]*)(\d*)/);
            if (!match) return name;
            const [, num, alpha, numSuffix] = match;
            return [
              num.padStart(2, '0'),
              alpha || '',
              numSuffix || '0'
            ].join('-');
          };
          return getSortKey(a.group_name).localeCompare(getSortKey(b.group_name));
        })
        .map((group) => {
          const groupQty = filterGroupVehicleByGroupName(group.group_name)
            .reduce((acc, group) => acc + Number(group.quantity), 0);

          const nameFilteredGroups = filterGroupVehicleByGroupName(group.group_name);
          const groupName = group.group_name;
          const groupId = group.id;
          const lead = group.lead;
          const sweep = group.sweep;
          
          // MERGE: Get timing data for this group
          // FIX: This now returns GroupTiming | undefined, so properties are safe to access
          const timingData = timingsMap.get(groupId);
          const launchedAt = timingData?.launched_at || null;
          const landedAt = timingData?.landed_at || null;

          return (
            <div 
              key={group.id} 
              className="w-full flex items-center justify-between bg-slate-900/30 border border-slate-800 rounded px-2 py-0.5 min-h-[28px]"
            >
              <div className="flex items-center h-full pt-0.5">
                <PopoverGroupEdit
                  openText={
                    <DisplayGroupsInHourCard
                      groupName={groupName}
                      groupQty={groupQty}
                      nameFilteredGroups={nameFilteredGroups}
                      lead={group.lead}
                      sweep={group.sweep}
                    />
                  }
                >
                  <div>
                    <DisplayExistingGroups
                      groupId={groupId}
                      groupName={groupName}
                      groupQty={groupQty}
                      nameFilteredGroups={nameFilteredGroups}
                      lead={lead}
                      sweep={sweep}
                      availableGuides={guides}
                    />
                    <h1 className="text-center text-xl text-pink-500 m-3">
                      Reservations
                    </h1>
                     {reservationsDataInLocation.map((reservations) => {
                      let isHighlighted = false;
                      return reservations.map((reservation) => {
                        const countVehicles = vehiclesList
                          .filter(
                            (key) => Number(reservation[key as keyof typeof reservation]) > 0
                          )
                          .map((key) => {
                            const count = Number(reservation[key as keyof typeof reservation]);
                            isHighlighted = isVehicleInGroup(
                              group.group_name,
                              String(reservation.res_id),
                              key
                            );
                            return `${count}-${key}`;
                          })
                          .join(', ');

                        return (
                          <ReservationsList
                            countVehicles={countVehicles}
                            group={group}
                            isHighlighted={isHighlighted}
                            key={reservation.res_id}
                            nameFilteredGroups={nameFilteredGroups}
                            reservation={reservation}
                          />
                        );
                      });
                    })}
                  </div>
                </PopoverGroupEdit>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <GroupPics groupName={group.group_name} />
                
                {/* NEW LAUNCH COMPONENT USING SUPABASE TABLE DATA */}
                <LaunchGroup
                  groupId={groupId}
                  launchedAt={launchedAt} 
                  landedAt={landedAt}
                  groupName={groupName}
                />
              </div>
            </div>
          );
        })}
    </div>
  );
};

export default MainGroups;