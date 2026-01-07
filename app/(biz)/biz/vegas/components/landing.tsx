import React from 'react';
import { Reservation } from '../../types';
import HourCard from './cards/hour-card';
import { countPeople, vehiclesList } from '@/utils/old_db/helpers';
import FleetManagerDialog from '@/components/biz/fleet-manager-dialog'; 
import { Button } from '@/components/ui/button';
import { FaExclamationTriangle } from 'react-icons/fa';
import { Plus } from 'lucide-react'; 

import UserStatusAvatar from '@/components/UserStatusAvatar';
import { VehicleType } from '@/app/(biz)/biz/vehicles/admin/page';

interface LandingProps {
  data: Record<string, Record<string, Reservation[]>>;
  display_cost: boolean;
  role: number | undefined; 
  date: string;
  full_name: string;
  activeFleet: any[];         
  reservationStatusMap: any;  
  hourlyUtilization: any;
  drivers: any[];
  todaysShifts: any[];
  realFleet: VehicleType[]; 
}

const Landing = ({
  data,
  display_cost,
  role,
  date,
  full_name,
  activeFleet,
  reservationStatusMap,
  hourlyUtilization,
  drivers,
  todaysShifts,
  realFleet 
}: LandingProps) => { 
  
  if (!data) return <div className="p-8 text-center text-gray-500">No data available</div>;

  const calculateTotalRevenue = () => {
    return Object.keys(data).reduce((acc, hr) => {
      return acc + Object.keys(data[hr]).reduce((accLoc, loc) => {
        return accLoc + data[hr][loc].reduce((accRes, r) => accRes + Number(r.total_cost), 0);
      }, 0);
    }, 0).toFixed(0);
  };

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
      <div className="flex flex-col gap-3 p-3 bg-slate-900/50 rounded-md border border-slate-800 w-full max-w-full overflow-hidden">
        
        {/* ROW 1: STATS SUMMARY */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm border-b border-slate-800 pb-3 mb-1 w-full">
          
          {role && role > 899 && display_cost && (
            <div className="font-semibold text-green-400 whitespace-nowrap">
              Total: ${calculateTotalRevenue()}
            </div>
          )}

          <div className="font-medium text-slate-200 whitespace-nowrap">
            Total People: <span className="text-white font-bold">{calculateTotalPax()}</span>
          </div>

          {/* C. Vehicle Breakdown (Can wrap) */}
          <div className="flex-1 text-slate-300 min-w-[200px] text-xs break-words">
            {vehiclesList
              .filter((key) => Object.keys(data).some((hr) => Object.keys(data[hr]).some((loc) => data[hr][loc].some((r) => Number(r[key as keyof typeof r]) > 0))))
              .map((key) => {
                const count = Object.keys(data).reduce((acc, hr) => acc + Object.keys(data[hr]).reduce((accLoc, loc) => accLoc + data[hr][loc].reduce((accRes, r) => accRes + Number(r[key as keyof typeof r]), 0), 0), 0);
                return `${count}-${key}${count > 1 ? 's' : ''}`;
              }).join(', ')}
          </div>
        </div>

        {/* ROW 2: ACTIVE FLEET / ROSTER BAR */}
        <div className="flex flex-wrap items-center gap-2 text-xs w-full">
           
           <div className="flex items-center gap-2 shrink-0">
             <div className="bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                Fleet
             </div>

             <FleetManagerDialog 
               date={date} 
               drivers={drivers} 
               activeFleet={activeFleet}
               todaysShifts={todaysShifts}
               realFleet={realFleet} 
               role={role} 
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

           {activeFleet && activeFleet.length > 0 ? (
             activeFleet.map((fleet: any) => {
                const shortId = fleet.vehicleName.split(' - ')[0] || fleet.vehicleName;
                const driverUser = drivers.find((d: any) => d.id === fleet.driverId);
                const avatarUser = driverUser || { id: fleet.driverId || 'unknown', full_name: fleet.driverName, email: '', phone: '' };

                return (
                  <div key={fleet.id} className="flex items-center px-2 py-1 rounded border bg-slate-900 border-slate-700 shadow-sm shrink-0 max-w-full">
                    <div className="w-5 h-5 relative flex items-center justify-center mr-2">
                       <div className="scale-50 origin-center transform"><UserStatusAvatar user={avatarUser} size="sm" /></div>
                    </div>
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <span className="font-bold text-yellow-500 whitespace-nowrap text-xs truncate">{fleet.driverName}</span>
                      <span className="text-slate-600">-</span>
                      <span className="text-slate-300 font-mono font-medium uppercase text-xs">{shortId}</span>
                    </div>
                  </div>
                );
             })
           ) : (
             <div className="flex items-center gap-2 text-xs text-slate-500 italic px-1 ml-2">
                <FaExclamationTriangle className="text-yellow-900" />
                <span>No drivers scheduled. Click + to add.</span>
             </div>
           )}
        </div>
      </div>

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