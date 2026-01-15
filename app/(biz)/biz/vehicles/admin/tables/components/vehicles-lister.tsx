/**
 * @file vehicles-lister.tsx
 * @description Renders a grid of Vehicle Avatars.
 * Updated to use DashboardVehicle objects (Instant Render) instead of fetching IDs.
 */
'use client';

import React from 'react';
import { DashboardVehicle } from '@/app/actions/fleet';
import VehicleStatusAvatar from '@/components/fleet/vehicle-status-avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

interface VehiclesListerProps {
  vehicles: DashboardVehicle[]; // Now accepts full objects
}

const VehiclesLister = ({ vehicles }: VehiclesListerProps) => {
  
  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="p-4 text-center text-slate-400 text-sm italic">
        No vehicles found in this category.
      </div>
    );
  }

  // Sort by Name (Numeric if possible, then Alphabetical)
  const sortedVehicles = [...vehicles].sort((a, b) => 
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-2 px-2">
        <h2 className="text-sm font-bold tracking-tight text-slate-500 uppercase">
          {sortedVehicles.length} Vehicles
        </h2>
      </div>
      
      <ScrollArea className="h-[300px] w-full rounded-md border p-4 bg-slate-50 dark:bg-zinc-900/50">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {sortedVehicles.map((vehicle) => (
            <div key={vehicle.id} className="flex flex-col items-center gap-1">
              <VehicleStatusAvatar 
                vehicle={vehicle} 
                size="lg" 
              />
              <span className="text-[10px] font-mono text-slate-500 font-medium">
                {vehicle.name}
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default VehiclesLister;