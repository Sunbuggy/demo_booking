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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router]);

  return (
    <div>
      <h1>Edit Group {groupName}</h1>
      <p>
        <span className="text-orange-500"> Already In Group:</span>{' '}
        <span className="text-xl text-orange-500">{groupQty}</span>
      </p>
      <div className="grid grid-cols-3 text-xs">
        {nameFilteredGroups.map((group) => {
          return (
            <div key={group.id}>
              <span className="text-pink-500">{group.old_booking_id}</span>(
              <span className="text-orange-500">
                {group.old_vehicle_name}(
                <span className="text-xs">{group.quantity}</span>)
              </span>
              )
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DisplayExistingGroups;
