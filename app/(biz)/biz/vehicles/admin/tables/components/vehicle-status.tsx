<<<<<<< HEAD
/**
 * @file app/(biz)/biz/vehicles/admin/tables/components/vehicle-status.tsx
 * @description Analyzes fleet status.
 * REFACTOR (Phase 2): Removed client-side geofencing. 
 * Now accepts pre-calculated location data from Server Action.
 */
'use client';

import React from 'react';
=======
'use client';

import React, { useState, useMemo } from 'react';
>>>>>>> feature/scottpismobooking
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
<<<<<<< HEAD
=======
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
>>>>>>> feature/scottpismobooking
import {
  BuggyBreakdownTable,
  GeneralTable,
  VehicleLocationByType,
  VehicleLocationOverview
} from './status-tables';
<<<<<<< HEAD
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
=======
import { DashboardVehicle } from '@/app/actions/fleet'; 

type VehicleWithLocation = DashboardVehicle & { location: string };

const VehicleStatus = ({ vehicles }: { vehicles: DashboardVehicle[] }) => {
  const [filter, setFilter] = useState('all');

  // 1. FILTER LOGIC
  const filteredVehicles = useMemo(() => {
    let result = vehicles;

    // Filter by Location
    if (filter !== 'all') {
      const term = filter.toLowerCase();
      result = result.filter(v => 
        (v.location_name || '').toLowerCase().includes(term)
      );
    }

    // Map to legacy structure for tables
    return result.map(v => ({
      ...v,
      location: v.location_name || 'Unknown' 
    }));
  }, [vehicles, filter]);

  return (
    <div className="space-y-4">
      {/* --- FILTER HEADER --- */}
      <div className="flex items-center justify-between bg-slate-100 dark:bg-zinc-900 p-2 rounded-md border dark:border-zinc-800">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 pl-2">
          Fleet Status Report
        </h2>
        <Select onValueChange={setFilter} defaultValue="all">
          <SelectTrigger className="w-[250px] bg-white dark:bg-zinc-950">
            <SelectValue placeholder="Filter Location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">🌍 Global View (All)</SelectItem>
            <SelectGroup>
              <SelectLabel>Las Vegas</SelectLabel>
              <SelectItem value="vegas">All Vegas</SelectItem>
              <SelectItem value="vegas shop">Shop Only</SelectItem>
              <SelectItem value="nellis">Nellis Dunes</SelectItem>
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Pismo Beach</SelectLabel>
              <SelectItem value="pismo">All Pismo</SelectItem>
              <SelectItem value="pismo shop">Shop Only</SelectItem>
              <SelectItem value="pismo beach">Beach Stand</SelectItem>
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Michigan</SelectLabel>
              <SelectItem value="silver lake">All Silver Lake</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* --- TABLES --- */}
      <div className="p-1">
        <GeneralTable vehicles={filteredVehicles} />
      </div>

      <Accordion type="single" collapsible className="bg-white dark:bg-zinc-950 border rounded-md">
        <AccordionItem value="Buggy_breakdown" className="border-b-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              Buggy Configuration Breakdown
            </h2>
          </AccordionTrigger>
          <AccordionContent className="p-0 border-t">
            <BuggyBreakdownTable vehicles={filteredVehicles} />
>>>>>>> feature/scottpismobooking
          </AccordionContent>
        </AccordionItem>
      </Accordion>

<<<<<<< HEAD
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
=======
      <Accordion type="single" collapsible className="bg-white dark:bg-zinc-950 border rounded-md">
        <AccordionItem value="Vehicle_Location_Type" className="border-b-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              Vehicle Location by Type
            </h2>
          </AccordionTrigger>
          <AccordionContent className="p-0 border-t">
            <VehicleLocationByType vehicles={filteredVehicles} />
>>>>>>> feature/scottpismobooking
          </AccordionContent>
        </AccordionItem>
      </Accordion>

<<<<<<< HEAD
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
=======
      <Accordion type="single" collapsible className="bg-white dark:bg-zinc-950 border rounded-md">
        <AccordionItem value="Vehicle_Location" className="border-b-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              Location Summary
            </h2>
          </AccordionTrigger>
          <AccordionContent className="p-0 border-t">
            <VehicleLocationOverview vehicles={filteredVehicles} />
>>>>>>> feature/scottpismobooking
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default VehicleStatus;