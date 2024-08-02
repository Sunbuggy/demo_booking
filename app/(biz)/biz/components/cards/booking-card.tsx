import { Card, CardContent, CardTitle } from '@/components/ui/card';
import React from 'react';
import { Reservation } from '../../types';
import GroupSheet from '../groups/group-sheet';
import {
  fetchGroupNames,
  fetchGroups,
  fetchGroupVehicles
} from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/server';
import ExistingGroupsWizard from '../groups/existing-groups-wizard';
import CreateGroupWizard from '../groups/create-group-wizard';

export type Groups = {
  created_by: string;
  group_date: string;
  group_name: string;
};
export type GroupNamesType = {
  groups: any;
}[];

const BookingCard = async ({
  reservation,
  vehiclesList,
  display_cost
}: {
  reservation: Reservation;
  vehiclesList: string[];
  display_cost: boolean;
}) => {
  const supabase = createClient();
  const groups = (await fetchGroups(
    supabase,
    reservation.sch_date
  )) as Groups[];
  const groupVehicles = await fetchGroupVehicles(
    supabase,
    reservation.sch_date
  );

  const groupNamesObj = (await fetchGroupNames(
    supabase,
    reservation.res_id
  )) as GroupNamesType;
  console.log('groupNames', groupNamesObj); //groupNames [ { groups: { group_name: '9A' } } ]
  const groupNames = groupNamesObj.map((gn) => gn.groups.group_name);
  console.log('groupNames', groupNames);
  return (
    <Card
      key={reservation.res_id}
      className={` rounded-md border-l-0 border-t-0 pl-3 py-2 shadow-none ${reservation.is_special_event ? 'text-green-600 dark:text-green-500' : ''}`}
    >
      <CardTitle className="text-base flex gap-2">
        <i>
          <u className=" font-extralight text-sm">{reservation.res_id}</u>
        </i>{' '}
        <strong>{reservation.full_name}</strong> {/* Total Cost */}
        {display_cost && (
          <i className="text-green-600"> ${reservation.total_cost}</i>
        )}
      </CardTitle>
      <CardContent className="p-0">
        <div className="flex gap-2">
          <p>
            {reservation.occasion?.toLowerCase().slice(0, 12) || 'occasion'}
          </p>
          <p>
            {reservation.hotel?.toLocaleLowerCase() === 'drive here' ? (
              <span className="text-gray-600 dark:text-red-300">
                {reservation.hotel?.toLowerCase()}
              </span>
            ) : (
              reservation.hotel?.toLowerCase().slice(0, 12)
            )}
          </p>
          <p className=" text-sm text-lime-200 flex items-end">
            P-{reservation.ppl_count}
          </p>
        </div>
        <div className="flex gap-2 text-sm ">
          {/* Vehicles */}
          {vehiclesList
            .filter(
              (key) => Number(reservation[key as keyof typeof reservation]) > 0
            )
            .map((key) => {
              const count = Number(
                reservation[key as keyof typeof reservation]
              );
              // make a key value object of count and key
              const fleet = { [key]: count };
              return (
                <>
                  <p className="italic font-thin text-orange-200" key={key}>
                    {count}-{key}
                    {count > 1 ? 's' : ''}
                  </p>
                  <div key={`GR-${key}`} className="flex gap-2 ">
                    <GroupSheet
                      assignedGroups={groupNames}
                      res_id={reservation.res_id}
                      name={String(reservation.full_name)}
                      ExistingGroupsWizard={
                        <ExistingGroupsWizard
                          groups={groups}
                          fleet={fleet}
                          groupVehicles={groupVehicles}
                          hour={Number(reservation.sch_time?.split(':')[0])}
                          res_id={reservation.res_id}
                        />
                      }
                      CreateGroupWizard={
                        <CreateGroupWizard
                          groups={groups}
                          groupVehicles={groupVehicles}
                          fleet={fleet}
                          hour={Number(reservation.sch_time?.split(':')[0])}
                        />
                      }
                    />
                  </div>
                </>
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingCard;

// TODO: Create Group, Assign Shuttle, Show $, create calendar, people counter for the day, vehicle counter for the day
