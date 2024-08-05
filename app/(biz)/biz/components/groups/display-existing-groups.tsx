'use client';
import React from 'react';
import { GroupVehiclesType } from '../../types';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

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
      <h1>
        Edit <span className="text-cyan-500"> {groupName}</span>
      </h1>
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
      ) : (
        <div className="text-lime-500">edit</div>
      )}
    </div>
  );
};

export default DisplayExistingGroups;
