import React from 'react';
import { GroupsType, GroupVehiclesType, Reservation } from '../../types';
import { vehiclesList } from '@/utils/old_db/helpers';
import { createClient } from '@/utils/supabase/server';
import { fetchGroups, fetchGroupVehicles } from '@/utils/supabase/queries';
import ReservationsList from './reservations-list';
import {DisplayGroupsInHourCard, DisplayExistingGroups} from './display-existing-groups';
import { PopoverGroupEdit } from './popover_group_edit';
import LaunchGroup from './launch-group';
import GroupPics from '../pictures/group-pics';

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
  const supabase = createClient();
  const groups = (await fetchGroups(await supabase, dt)) as GroupsType[];
  const groupVehicles = (await fetchGroupVehicles(
    await supabase,
    dt
  )) as GroupVehiclesType[];

  function filterGroupsByHour(groups: GroupsType[], hr: string) {
    // Extract just the hour part (remove minutes if present)
    const targetHour = hr.split(':')[0];
    
    return groups.filter((group) => {
      // Extract the numeric part from group name (e.g., "08" from "08A" or "8" from "8A")
      const groupHour = group.group_name.match(/^(\d+)/)?.[1];
      
      // Compare the numeric values (this handles both "08" and "8" cases)
      return groupHour && parseInt(groupHour) === parseInt(targetHour);
    });
  }

  function filterGroupVehicleByGroupName(groupName: string) {
    return groupVehicles.filter((group) => {
      if (group.groups === null) {
        return false;
      }
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
    <div className="ml-2 flex max-w-5xl">
      <span className="flex items-start text-cyan-500">Groups:</span>{' '}
      <span className="flex flex-wrap flex-row">
        {filterGroupsByHour(groups, groupHr)
          .sort((a, b) => {
            // Sort by the numeric part first, then by letter/number
            const getSortKey = (name: string) => {
              const match = name.match(/^(\d+)([A-Za-z]*)(\d*)/);
              if (!match) return name;
              const [, num, alpha, numSuffix] = match;
              return [
                num.padStart(2, '0'),  // Pad numbers for proper sorting
                alpha || '',            // Handle empty alpha
                numSuffix || '0'        // Handle empty suffix
              ].join('-');
            };
            return getSortKey(a.group_name).localeCompare(getSortKey(b.group_name));
          })
          .map((group) => {
            const groupQty = filterGroupVehicleByGroupName(
              group.group_name
            ).reduce((acc, group) => {
              return acc + Number(group.quantity);
            }, 0);

            const nameFilteredGroups = filterGroupVehicleByGroupName(
              group.group_name
            );
            const groupName = group.group_name;
            const groupId = group.id;
            const lead = group.lead;
            const sweep = group.sweep;

            return (
              <span className="text-sm mb-2" key={group.id}>
                <div className="flex justify-start items-start">
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
                      />
                      <h1 className="text-center text-xl text-pink-500 m-3">
                        Reservations
                      </h1>
                      {reservationsDataInLocation.map((reservations) => {
                        let isHighlighted = false;
                        return reservations.map((reservation) => {
                          const countVehicles = vehiclesList
                            .filter(
                              (key) =>
                                Number(
                                  reservation[key as keyof typeof reservation]
                                ) > 0
                            )
                            .map((key) => {
                              const count = Number(
                                reservation[key as keyof typeof reservation]
                              );
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
                  <GroupPics groupName={group.group_name} />
                  <LaunchGroup
                    groupId={groupId}
                    launched={group.launched}
                    groupName={groupName}
                  />
                </div>
              </span>
            );
          })}
      </span>
    </div>
  );
};

export default MainGroups;