'use client';
import React from 'react';
import { GroupVehiclesType } from '../../types';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import DeleteGroup from './delete-group';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export const DisplayExistingGroups = ({
  groupId,
  groupName,
  groupQty,
  nameFilteredGroups,
  lead,
  sweep
}: {
  groupId: string;
  groupName: string;
  groupQty: number;
  nameFilteredGroups: GroupVehiclesType[];
  lead?: string;
  sweep?: string;
}) => {
  const supabase = createClient();
  const router = useRouter();
  const [newLead, setNewLead] = React.useState(lead || '');
  const [newSweep, setNewSweep] = React.useState(sweep || '');
  const [initiateUpdate, setInitiateUpdate] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    const channel = supabase
      .channel('realtime group vehicles')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_vehicles'
        },
        () => {
          router.refresh();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'groups'
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router]);

  React.useEffect(() => {
    if (initiateUpdate) {
      supabase
        .from('groups')
        .update({ lead: newLead, sweep: newSweep })
        .eq('id', groupId)
        .then((res) => {
          res.error
            ? toast({
                title: 'Error',
                description: 'An error occurred while updating the group.',
                duration: 4000,
                variant: 'destructive'
              })
            : toast({
                title: 'Group Updated',
                description: `Group ${groupName} has been updated.`,
                duration: 2000,
                variant: 'success'
              });
          setInitiateUpdate(false);
        });
    }
  }, [initiateUpdate, newLead, newSweep, groupId, supabase, groupName, toast]);

  const handleUpdate = () => {
    if (newLead !== lead || newSweep !== sweep) {
      setInitiateUpdate(true);
    }
  };

  return (
    <div>
      <span className="flex justify-between">
        <h1>
          Update <span className="text-cyan-500"> {groupName}</span>
        </h1>
        <div className="flex flex-col gap-2 items-center">
          <Input
            value={newLead}
            placeholder="Lead"
            onChange={(e) => setNewLead(e.target.value)}
          />
          <Input
            value={newSweep}
            placeholder="Sweep"
            onChange={(e) => setNewSweep(e.target.value)}
          />
          <Button 
            size={'sm'} 
            variant={'secondary'}
            onClick={handleUpdate}
            disabled={!newLead && !newSweep}
          >
            Update Lead/Sweep
          </Button>
        </div>
        <span className="ml-2">
          <DeleteGroup groupId={groupId} />
        </span>
      </span>
      <p>
        <span className="text-orange-500"> Already In Group:</span>{' '}
        <span className="text-xl text-orange-500">{groupQty}</span>
      </p>
      <div className="flex gap-1 text-xs flex-wrap">
        {Object.entries(
          nameFilteredGroups.reduce(
            (acc, group) => {
              if (!acc[group.old_booking_id]) {
                acc[group.old_booking_id] = [];
              }
              acc[group.old_booking_id].push(
                `${group.quantity}-${group.old_vehicle_name}`
              );
              return acc;
            },
            {} as Record<string, string[]>
          )
        ).map(([bookingId, details]) => (
          <div key={bookingId}>
            <span className="text-pink-500">{bookingId}</span>(
            <span className="text-orange-500">{details.join(', ')}</span>)
          </div>
        ))}
      </div>
    </div>
  );
};

export const DisplayGroupsInHourCard = ({
  groupName,
  groupQty,
  nameFilteredGroups,
  lead,
  sweep 
}: {
  groupName: string;
  groupQty: number;
  nameFilteredGroups: GroupVehiclesType[];
  lead?: string;
  sweep?: string; 
}) => {
  const supabase = createClient();
  const router = useRouter();

  React.useEffect(() => {
    const channel = supabase
      .channel('realtime group vehicles')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_vehicles'
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router]);

  return (
    <div>
      {nameFilteredGroups ? (
        <div className="flex gap-1 w-[180px] ">
          <div className="flex gap-1 flex-col">
            <div>
              <span className="text-cyan-500">{groupName}</span>{' '}
              <span className="text-orange-500">({groupQty})</span>
            </div>
          </div>

          <div className="flex gap-1 text-sm flex-wrap">
            {Object.entries(
              nameFilteredGroups.reduce(
                (acc, group) => {
                  if (!acc[group.old_vehicle_name]) {
                    acc[group.old_vehicle_name] = 0;
                  }
                  acc[group.old_vehicle_name] += Number(group.quantity);
                  return acc;
                },
                {} as Record<string, number>
              )
            ).map(([vehicleName, totalQuantity]) => (
              <div key={vehicleName}>
                <span className="text-orange-500">{`${totalQuantity}-${vehicleName}`}</span>
              </div>
            ))}

            {/* Display lead and sweep information */}
            <div className="pl-2">
              {lead && (
                <div className=" text-xs">
                  Lead: {lead}
                </div>
              )}
              {sweep && (
                <div className="text-amber-500 text-xs">
                  Sweep: {sweep}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-lime-500">edit</div>
      )}
    </div>
  );
};