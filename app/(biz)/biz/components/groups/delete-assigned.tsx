'use client';
import { Button } from '@/components/ui/button';
import { PopoverClose } from '@/components/ui/popover';
import { deleteFromGroupVehicles } from '@/utils/old_db/actions';
import React from 'react';
import { GroupsType, GroupVehiclesType, Reservation } from '../../types';
import { useToast } from '@/components/ui/use-toast';

const DeleteAssigned = ({
  reservation,
  countVehicles,
  group,
  groupVehicles
}: {
  reservation: Reservation;
  countVehicles: string;
  groupVehicles: GroupVehiclesType[];
  group: GroupsType;
}) => {
  const [confirmDelete, setConfirmDelete] = React.useState(false);
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
          console.error('empty group');
          return false;
        }

        if (Array.isArray(group.groups)) {
          const groupNames = group.groups.map((group) => group.group_name);
          const includesGroupName = groupNames.includes(groupName);
          const matchesResNo = Number(group.old_booking_id) === Number(resNo);
          const matchesVehicleName = group.old_vehicle_name === vehicleName;
          const matchesQuantity = Number(group.quantity) === quantity;

          console.table({
            groupNames,
            includesGroupName,
            matchesResNo,
            matchesVehicleName,
            matchesQuantity
          });

          return (
            includesGroupName &&
            matchesResNo &&
            matchesVehicleName &&
            matchesQuantity
          );
        } else {
          const matchesGroupName = group.groups.group_name === groupName;
          const matchesResNo = Number(group.old_booking_id) === Number(resNo);
          const matchesVehicleName = group.old_vehicle_name === vehicleName;
          const matchesQuantity = Number(group.quantity) === quantity;

          console.table({
            matchesGroupName,
            matchesResNo,
            matchesVehicleName,
            matchesQuantity
          });

          return (
            matchesGroupName &&
            matchesResNo &&
            matchesVehicleName &&
            matchesQuantity
          );
        }
      });
      return group ? group.id : undefined;
    }

    if (confirmDelete) {
      const groupId = getGroupVehicleId(
        group.group_name,
        String(reservation.res_id),
        countVehicles.split('-')[1],
        Number(countVehicles.split('-')[0])
      );
      deleteFromGroupVehicles(String(groupId)).then((res) => {
        res.error
          ? toast({
              title: 'Error',
              description: 'Error deleting from group',
              duration: 4000,
              variant: 'destructive'
            })
          : toast({
              title: 'Fleet Inserted!',
              description: `Deleted ${reservation.res_id}(${countVehicles}) from group`,
              duration: 2000,
              variant: 'success'
            });
      });
    }
    setConfirmDelete(false);
  }, [confirmDelete]);
  return (
    <div>
      <p>
        Are You Sure You Want To Delete ({reservation.res_id}({countVehicles}))
        From the Group?
      </p>
      <div className="flex gap-3">
        <Button
          onClick={() => {
            setConfirmDelete(true);
          }}
        >
          Yes
        </Button>
        <PopoverClose className="text-xs p-1 h-[1em]">No</PopoverClose>
      </div>
    </div>
  );
};

export default DeleteAssigned;
