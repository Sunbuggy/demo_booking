'use client';
import { Button } from '@/components/ui/button';
import React from 'react';
import { GroupsType, GroupVehiclesType, Reservation } from '../../types';
import { useToast } from '@/components/ui/use-toast';
import { updateGroupVehicleQuantity } from '@/utils/old_db/actions';

interface SelectedVehicles {
  vehName: string;
  count: number;
}

const EditGroups = ({
  reservation,
  countVehicles,
  groupVehicles,
  group
}: {
  reservation: Reservation;
  countVehicles: string;
  groupVehicles: GroupVehiclesType[];
  group: GroupsType;
}) => {
  // State variable to count each vehicle name with its count
  const [vehicleCount, setVehicleCount] = React.useState<{
    [key: string]: { count: number };
  }>({});
  const [selectedVehicles, setSelectedVehicles] = React.useState<
    SelectedVehicles[]
  >([]);
  const { toast } = useToast();

  React.useEffect(() => {
    function getGroupVehicleId(
      groupName: string,
      resNo: string,
      vehicleName: string,
      quantity: number
    ): string | undefined {
      const group = groupVehicles.find((group) => {
        if (group.groups === null) {
          console.log('empty group');
          return false;
        }

        if (Array.isArray(group.groups)) {
          const groupNames = group.groups.map((group) => group.group_name);
          const includesGroupName = groupNames.includes(groupName);
          const matchesResNo = Number(group.old_booking_id) === Number(resNo);
          const matchesVehicleName = group.old_vehicle_name === vehicleName;
          // const matchesQuantity = Number(group.quantity) === quantity;

          // console.log({
          //   groupNames,
          //   includesGroupName,
          //   matchesResNo,
          //   matchesVehicleName,
          //   matchesQuantity
          // });

          return (
            includesGroupName && matchesResNo && matchesVehicleName
            // &&
            // matchesQuantity
          );
        } else {
          const matchesGroupName = group.groups.group_name === groupName;
          const matchesResNo = Number(group.old_booking_id) === Number(resNo);
          const matchesVehicleName = group.old_vehicle_name === vehicleName;
          // const matchesQuantity = Number(group.quantity) === quantity;

          // console.log({
          //   matchesGroupName,
          //   matchesResNo,
          //   matchesVehicleName,
          //   matchesQuantity
          // });

          return (
            matchesGroupName && matchesResNo && matchesVehicleName
            // && matchesQuantity
          );
        }
      });
      return group ? group.id : undefined;
    }

    const group_id = getGroupVehicleId(
      group.group_name,
      String(reservation.res_id),
      countVehicles.split('-')[1],
      Number(countVehicles.split('-')[0])
    );
    selectedVehicles.forEach((veh) => {
      updateGroupVehicleQuantity(String(group_id), veh.count).then((res) => {
        res.error
          ? toast({
              title: 'Error',
              description: 'Error updating group',
              duration: 4000,
              variant: 'destructive'
            })
          : toast({
              title: 'Fleet Updated!',
              description: `Updated ${veh.count} ${veh.vehName}`,
              duration: 2000,
              variant: 'success'
            });
      });
    });
  }, [selectedVehicles]);

  function onConfirm() {
    const selectedVehicles = Object.entries(vehicleCount)
      .filter(([_, { count }]) => count > 0)
      .map(([vehName, { count }]) => ({
        vehName,
        count
      }));
    setSelectedVehicles(selectedVehicles);
  }

  function handleInputChange(vehName: string, count: number) {
    setVehicleCount((prev) => ({
      ...prev,
      [vehName]: { count }
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
                  handleInputChange(vehName, Number(e.target.value))
                }
              />
            </div>
          );
        })}
      </div>
      <Button onClick={onConfirm}>Update Group</Button>
    </div>
  );
};

export default EditGroups;
