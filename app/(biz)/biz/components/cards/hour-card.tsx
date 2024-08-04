import { Card, CardContent, CardTitle } from '@/components/ui/card';
import React from 'react';
import LocationCard from './location-card';
import { Reservation } from '../../types';
import {
  countPeople,
  getVehicleCount,
  vehiclesList
} from '@/utils/old_db/helpers';
import { Button } from '@/components/ui/button';
import GroupSheet from '../groups/group-sheet';
import CreateGroupWizard from '../groups/create-group-wizard';
import { fetchGroups, fetchGroupVehicles } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/server';
import { PopoverGroups } from '../groups/popover_group';
import AssignGroups from '../groups/assign-groups';
import { PopoverClose } from '@/components/ui/popover';
import { deleteFromGroupVehicles } from '@/utils/old_db/actions';
import DeleteAssigned from '../groups/delete-assigned';
import EditGroups from '../groups/edit-groups';
export interface GroupsType {
  id: string;
  group_name: string;
  created_at: string;
  created_by: string;
  group_date: string;
}
interface GroupType {
  group_name: string;
  group_date: string;
}

export interface GroupVehiclesType {
  id: string;
  quantity: string;
  old_vehicle_name: string;
  old_booking_id: string;
  groups: GroupType | GroupType[]; // groups can be a single object or an array of objects
}

