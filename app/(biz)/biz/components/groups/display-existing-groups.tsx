'use client';
import React from 'react';
import { GroupVehiclesType } from '../../types';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

const DisplayExistingGroups = ({
  groupName,
  groupQty,
  nameFilteredGroups
}: {
  groupName: string;
  groupQty: number;
  nameFilteredGroups: GroupVehiclesType[];
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

  return (
    <div>
      <span className="flex justify-between">
        <h1>
          Update <span className="text-cyan-500"> {groupName}</span>
        </h1>
        <span>
          <Button variant={'destructive'}>
            Delete <span className="text-cyan-500 ml-3"> {groupName}</span>
          </Button>
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
  nameFilteredGroups
}: {
  groupName: string;
  groupQty: number;
  nameFilteredGroups: GroupVehiclesType[];
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
        <div className="flex gap-1 w-[218px] items-start">
          <div className="flex gap-2">
            <span className="text-cyan-500">{groupName}</span>{' '}
            <span className="text-orange-500">({groupQty})</span>
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
          </div>
        </div>
      ) : (
        <div className="text-lime-500">edit</div>
      )}
    </div>
  );
};

export default DisplayExistingGroups;
