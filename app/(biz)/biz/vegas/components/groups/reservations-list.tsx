'use client';
import React from 'react';
import { PopoverGroups } from './popover_group';
import EditGroups from './update-groups';
import AssignGroups from './assign-groups';
import DeleteAssigned from './delete-assigned';
import { GroupsType, GroupVehiclesType, Reservation } from '../../../types';

const ReservationsList = ({
  isHighlighted,
  reservation,
  countVehicles,
  nameFilteredGroups,
  group
}: {
  isHighlighted: boolean;
  reservation: Reservation;
  countVehicles: string;
  nameFilteredGroups: GroupVehiclesType[];
  group: GroupsType;
}) => {
  return (
    <div
      className={isHighlighted ? 'text-orange-500' : ''}
      key={reservation.res_id}
    >
      <p>
        {reservation.full_name}(
        <span className="text-xs">
          <span className="text-pink-500">{reservation.res_id}</span>(
          {countVehicles})
        </span>
        ){' '}
        {isHighlighted ? (
          <PopoverGroups openText="edit">
            <EditGroups
              countVehicles={countVehicles}
              reservation={reservation}
              groupVehicles={nameFilteredGroups}
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
              groupVehicles={nameFilteredGroups}
              group={group}
              reservation={reservation}
            />
          </PopoverGroups>
        )}
      </p>
    </div>
  );
};

export default ReservationsList;
