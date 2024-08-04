'use client';
import { Button } from '@/components/ui/button';
import React from 'react';
import { Reservation } from '../../types';
import { insertIntoGroupVehicles } from '@/utils/old_db/actions';
import { useToast } from '@/components/ui/use-toast';

interface SelectedVehicles {
  vehName: string;
  count: number;
  res_id: string;
  group_id: string;
}

const AssignGroups = ({
  reservation,
  countVehicles,
  group_id,
  edit
}: {
  reservation: Reservation;
  countVehicles: string;
  group_id: string;
  edit?: boolean;
}) => {
  // State variable to count each vehicle name with its count
  const [vehicleCount, setVehicleCount] = React.useState<{
    [key: string]: { count: number; res_id: string; group_id: string };
  }>({});
  const [selectedVehicles, setSelectedVehicles] = React.useState<
    SelectedVehicles[]
  >([]);
  const { toast } = useToast();

  React.useEffect(() => {
    selectedVehicles.forEach((veh) => {
      insertIntoGroupVehicles(
        veh.group_id,
        Number(veh.res_id),
        veh.vehName,
        veh.count
      ).then((res) => {
        res.error
          ? toast({
              title: 'Error',
              description: res.error as string,
              duration: 4000,
              variant: 'destructive'
            })
          : toast({
              title: 'Fleet Inserted!',
              description: `Added ${veh.count} ${veh.vehName} to group`,
              duration: 2000,
              variant: 'success'
            });
      });
    });
  }, [selectedVehicles]);

  function onConfirm() {
    const selectedVehicles = Object.entries(vehicleCount)
      .filter(([_, { count }]) => count > 0)
      .map(([vehName, { count, res_id }]) => ({
        vehName,
        count,
        res_id,
        group_id
      }));
    setSelectedVehicles(selectedVehicles);
  }

  function handleInputChange(
    vehName: string,
    count: number,
    res_id: string,
    group_id: string
  ) {
    setVehicleCount((prev) => ({
      ...prev,
      [vehName]: { count, res_id, group_id }
    }));
  }

  return (
    <div className="flex flex-col gap-3">
      <h1>
        From <span className="text-pink-500">{reservation.res_id}</span> How
        many out of <u className=" text-violet-600 underline">Max</u> to add to
        the group
      </h1>
      <div className="flex flex-col gap-3">
        {countVehicles.split(',').map((veh, idx) => {
          const vehName = veh.split('-')[1];
          const vehCount = veh.split('-')[0];
          return (
            <div className="flex gap-2" key={idx}>
              <div>
                <span className="text-orange-500">{vehName}</span> /{' '}
                <u className="text-xl text-violet-600 underline">{vehCount}</u>{' '}
              </div>
              <input
                type="number"
                max={vehCount}
                placeholder={`Max allowed ${vehCount}`}
                onChange={(e) =>
                  handleInputChange(
                    vehName,
                    Number(e.target.value),
                    String(reservation.res_id),
                    group_id
                  )
                }
              />
            </div>
          );
        })}
      </div>
      <Button onClick={onConfirm}>Add To Group</Button>
    </div>
  );
};

export default AssignGroups;
