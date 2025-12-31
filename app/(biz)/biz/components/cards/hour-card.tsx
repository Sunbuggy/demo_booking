// app/(biz)/biz/components/cards/hour-card.tsx

import { Card, CardContent } from '@/components/ui/card';
import React from 'react';
import LocationCard from './location-card';
import { Reservation } from '../../types';
import MainGroups from '../groups/main';
import GroupSheet from '../groups/group-sheet';
import CreateGroupWizard from '../groups/create-group-wizard';

/**
 * HourCard Component
 * Displays a compact summary of the hour's operations with a hard yellow border.
 */
const HourCard = async ({
  hr,
  data,
  display_cost,
  date,
  full_name,
  activeFleet,
  reservationStatusMap,
  hourlyUtilization,
  drivers 
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
}) => {
  
  // 1. Get all reservations for this hour (flatten locations)
  const reservationsInThisHour = Object.values(data[hr]).flat();
  
  // 2. Simple Hour String (e.g. "09")
  const groupHr = hr.split(':')[0];
  const displayTime = `${groupHr}:00`; 

  // 3. CALCULATE TOTALS
  const totalPeople = reservationsInThisHour.reduce((acc, r) => acc + (r.ppl_count || 0), 0);
  
  // Calculate Vehicle Breakdown
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

  // 4. CALCULATE DRIVER LOADS
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

  return (
    <Card key={hr} className="border-2 border-yellow-500 bg-slate-950/20 overflow-hidden shadow-sm mb-4 rounded-lg">
      
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col border-b border-slate-800 bg-slate-950">
         
         {/* Row 1: Time | Totals */}
         <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-3 py-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {displayTime}
            </span>

            <div className="flex items-baseline gap-3 text-sm">
               <span className="font-bold text-orange-500">
                 {totalPeople}-People
               </span>
               <span className="font-bold text-orange-600">
                 {totalVehicles}-Vehicles
               </span>
               {vehicleString && (
                 <span className="font-mono text-xs text-slate-500 italic hidden sm:inline">
                   ({vehicleString})
                 </span>
               )}
            </div>
         </div>
         
         {/* Row 2: Driver Loads - Compact List */}
         {driverSummaryStrings.length > 0 && (
           <div className="px-3 pb-2 flex flex-wrap gap-x-3 gap-y-1">
             {driverSummaryStrings.map((str, idx) => (
               <span key={idx} className="font-mono text-[10px] font-bold text-yellow-600/90 bg-slate-900/50 px-1 rounded">
                 {str}
               </span>
             ))}
           </div>
         )}
      </div>
      
      {/* --- GROUPS SECTION (Rows Layout) --- */}
      {/* Reduced padding (p-2 -> px-2 py-1) for compactness */}
      <div className="bg-slate-900/40 border-b border-slate-800 px-2 py-1">
        <div className="flex items-center justify-between mb-1">
             <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider pl-1">
               Active Groups
             </span>
             
             <GroupSheet
                trigger={
                  <span className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded border border-slate-600 cursor-pointer transition-colors">
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

        {/* Vertical Stack for Group Rows */}
        <div className="flex flex-col gap-1 w-full pl-1">
          <MainGroups
            date={date}
            groupHr={groupHr}
            reservationsDataInLocation={Object.values(data[hr])}
          />
        </div>
      </div>

      {/* --- RESERVATIONS CONTENT --- */}
      <div className="p-1 flex flex-col gap-2 bg-slate-950/30">
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