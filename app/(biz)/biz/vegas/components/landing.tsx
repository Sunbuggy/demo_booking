import React from 'react';
import { Reservation } from '../../types';
import HourCard from './cards/hour-card';
import { countPeople, vehiclesList } from '@/utils/old_db/helpers';
import FleetManagerDialog from '@/components/biz/fleet-manager-dialog'; 
import { Button } from '@/components/ui/button';
import { FaExclamationTriangle } from 'react-icons/fa';
import { Plus } from 'lucide-react'; 

// Import the User Avatar Component for visual driver status
import UserStatusAvatar from '@/components/UserStatusAvatar';
// Import VehicleType for strict type safety on fleet data
import { VehicleType } from '@/app/(biz)/biz/vehicles/admin/page';

/**
 * Interface Definition
 * Defines the strict structure of props this component expects.
 * * Crucial Prop: `role`
 * This must be passed down from the server page so we can determine
 * if the user viewing this component has permission to Edit (400+) or just View (300).
 */
interface LandingProps {
  data: Record<string, Record<string, Reservation[]>>;
  display_cost: boolean;
  role: number | undefined; // Passed from server: 300 (Staff) or 400+ (Manager)
  date: string;
  full_name: string;
  activeFleet: any[];         
  reservationStatusMap: any;  
  hourlyUtilization: any;
  drivers: any[];
  todaysShifts: any[];
  realFleet: VehicleType[]; 
}

/**
 * Landing Component
 * * The main container for the Daily Operations view. 
 * It acts as a "Middle Manager" component:
 * 1. It calculates high-level stats (Total Rev, Pax).
 * 2. It renders the Dashboard Header (Fleet Roster).
 * 3. It iterates over hours to render <HourCard />s.
 */
