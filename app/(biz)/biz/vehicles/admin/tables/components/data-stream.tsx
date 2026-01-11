/**
 * @file data-stream.tsx
 * @description A simple, real-time feed of vehicle updates.
 * UPDATED:
 * 1. Fetches User Names client-side (matches History Page logic).
 * 2. Uses LocationCell (Pill).
 * 3. Uses VehicleStatusAvatar & FleetIcon.
 */
'use client';

import React, { useMemo } from 'react';
import { DashboardVehicle } from '@/app/actions/fleet';
import { ScrollArea } from '@/components/ui/scroll-area';
import VehicleStatusAvatar from '@/components/fleet/vehicle-status-avatar'; 
import { FleetIcon } from '@/components/fleet/FleetIconProvider';
import { formatDistanceToNow, format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';
import { LocationCell } from '@/components/fleet/LocationCell';

// --- NEW IMPORTS FOR USER FETCHING ---
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { getUserDetailsById } from '@/utils/supabase/queries';

const supabase = createClient();

export default function DataStream({ vehicles }: { vehicles: DashboardVehicle[] }) {

  // 1. FILTER & SORT: Most Recent First
  const streamData = useMemo(() => {
    return [...vehicles]
      .filter(v => v.last_active)
      .sort((a, b) => new Date(b.last_active!).getTime() - new Date(a.last_active!).getTime());
  }, [vehicles]);

  // 2. EXTRACT USER IDs (updated_by)
  const uniqueUserIds = useMemo(() => {
    // We assume 'updated_by' holds the User ID of the scanner
    return Array.from(new Set(streamData.map(v => v.updated_by).filter(Boolean) as string[]));
  }, [streamData]);

  // 3. FETCH USER NAMES (Same logic as History Page)
  const { data: userMap } = useQuery({
    queryKey: ['streamUserDetails', uniqueUserIds],
    queryFn: async () => {
      const details = await Promise.all(uniqueUserIds.map((id) => getUserDetailsById(supabase, id)));
      return details.flat().reduce((acc, user) => {
        if (user) acc[user.id] = user.full_name ?? 'Unknown';
        return acc;
      }, {} as Record<string, string>);
    },
    enabled: uniqueUserIds.length > 0,
    staleTime: 1000 * 60 * 5 // Cache for 5 mins
  });

  return (
    <div className="border rounded-xl bg-white dark:bg-zinc-950 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-220px)]">
      
      {/* Header */}
      <div className="p-4 border-b bg-slate-50 dark:bg-zinc-900 flex justify-between items-center shrink-0">
        <div>
          <h3 className="text-lg font-black uppercase tracking-tight text-zinc-700 dark:text-zinc-200">
            Live Data Stream
          </h3>
          <p className="text-xs text-zinc-500">
            Most recent GPS updates & scans.
          </p>
        </div>
        <Badge variant="outline" className="font-mono">
          {streamData.length} Active
        </Badge>
      </div>
      
      {/* List Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-zinc-100 dark:bg-zinc-900/50 border-b text-[10px] uppercase font-bold text-zinc-500">
        <div className="col-span-4">Vehicle</div>
        <div className="col-span-3">User / Scanner</div>
        <div className="col-span-3">Location</div>
        <div className="col-span-2 text-right">Time</div>
      </div>

      {/* Stream List */}
      <ScrollArea className="flex-1">
        <div className="divide-y divide-slate-100 dark:divide-zinc-800">
          {streamData.map((vehicle) => {
            
            // RESOLVE USER NAME
            // 1. Try fetched map (Scott Bradford)
            // 2. Try pre-loaded name (if any)
            // 3. Fallback to System
            const userName = (vehicle.updated_by && userMap?.[vehicle.updated_by]) 
              || vehicle.updated_by_name 
              || 'System';

            return (
              <div 
                key={vehicle.id} 
                className="px-4 py-3 grid grid-cols-12 gap-4 items-center hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors group"
              >
                
                {/* 1. IDENTITY */}
                <div className="col-span-4 flex items-center gap-3">
                  <VehicleStatusAvatar vehicle={vehicle} size="sm" showStatusDot={true} />
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 transition-colors">
                      {vehicle.pet_name || vehicle.name}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <FleetIcon type={vehicle.type} className="w-3 h-3 text-zinc-400" />
                      <span className="text-[10px] font-mono text-zinc-500">
                        #{vehicle.name}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. USER (Now Correctly Fetched) */}
                <div className="col-span-3 flex items-center gap-2 overflow-hidden">
                  <User className="w-3 h-3 text-zinc-400 shrink-0" />
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">
                    {userName}
                  </span>
                </div>

                {/* 3. LOCATION */}
                <div className="col-span-3">
                  <LocationCell 
                    name={vehicle.location_name || 'Unknown'}
                    lat={vehicle.latitude}
                    lng={vehicle.longitude}
                    className="w-fit max-w-full"
                  />
                </div>

                {/* 4. TIME */}
                <div className="col-span-2 text-right flex flex-col justify-center">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    {format(new Date(vehicle.last_active!), 'h:mm a')}
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    {formatDistanceToNow(new Date(vehicle.last_active!), { addSuffix: true })}
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}