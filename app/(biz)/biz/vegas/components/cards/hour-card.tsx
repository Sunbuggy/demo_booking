// app/(biz)/biz/components/cards/hour-card.tsx

import { Card } from '@/components/ui/card';
import React from 'react';
import Link from 'next/link'; 
import { Plus } from 'lucide-react'; 
import { Button } from '@/components/ui/button'; 

// Sub-components
import LocationCard from './location-card';
import MainGroups from '../groups/main';
import GroupSheet from '../groups/group-sheet';
import CreateGroupWizard from '../groups/create-group-wizard';

// Types
import { Reservation, GroupsType, GroupVehiclesType } from '../../../types';

// Define the shape of the lifted data
interface GroupsData {
  groups: GroupsType[];
  groupVehicles: GroupVehiclesType[];
  guides: { id: string; full_name: string }[];
  timings: any[];
}

const HourCard = ({
  hr,
  data,
  display_cost,
  date,
  full_name,
  activeFleet,
  reservationStatusMap,
  hourlyUtilization,
  drivers,
  groupsData // <--- NEW PROP: Received from Landing
}: {
  hr: string; 
  data: Record<string, Record<string, Reservation[]>>; 
  display_cost: boolean;
  date: string; 
  full_name: string; 
  activeFleet: any[]; 
  reservationStatusMap: any; 
  hourlyUtilization: any;    
  drivers: any[]; 
  groupsData: GroupsData; // <--- Typed
}) => {
  
  // --- 1. DATA PREPARATION ---
  const reservationsInThisHour = Object.values(data[hr]).flat();
  const groupHr = hr.split(':')[0]; 
  const displayTime = `${groupHr}:00`; 

  // --- 2. CALCULATE TOTALS ---
  const totalPeople = reservationsInThisHour.reduce((acc, r) => acc + (r.ppl_count || 0), 0);
  
  const vehicleCounts: Record<string, number> = {};
  reservationsInThisHour.forEach(r => {
    const keys = ['QB', 'SB1', 'SB2', 'SB4', 'CanAm', 'ATV']; 
    keys.forEach(vKey => {
      const count = Number(r[vKey as keyof Reservation] || 0);
      if (count > 0) {
        vehicleCounts[vKey] = (vehicleCounts[vKey] || 0) + count;
      }
    });
  });

  const totalVehicles = Object.values(vehicleCounts).reduce((a, b) => a + b, 0);
  const vehicleString = Object.entries(vehicleCounts)
    .map(([k, v]) => `${v}-${k}`)
    .join(', ');

  // --- 3. CALCULATE DRIVER WORKLOAD ---
  const driverLoadMap: Record<string, { name: string; vehicle: string; stops: number; pax: number }> = {};
  
  reservationsInThisHour.forEach(res => {
    const status = reservationStatusMap?.[res.res_id];
    if (status && status.assignments) {
      status.assignments.forEach((assign: any) => {
        const fleetRow = activeFleet.find(f => f.id === assign.manifestId);
        if (fleetRow) {
           const key = fleetRow.id;
           if (!driverLoadMap[key]) {
             driverLoadMap[key] = {
               name: fleetRow.driverName.split(' ')[0], 
               vehicle: fleetRow.vehicleName.split(' - ')[0], 
               stops: 0,
               pax: 0
             };
           }
           driverLoadMap[key].stops += 1;
           driverLoadMap[key].pax += assign.paxCount;
        }
      });
    }
  });
  
  const driverSummaryStrings = Object.values(driverLoadMap).map(d => {
    return `${d.name}-${d.vehicle}-${d.stops}s-${d.pax}p`;
  });

  // --- 4. RENDER ---
  return (
    // SEMANTIC: bg-card, border-border.
    <Card key={hr} className="border border-border border-l-4 border-l-yellow-500 bg-card overflow-hidden shadow-sm mb-6 rounded-lg w-full max-w-full">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col border-b border-border bg-muted/30">
         
         <div className="flex items-center justify-between px-4 py-3 w-full">
            
            {/* Left Side: Time and Totals */}
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 max-w-full">
                <span className="text-2xl font-black text-foreground tracking-tight shrink-0">
                  {displayTime}
                </span>

                <div className="flex flex-wrap items-baseline gap-2 text-sm max-w-full">
                   <span className="font-bold text-orange-700 dark:text-orange-500 whitespace-nowrap">
                     {totalPeople} Ppl
                   </span>
                   <span className="font-bold text-orange-700 dark:text-orange-600 whitespace-nowrap">
                     {totalVehicles} Veh
                   </span>
                   {vehicleString && (
                     <span className="font-mono text-xs text-muted-foreground italic break-words hidden sm:inline">
                       ({vehicleString})
                     </span>
                   )}
                </div>
            </div>

            {/* Right Side: Button */}
            <Button 
              size="icon" 
              className="ml-2 h-8 w-8 shrink-0 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-sm border border-green-600/50"
              title={`Create reservation for ${displayTime}`}
              asChild
            >
              <Link href={`/biz/reservations/new?date=${date}&time=${groupHr}:00`}>
                 <Plus className="w-5 h-5" />
              </Link>
            </Button>
         </div>
         
         {/* Bottom Row: Compact Driver Load List */}
         {driverSummaryStrings.length > 0 && (
           <div className="px-4 pb-3 flex flex-wrap gap-2 w-full">
             {driverSummaryStrings.map((str, idx) => (
               <span key={idx} className="font-mono text-[10px] font-bold text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 px-1.5 py-0.5 rounded whitespace-nowrap border border-yellow-200 dark:border-yellow-800">
                 {str}
               </span>
             ))}
           </div>
         )}
      </div>
      
      {/* GROUPS SECTION */}
      <div className="bg-muted/20 border-b border-border px-4 py-2">
        
        <div className="flex items-center justify-between mb-2">
             <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
               Active Groups
             </span>
             
             <GroupSheet
                trigger={
                  <span className="text-[10px] bg-background hover:bg-muted text-muted-foreground hover:text-foreground px-2 py-0.5 rounded border border-border cursor-pointer transition-colors shadow-sm">
                    + Add Group
                  </span>
                }
                hr={groupHr}
                CreateGroupWizard={
                  <CreateGroupWizard
                    hour={groupHr}
                    group_date={date}
                    full_name={full_name}
                  />
                }
              /> 
        </div>

        <div className="flex flex-col gap-1 w-full">
          {/* UPDATED: Pass lifted data props to MainGroups */}
          <MainGroups
            date={date}
            groupHr={groupHr}
            reservationsDataInLocation={Object.values(data[hr])}
            groups={groupsData.groups}
            groupVehicles={groupsData.groupVehicles}
            guides={groupsData.guides}
            timings={groupsData.timings}
          />
        </div>
      </div>

      {/* RESERVATIONS LIST */}
      <div className="p-2 flex flex-col gap-3 bg-muted/10">
        {Object.keys(data[hr]).map((locationKey) => {
          return (
            <LocationCard
              key={locationKey}
              id={hr}
              data={data}
              locationKey={locationKey}
              display_cost={display_cost}
              activeFleet={activeFleet}
              reservationStatusMap={reservationStatusMap}
              hourlyUtilization={hourlyUtilization}
              hourContext={groupHr}
              drivers={drivers} 
            /> 
          );
        })}
      </div>
    </Card>
  );
};

export default HourCard;