'use client';
import { Button } from '@/components/ui/button';
import React from 'react';
import { Reservation } from '../../types';

const AssignGroups = ({
  reservation,
  countVehicles,
  group_id
}: {
  reservation: Reservation;
  countVehicles: string;
  group_id: string;
}) => {
  // State variable to count each vehicle name with its count
  const [vehicleCount, setVehicleCount] = React.useState({});
  function onConfirm() {
    setVehicleCount(vehicleCount);
  }
  return (
    <div className="flex flex-col gap-3">
      <h1>
        From {reservation.res_id} How many out of{' '}
        <u className=" text-pink-600 underline">Max</u> to add to the group
      </h1>
      <div>
        {countVehicles.split(',').map((veh) => {
          const vehName = veh.split('-')[1];
          const vehCount = veh.split('-')[0];
          return (
            <div className="flex flex-col gap-2">
              <div>
                {vehName} /{' '}
                <u className="text-xl text-pink-600 underline">{vehCount}</u>{' '}
              </div>
              <input type="number" />
            </div>
          );
        })}
      </div>
      <Button>Confirm</Button>
    </div>
  );
};

export default AssignGroups;
