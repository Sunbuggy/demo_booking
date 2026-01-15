import { Card } from '@/components/ui/card';
import React from 'react';
import Link from 'next/link'; 
import { Plus, Users } from 'lucide-react'; 
import { Button } from '@/components/ui/button'; 

// Sub-components
import LocationCard from './location-card';
import LaunchGroup from '../groups/launch-group';
import DeleteGroupButton from '../groups/delete-group-button'; 

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
  groupsData,
  todaysShifts,
  role // [NEW] Accept role prop
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
  groupsData: GroupsData; 
  todaysShifts?: any[]; 
  role?: number; // [NEW] Define type
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

  // --- 4. GROUP SUMMARY LOGIC ---
  const currentGroups = groupsData?.groups?.filter(g => {
    const nameStart = g.group_name?.replace(/\D/g, ''); 
    const hourNum = parseInt(groupHr, 10);
    const groupNum = parseInt(nameStart || '0', 10);
    
    return groupNum === hourNum;
  }) || [];

  // Helper to count vehicles per group
  const getGroupStats = (group: any) => {
    // 1. Get Vehicles: Prefer nested array from new fetcher, fallback to filtering global list
    let vehicles = group.group_vehicles;

    if (!vehicles || !Array.isArray(vehicles)) {
       vehicles = groupsData.groupVehicles.filter((gv) => {
        // Fallback filter logic
        if (!gv.groups) return false;
        if (Array.isArray(gv.groups)) {
          return gv.groups.some((g) => g.id === group.id);
        } else {
          return (gv.groups as any).id === group.id;
        }
      });
    }

    // 2. Count Types
    const counts: Record<string, number> = {};
    vehicles.forEach((v: any) => {
      const key = v.old_vehicle_name || 'Veh';
      const qty = Number(v.quantity || 0);
      counts[key] = (counts[key] || 0) + qty;
    });

    const vehSummary = Object.entries(counts)
      .map(([k, v]) => `${v}-${k}`)
      .join(', ');

    // 3. Resolve Names (Fetcher now returns simple strings like "Maverick")
    const lead = group.lead || '?';
    const sweep = group.sweep || '?';

    const timing = groupsData.timings.find(t => t.group_id === group.id);

    return { vehSummary, lead, sweep, timing };
  };

  // --- 5. RENDER ---
  return (
    <Card key={hr} className="border border-border border-l-4 border-l-yellow-500 bg-card overflow-hidden shadow-sm mb-6 rounded-lg w-full max-w-full">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col border-b border-border bg-muted/30">
         
         {/* TOP ROW: Time & Main Stats */}
         <div className="flex items-center justify-between px-4 py-3 w-full">
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
         
         {/* MIDDLE ROW: Groups Summary & Launch Timers */}
         {currentGroups.length > 0 && (
           <div className="px-4 pb-2 flex flex-wrap gap-2 w-full">
             {currentGroups.map((group) => {
               const { vehSummary, lead, sweep, timing } = getGroupStats(group);
               return (
                 <div 
                   key={group.id} 
                   className="flex items-center gap-2 text-xs bg-background dark:bg-slate-900/50 px-2 py-1 rounded border border-border shadow-sm group"
                 >
                   <span className="font-black text-blue-600 dark:text-blue-400 whitespace-nowrap">
                     GR:{group.group_name}
                   </span>
                   
                   {/* UPDATED: Vehicle Summary Display */}
                   {vehSummary && (
                     <span className="font-mono font-semibold text-blue-700 dark:text-blue-300 hidden sm:inline border-r border-border pr-2 mr-0.5">
                       {vehSummary}
                     </span>
                   )}
                   
                   <div className="flex items-center gap-1 font-bold text-orange-700 dark:text-orange-400 uppercase mr-1">
                      <Users className="w-3 h-3" />
                      <span>{lead}/{sweep}</span>
                   </div>

                   {/* [CRITICAL UPDATE] Pass role to LaunchGroup */}
                   <LaunchGroup 
                     groupId={group.id} 
                     launchedAt={timing?.launched_at} 
                     landedAt={timing?.landed_at} 
                     groupName={group.group_name}
                     role={role}
                   />

                   <div className="pl-1 border-l border-gray-200 dark:border-gray-700 ml-1">
                      <DeleteGroupButton groupId={group.id} />
                   </div>

                 </div>
               );
             })}
           </div>
         )}

         {/* BOTTOM ROW: Driver Workload Chips */}
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
              groupsData={groupsData}
              todaysShifts={todaysShifts}
            /> 
          );
        })}
      </div>
    </Card>
  );
};

export default HourCard;