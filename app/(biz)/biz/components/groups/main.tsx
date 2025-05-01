import React from 'react';
import { Button } from '@/components/ui/button';
import { GroupsType, GroupVehiclesType, Reservation } from '../../types';
import { vehiclesList } from '@/utils/old_db/helpers';
import { createClient } from '@/utils/supabase/server';
import { fetchGroups, fetchGroupVehicles } from '@/utils/supabase/queries';
import ReservationsList from './reservations-list';
import {DisplayGroupsInHourCard, DisplayExistingGroups} from './display-existing-groups';
import { PopoverGroupEdit } from './popover_group_edit';
import { launchGroup } from '@/utils/old_db/actions';
import LaunchGroup from './launch-group';
import PicForm from '../pictures/pic-upload-form';
import GroupPics from '../pictures/group-pics';
import dynamic from 'next/dynamic';

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
  const groups = (await fetchGroups(supabase, dt)) as GroupsType[];
  const groupVehicles = (await fetchGroupVehicles(
    supabase,
    dt
  )) as GroupVehiclesType[];

  function filterGroupsByHour(groups: GroupsType[], hr: string) {
    return groups.filter((group) => group.group_name.includes(hr));
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
    <div className="">
      <span className="flex items-start text-cyan-500">Groups:</span>{' '}
      <span className="flex flex-row">
        {filterGroupsByHour(groups, groupHr)
          .sort((a, b) => {
            return a.group_name.localeCompare(b.group_name);
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
            const launched = group.launched;

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
                    launched={group.launch_time || null}
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