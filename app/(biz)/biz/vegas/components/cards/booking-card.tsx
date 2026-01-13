'use client';

import Link from 'next/link';
import { BsArrowRight } from 'react-icons/bs';
import { FaLayerGroup } from 'react-icons/fa';
import { Reservation } from '../../../types';
import SplitShuttleAssigner from '@/components/biz/split-shuttle-assigner'; 
import GroupAssignerDialog from '../groups/group-assigner-dialog';
import { cn } from '@/lib/utils';

interface BookingCardProps {
  reservation: Reservation;
  vehiclesList: readonly string[]; 
  display_cost: boolean;
  activeFleet: any[];
  reservationStatusMap: any;
  hourlyUtilization: any;
  hourContext: string;
  drivers: any[]; // Shuttle Drivers (for Row 2)
  
  // Data required for Group Assignment (Row 3)
  groupsData?: {
    groups: any[];
    groupVehicles: any[];
    guides: any[]; // Tour Guides
    timings: any[];
  };
  todaysShifts?: any[];
}

const BookingCard: React.FC<BookingCardProps> = ({
  reservation,
  vehiclesList,
  display_cost,
  activeFleet,
  reservationStatusMap,
  hourlyUtilization,
  hourContext,
  drivers,
  groupsData,
  todaysShifts = []
}) => {
  
  // 1. Format Vehicles: Create both the Display String AND the Object for the Dialog
  const reservationVehicles: Record<string, number> = {};
  
  const vehicleString = vehiclesList
    .filter((key) => {
      const count = Number(reservation[key as keyof Reservation]);
      if (count > 0) {
        reservationVehicles[key] = count; // Populate object for GroupAssigner
        return true;
      }
      return false;
    })
    .map((key) => `${reservationVehicles[key]}-${key}`)
    .join(', ');

  // 2. Logic vars
  const pickupLoc = (reservation as any).pickup_location || reservation.hotel || '';
  const isSelfDrive = pickupLoc.toLowerCase().includes('drive here');
  const currentStatus = reservationStatusMap?.[reservation.res_id];
  const isSpecial = reservation.is_special_event;

  // 3. Determine Current Group Status
  // Logic: Check if this reservation ID is found in the 'groupVehicles' list from the DB
  let assignedGroupName: string | null = null;

  if (groupsData && groupsData.groupVehicles) {
    const match = groupsData.groupVehicles.find((gv: any) => 
      Number(gv.old_booking_id) === Number(reservation.res_id)
    );

    if (match && match.groups) {
       // Handle both array or single object structure from Supabase joins
       if (Array.isArray(match.groups)) {
         assignedGroupName = match.groups[0]?.group_name;
       } else {
         assignedGroupName = (match.groups as any).group_name;
       }
    }
  }

  // Safe Date String
  const dateString = reservation.sch_date 
    ? new Date(reservation.sch_date).toISOString().split('T')[0] 
    : new Date().toISOString().split('T')[0];

  return (
    <div className={cn(
      "relative flex flex-col gap-2 p-3 border-b border-border bg-card hover:bg-accent/50 transition-colors min-h-[90px] w-full max-w-full overflow-hidden first:rounded-t-md last:rounded-b-md",
      isSpecial && "bg-orange-50 dark:bg-orange-950/20 border-l-2 border-l-orange-500 pl-2.5" 
    )}>
      
      {/* --- ROW 1: CUSTOMER INFO --- */}
      <div className="flex flex-wrap items-baseline gap-2 w-full leading-none min-w-0">
        <Link
          href={`/biz/reservations/${reservation.res_id}`}
          className="text-xs font-mono text-pink-600 dark:text-pink-500 hover:underline font-bold shrink-0"
        >
          {reservation.res_id}
        </Link>
        
        <span className="text-sm font-bold text-foreground truncate min-w-0 flex-1">
          {reservation.full_name || '—'}
        </span>
        
        {reservation.occasion && (
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800 uppercase tracking-wide whitespace-nowrap max-w-[100px] truncate">
            {reservation.occasion}
          </span>
        )}
      </div>

      {/* --- ROW 2: LOGISTICS --- */}
      <div className="flex flex-wrap items-center gap-2 w-full min-h-[24px]">
        {/* Location Badge */}
        {reservation.hotel && (
           <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted px-2 py-1 rounded border border-border max-w-full sm:max-w-[200px]">
              <span className="truncate">{reservation.hotel}</span>
           </div>
        )}

        {/* Driver/Shuttle Assignment */}
        {!isSelfDrive && (
          <SplitShuttleAssigner
            reservationId={reservation.res_id.toString()}
            totalGroupSize={reservation.ppl_count || 0}
            reservationHour={hourContext}
            currentStatus={currentStatus}
            activeFleet={activeFleet || []}
            hourlyUtilization={hourlyUtilization || {}}
            dateContext={new Date(reservation.sch_date).toISOString()} 
            pickupLocation={pickupLoc || 'Unknown'}
            groupName={reservation.full_name || 'Guest'}
            drivers={drivers || []} // Passes Shuttle Drivers
          />
        )}
      </div>

      {/* --- ROW 3: FLEET STATS & GROUP ASSIGNMENT --- */}
      <div className="flex items-center justify-between w-full mt-1 pt-1 border-t border-border">
        
        {/* LEFT: Fleet Info & Group Trigger */}
        <div className="flex items-center gap-3 min-w-0 overflow-hidden">
           <span className="font-mono text-xs font-bold text-orange-600 dark:text-orange-400 truncate shrink-0">
             <span className="text-sm text-orange-700 dark:text-orange-500 mr-1">{reservation.ppl_count}P</span>
             {vehicleString && <span className="opacity-80 font-normal">({vehicleString})</span>}
           </span>

           {/* GROUP ASSIGNER BUTTON */}
           {/* Only shows if groupsData exists (passed from LocationCard) */}
           {groupsData && (
             <GroupAssignerDialog 
               reservationId={reservation.res_id.toString()}
               reservationVehicles={reservationVehicles}
               hour={hourContext}
               date={dateString}
               existingGroups={groupsData.groups || []}
               // [FIX] Pass GUIDES (Tour Staff) instead of DRIVERS (Shuttle Staff)
               guides={groupsData.guides || []}
               trigger={
                 <button 
                   className={cn(
                     "flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all border shadow-sm",
                     assignedGroupName 
                       ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800 hover:bg-blue-200" 
                       : "bg-muted text-muted-foreground border-border hover:bg-muted/80 hover:text-foreground"
                   )}
                   title={assignedGroupName ? `Assigned to Group ${assignedGroupName}` : "Assign to Tour Group"}
                 >
                   {assignedGroupName ? (
                     <span>{assignedGroupName}</span>
                   ) : (
                     <>
                       <FaLayerGroup className="w-3 h-3" />
                       <span className="hidden sm:inline">Group</span>
                     </>
                   )}
                 </button>
               }
             />
           )}
        </div>

        {/* RIGHT: Arrow & Cost */}
        <div className="flex items-center gap-3 shrink-0">
           {display_cost && (
             <span className="text-[10px] font-mono text-green-600 dark:text-green-500 font-bold">
               ${Number(reservation.total_cost || 0).toFixed(0)}
             </span>
           )}
           
           <Link
             href={`https://www.sunbuggy.biz/edt_res.php?Id=${reservation.res_id}`}
             target="_blank"
             className="text-muted-foreground hover:text-foreground transition-colors p-1"
           >
             <BsArrowRight size={18} />
           </Link>
        </div>
      </div>

    </div>
  );
};

export default BookingCard;