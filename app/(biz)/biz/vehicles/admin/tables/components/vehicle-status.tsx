'use client';

import React, { useState, useMemo } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  BuggyBreakdownTable,
  GeneralTable,
  VehicleLocationByType,
  VehicleLocationOverview
} from './status-tables';
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Accordion type="single" collapsible className="bg-white dark:bg-zinc-950 border rounded-md">
        <AccordionItem value="Vehicle_Location_Type" className="border-b-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              Vehicle Location by Type
            </h2>
          </AccordionTrigger>
          <AccordionContent className="p-0 border-t">
            <VehicleLocationByType vehicles={filteredVehicles} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Accordion type="single" collapsible className="bg-white dark:bg-zinc-950 border rounded-md">
        <AccordionItem value="Vehicle_Location" className="border-b-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              Location Summary
            </h2>
          </AccordionTrigger>
          <AccordionContent className="p-0 border-t">
            <VehicleLocationOverview vehicles={filteredVehicles} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default VehicleStatus;