const Landing = ({
  data,
  display_cost,
  role, // <--- Destructured here. We must pass this to children who need permissions.
  date,
  full_name,
  activeFleet,
  reservationStatusMap,
  hourlyUtilization,
  drivers,
  todaysShifts,
  realFleet 
}: LandingProps) => { 
  
  // 1. Fallback: Prevent crash if data is null/undefined
  if (!data) return <div className="p-8 text-center text-gray-500">No data available</div>;

  /**
   * Helper: Calculate Total Revenue
   * Iterates through every hour -> every location -> every reservation to sum 'total_cost'.
   * Only displayed if display_cost is true AND role > 899 (High-level Admin).
   */
  const calculateTotalRevenue = () => {
    return Object.keys(data).reduce((acc, hr) => {
      return acc + Object.keys(data[hr]).reduce((accLoc, loc) => {
        return accLoc + data[hr][loc].reduce((accRes, r) => accRes + Number(r.total_cost), 0);
      }, 0);
    }, 0).toFixed(0);
  };

  /**
   * Helper: Calculate Total Pax (Passengers)
   * Uses helper 'countPeople' to sum up total guests for the day.
   */
  const calculateTotalPax = () => {
    return Object.keys(data).reduce((acc, hr) => {
      return acc + Object.keys(data[hr]).reduce((accLoc, loc) => {
        return accLoc + data[hr][loc].reduce((accRes, r) => accRes + countPeople(r), 0);
      }, 0);
    }, 0);
  };

  return (
    <div className="flex flex-col gap-5 w-full max-w-full">
      
      {/* --- DASHBOARD HEADER --- */}
      <div className="flex flex-col gap-3 p-3 bg-slate-900/50 rounded-md border border-slate-800">
        
        {/* ROW 1: STATS SUMMARY (Revenue, Pax, Vehicle Types) */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm border-b border-slate-800 pb-3 mb-1">
          
          {/* A. Revenue (Restricted to Executives > 899) */}
          {role && role > 899 && display_cost && (
            <div className="font-semibold text-green-400">
              Total: ${calculateTotalRevenue()}
            </div>
          )}

          {/* B. Total People Count */}
          <div className="font-medium text-slate-200">
            Total People: <span className="text-white font-bold">{calculateTotalPax()}</span>
          </div>

          {/* C. Vehicle Breakdown (Dynamic List e.g. "4-QBs, 12-SB1s") */}
          <div className="flex-1 text-slate-300 min-w-[200px] text-xs">
            {vehiclesList
              // Filter out vehicle types that have 0 count today
              .filter((key) => Object.keys(data).some((hr) => Object.keys(data[hr]).some((loc) => data[hr][loc].some((r) => Number(r[key as keyof typeof r]) > 0))))
              // Map remaining types to string "Count-Type"
              .map((key) => {
                const count = Object.keys(data).reduce((acc, hr) => acc + Object.keys(data[hr]).reduce((accLoc, loc) => accLoc + data[hr][loc].reduce((accRes, r) => accRes + Number(r[key as keyof typeof r]), 0), 0), 0);
                return `${count}-${key}${count > 1 ? 's' : ''}`;
              }).join(', ')}
          </div>
        </div>

        {/* ROW 2: ACTIVE FLEET / ROSTER BAR */}
        <div className="flex flex-wrap items-center gap-2 text-xs animate-in fade-in duration-500">
           
           {/* A. FLEET LABEL + PERSISTENT MANAGER BUTTON */}
           <div className="flex items-center gap-2">
             <div className="bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                Fleet
             </div>

             {/* CRITICAL COMPONENT: FleetManagerDialog
                This handles assigning drivers to shuttles.
                We MUST pass the 'role' prop here so the dialog knows if the user is a Manager (Edit) or Staff (View).
             */}
             <FleetManagerDialog 
               date={date} 
               drivers={drivers} 
               activeFleet={activeFleet}
               todaysShifts={todaysShifts}
               realFleet={realFleet} 
               role={role} // <--- FIX APPLIED: Propagating role to the dialog
               trigger={
                 <Button 
                   variant="ghost" 
                   size="icon" 
                   className="h-6 w-6 rounded-full bg-slate-800 border border-slate-700 hover:bg-yellow-500 hover:text-black text-slate-400 transition-colors"
                   title="Manage Fleet / Roll Call"
                 >
                   <Plus className="w-4 h-4" />
                 </Button>
               }
             />
           </div>

           {/* B. ACTIVE DRIVERS LIST (Visual Roster) */}
           {activeFleet && activeFleet.length > 0 ? (
             activeFleet.map((fleet: any) => {
                // Formatting: Extract short vehicle name (e.g., "sh013" from "sh013 - Dundee")
                const shortId = fleet.vehicleName.split(' - ')[0] || fleet.vehicleName;
                const driverUser = drivers.find((d: any) => d.id === fleet.driverId);
                // Fallback object if driver details aren't fully found
                const avatarUser = driverUser || { id: fleet.driverId || 'unknown', full_name: fleet.driverName, email: '', phone: '' };

                return (
                  <div key={fleet.id} className="flex items-center px-2 py-1 rounded border bg-slate-900 border-slate-700 shadow-sm">
                    {/* Tiny User Avatar */}
                    <div className="w-5 h-5 relative flex items-center justify-center mr-2">
                       <div className="scale-50 origin-center transform"><UserStatusAvatar user={avatarUser} size="sm" /></div>
                    </div>
                    {/* Driver Details */}
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-yellow-500 whitespace-nowrap text-xs">{fleet.driverName}</span>
                      <span className="text-slate-600">-</span>
                      <span className="text-slate-300 font-mono font-medium uppercase text-xs">{shortId}</span>
                      <span className="text-slate-600">-</span>
                      <span className="text-slate-400 font-mono text-xs">{fleet.capacity}pax</span>
                    </div>
                  </div>
                );
             })
           ) : (
             /* C. EMPTY STATE INDICATOR */
             <div className="flex items-center gap-2 text-xs text-slate-500 italic px-1 ml-2">
                <FaExclamationTriangle className="text-yellow-900" />
                <span>No drivers scheduled. Click + to add.</span>
             </div>
           )}
        </div>
      </div>

      {/* --- HOUR CARDS LIST --- */}
      {/* Maps over the data object (keyed by hour "0800", "0900", etc.)
          and creates a visual card for each time slot.
      */}
      {Object.keys(data).map((key, idx) => {
        return (
          <HourCard
            data={data}
            key={idx}
            hr={key}
            display_cost={display_cost}
            date={date}
            full_name={full_name}
            activeFleet={activeFleet}
            reservationStatusMap={reservationStatusMap}
            hourlyUtilization={hourlyUtilization}
            drivers={drivers}
          />
        );
      })}
    </div>
  );
};

export default Landing;