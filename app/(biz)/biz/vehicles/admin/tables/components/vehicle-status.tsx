/**
 * @file app/(biz)/biz/vehicles/admin/tables/components/vehicle-status.tsx
 * @description Analyzes fleet status.
 * REFACTOR (Phase 2): Removed client-side geofencing. 
 * Now accepts pre-calculated location data from Server Action.
 */
'use client';

import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import {
  BuggyBreakdownTable,
  GeneralTable,
  VehicleLocationByType,
  VehicleLocationOverview
} from './status-tables';
import { DashboardVehicle } from '@/app/actions/fleet'; // Import our new Hydrated Type

// We map our new "location_name" to the old "location" property 
// so the child tables (GeneralTable, etc.) keep working without changes.
type VehicleWithLocation = DashboardVehicle & { location: string };

const VehicleStatus = ({
  vehicles
}: {
  vehicles: DashboardVehicle[];
}) => {
  
  // 1. TRANSFORM DATA
  // The Server Action gave us "location_name". The legacy tables expect "location".
  // We simply map it here. No heavy math needed.
  const processedVehicles: VehicleWithLocation[] = vehicles.map(v => ({
    ...v,
    location: v.location_name || 'Unknown' 
  }));

  return (
    <div className="overflow-x-auto space-y-2">
      
      {/* 1. General Status Overview */}
      <div className="p-1">
        <GeneralTable vehicles={processedVehicles} />
      </div>

      {/* 2. Buggy Breakdown (Seats vs Status) */}
      <Accordion type="single" collapsible className="bg-white dark:bg-zinc-950 border rounded-md">
        <AccordionItem value="Buggy_breakdown" className="border-b-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex justify-between items-center w-full">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Buggy Configuration Breakdown
              </h2>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-0 border-t">
            <BuggyBreakdownTable vehicles={processedVehicles} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* 3. Location by Vehicle Type */}
      <Accordion type="single" collapsible className="bg-white dark:bg-zinc-950 border rounded-md">
        <AccordionItem value="Vehicle_Location_Type" className="border-b-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex justify-between items-center w-full">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Vehicle Location by Type
              </h2>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-0 border-t">
            <VehicleLocationByType vehicles={processedVehicles} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* 4. Total Location Overview */}
      <Accordion type="single" collapsible className="bg-white dark:bg-zinc-950 border rounded-md">
        <AccordionItem value="Vehicle_Location" className="border-b-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex justify-between items-center w-full">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Location Summary
              </h2>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-0 border-t">
            <VehicleLocationOverview vehicles={processedVehicles} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default VehicleStatus;