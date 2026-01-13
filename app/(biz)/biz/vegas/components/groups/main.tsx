import React from 'react';
import { GroupsType, GroupVehiclesType, Reservation } from '../../../types';
import { vehiclesList } from '@/utils/old_db/helpers';
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

// NEW INTERFACE: It now expects data as props
interface MainGroupsProps {
  groupHr: string;
  reservationsDataInLocation: Reservation[][];
  date: string;
  // New Data Props
  groups: GroupsType[];
  groupVehicles: GroupVehiclesType[];
  guides: { id: string; full_name: string }[];
  timings: any[];
}

// NOTE: No longer async!
const MainGroups = ({
  groupHr,
  reservationsDataInLocation,
  date,
  groups,
  groupVehicles,
  guides,
  timings
}: MainGroupsProps) => {
  
  // 1. Merge Data: Create a map for fast lookup
  const timingsMap = new Map<string, GroupTiming>(
    timings.map((t: any) => [t.group_id, t])
  );

  function filterGroupsByHour(groupsList: GroupsType[], hr: string) {
    const targetHour = hr.split(':')[0];
    return groupsList.filter((group) => {
      const groupHour = group.group_name.match(/^(\d+)/)?.[1];
      return groupHour && parseInt(groupHour) === parseInt(targetHour);
    });
  }

  function filterGroupVehicleByGroupName(groupName: string) {
    return groupVehicles.filter((group) => {
      if (group.groups === null) return false;
      if (Array.isArray(group.groups)) {
        return group.groups
          .map((g) => g.group_name)
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
          
          const timingData = timingsMap.get(groupId);
          const launchedAt = timingData?.launched_at || null;
          const landedAt = timingData?.landed_at || null;

          return (
            <div 
              key={group.id} 
              // SEMANTIC THEME UPDATE: bg-card/muted instead of slate-900
              className="w-full flex items-center justify-between bg-muted/40 border border-border rounded px-2 py-0.5 min-h-[28px]"
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
                    <h1 className="text-center text-xl text-pink-600 dark:text-pink-500 m-3">
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