const HourCard = async ({
  hr,
  data,
  display_cost,
  date,
  full_name
}: {
  hr: string;
  data: Record<string, Record<string, Reservation[]>>;
  display_cost: boolean;
  date: string;
  full_name: string;
}) => {
  const dt = new Date(date);
  const supabase = createClient();
  const groups = (await fetchGroups(supabase, dt)) as GroupsType[];
  const groupVehicles = (await fetchGroupVehicles(
    supabase,
    dt
  )) as GroupVehiclesType[];
  const groupHr = hr.split(':')[0];
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

  const reservationsDataInLocation = Object.keys(data[hr]).map(
    (locationKey) => {
      return data[hr][locationKey];
    }
  );
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
    <Card key={hr} className="p-0 w-96 md:min-w-96">
      <CardTitle className="my-3 ml-4 flex gap-3 items-start">
        {hr}{' '}
        <span className="text-base flex gap-3">
          <span className="text-orange-500">
            F-
            {
              // map through the data and get the total count of vehicles by  adding up every location found and return the sum
              Object.keys(data[hr]).reduce((acc, locationKey) => {
                return (
                  acc +
                  data[hr][locationKey].reduce((acc, reservation) => {
                    return acc + getVehicleCount(reservation);
                  }, 0)
                );
              }, 0)
            }
          </span>
          <span className="text-lime-500">
            P-
            {
              // map through the data and get the total count of people by  adding up every location found and return the sum
              Object.keys(data[hr]).reduce((acc, locationKey) => {
                return (
                  acc +
                  data[hr][locationKey].reduce((acc, reservation) => {
                    return acc + countPeople(reservation);
                  }, 0)
                );
              }, 0)
            }
          </span>{' '}
          <span className="text-base font-light italic">
            ({' '}
            {
              // Group and count vehicles for the given data. if same vehicle add count and display vehicle with count ignore if count is 0
              vehiclesList
                .filter((key) => {
                  return Object.keys(data[hr]).some((locationKey) => {
                    return data[hr][locationKey].some(
                      (reservation) =>
                        Number(reservation[key as keyof typeof reservation]) > 0
                    );
                  });
                })
                .map((key) => {
                  const count = Object.keys(data[hr]).reduce(
                    (acc, locationKey) => {
                      return (
                        acc +
                        data[hr][locationKey].reduce((acc, reservation) => {
                          return (
                            acc +
                            Number(reservation[key as keyof typeof reservation])
                          );
                        }, 0)
                      );
                    },
                    0
                  );
                  return `${count}-${key}${count > 1 ? 's' : ''}`;
                })
                .join(', ')
            }
            )
          </span>
          {/* <span>
            <Button variant="link" size="sm" className="p-0 m-0">
              Launch
            </Button>
          </span> */}
        </span>
        {display_cost && (
          <div className="font-light text-sm text-green-600">
            $
            {
              //  Sum of all reservation.total_cost for the given data
              Object.keys(data[hr])
                .reduce((acc, locationKey) => {
                  return (
                    acc +
                    data[hr][locationKey].reduce((acc, reservation) => {
                      return acc + Number(reservation.total_cost);
                    }, 0)
                  );
                }, 0)
                .toFixed(2)
            }
          </div>
        )}
      </CardTitle>
      <div className="ml-5 flex gap-4">
        <span className="flex items-center">Groups:</span>{' '}
        <span className="grid grid-cols-3 justify-center gap-1">
          {filterGroupsByHour(groups, groupHr).map((group) => (
            <span className="text-sm flex" key={group.id}>
              {' '}
              {group.group_name}{' '}
              <div className="flex flex-col justify-start items-start">
                <PopoverGroups openText="edit">
                  <div>
                    <h1>Edit Group {group.group_name}</h1>
                    Already In Group:{' '}
                    <span className="text-xl text-orange-500">
                      {/* Sum of all vehicle's quantities */}
                      {
                        // map through the groupVehicles and filter by group.group_name and group.group_date then return the sum of all quantities
                        filterGroupVehicleByGroupName(group.group_name).reduce(
                          (acc, group) => {
                            return acc + Number(group.quantity);
                          },
                          0
                        )
                      }
                    </span>
                    <div className="grid grid-cols-3 text-xs">
                      {filterGroupVehicleByGroupName(group.group_name).map(
                        (group) => {
                          return (
                            <div key={group.id}>
                              <span className="text-pink-500">
                                {group.old_booking_id}
                              </span>
                              (
                              <span className="text-orange-500">
                                {group.old_vehicle_name}(
                                <span className="text-xs">
                                  {group.quantity}
                                </span>
                                )
                              </span>
                              )
                            </div>
                          );
                        }
                      )}
                    </div>
                    Reservations:
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
                          <div
                            className={isHighlighted ? 'text-orange-500' : ''}
                            key={reservation.res_id}
                          >
                            <p>
                              {reservation.full_name}(
                              <span className="text-xs">
                                <span className="text-pink-500">
                                  {reservation.res_id}
                                </span>
                                ({countVehicles})
                              </span>
                              ){' '}
                              {isHighlighted ? (
                                <PopoverGroups openText="edit">
                                  <EditGroups
                                    countVehicles={countVehicles}
                                    reservation={reservation}
                                    groupVehicles={filterGroupVehicleByGroupName(
                                      group.group_name
                                    )}
                                    group={group}
                                  />
                                </PopoverGroups>
                              ) : (
                                <PopoverGroups openText={'+Add'}>
                                  <AssignGroups
                                    reservation={reservation}
                                    countVehicles={countVehicles}
                                    group_id={group.id}
                                  />
                                </PopoverGroups>
                              )}
                              {isHighlighted && (
                                <PopoverGroups openText="delete">
                                  <DeleteAssigned
                                    countVehicles={countVehicles}
                                    groupVehicles={filterGroupVehicleByGroupName(
                                      group.group_name
                                    )}
                                    group={group}
                                    reservation={reservation}
                                  />
                                </PopoverGroups>
                              )}
                            </p>
                          </div>
                        );
                      });
                    })}
                  </div>
                </PopoverGroups>
                <Button
                  size={'icon'}
                  variant={'ghost'}
                  className="text-xs p-1 h-[1em]"
                >
                  launch
                </Button>
              </div>
            </span>
          ))}
          <GroupSheet
            trigger="+Add"
            hr={groupHr}
            CreateGroupWizard={
              <CreateGroupWizard
                hour={groupHr}
                group_date={date}
                full_name={full_name}
              />
            }
          />
        </span>
      </div>
      <CardContent className="flex flex-col gap-5 p-3">
        {Object.keys(data[hr]).map((locationKey) => {
          return (
            <LocationCard
              key={locationKey}
              id={hr}
              data={data}
              locationKey={locationKey}
              display_cost={display_cost}
            />
          );
        })}
      </CardContent>
    </Card>
  );
};

export default HourCard;
