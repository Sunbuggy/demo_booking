'use client';

import React, { useMemo } from 'react';
import { DashboardVehicle } from '@/app/actions/fleet';
import { ScrollArea } from '@/components/ui/scroll-area';
import VehicleStatusAvatar from '@/components/fleet/vehicle-status-avatar'; 
import { formatDistanceToNow, format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { User, MapPin, Clock } from 'lucide-react';

export default function DataStream({ vehicles }: { vehicles: DashboardVehicle[] }) {

  // SORT: Most Recent First
  const streamData = useMemo(() => {
    return [...vehicles]
      .filter(v => v.last_active) // Only show active vehicles
      .sort((a, b) => {
        const timeA = new Date(a.last_active!).getTime();
        const timeB = new Date(b.last_active!).getTime();
        return timeB - timeA;
      });
  }, [vehicles]);

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
          {streamData.map((vehicle) => (
            <div 
              key={vehicle.id} 
              className="px-4 py-3 grid grid-cols-12 gap-4 items-center hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors"
            >
              
              {/* 1. VEHICLE */}
              <div className="col-span-4 flex items-center gap-3">
                <VehicleStatusAvatar vehicle={vehicle} size="sm" />
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    {vehicle.pet_name || vehicle.name}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    Fleet #{vehicle.name}
                  </span>
                </div>
              </div>

              {/* 2. USER */}
              <div className="col-span-3 flex items-center gap-2">
                <User className="w-3 h-3 text-zinc-400" />
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">
                  {vehicle.updated_by_name || 'System'}
                </span>
              </div>

              {/* 3. LOCATION */}
              <div className="col-span-3 flex items-center gap-2">
                <MapPin className="w-3 h-3 text-zinc-400" />
                <span className="text-xs text-zinc-600 dark:text-zinc-400 truncate">
                  {vehicle.location_name}
                </span>
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
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}