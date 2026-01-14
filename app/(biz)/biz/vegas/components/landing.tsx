'use client';

import React, { useState, useEffect } from 'react';
import { Reservation } from '../../types';
import HourCard from './cards/hour-card';
import { countPeople, vehiclesList } from '@/utils/old_db/helpers';
import FleetManagerDialog from '@/components/biz/fleet-manager-dialog'; 
import { Button } from '@/components/ui/button';
import { FaExclamationTriangle } from 'react-icons/fa';
import { Plus, Eye, EyeOff, DollarSign } from 'lucide-react'; 

import UserStatusAvatar from '@/components/UserStatusAvatar';
import { VehicleType } from '@/app/(biz)/biz/vehicles/admin/page';

// Define shape of lifted data
interface GroupsData {
  groups: any[];
  groupVehicles: any[];
  guides: any[];
  timings: any[];
}

interface LandingProps {
  data: Record<string, Record<string, Reservation[]>>;
  display_cost: boolean; // Initial server-side setting
  role: number | undefined; 
  date: string;
  full_name: string;
  activeFleet: any[];         
  reservationStatusMap: any;  
  hourlyUtilization: any;
  drivers: any[];
  todaysShifts: any[];
  realFleet: VehicleType[];
  groupsData: GroupsData;
}

const Landing = ({
  data,
  display_cost: initialDisplayCost, 
  role,
  date,
  full_name,
  activeFleet,
  reservationStatusMap,
  hourlyUtilization,
  drivers,
  todaysShifts,
  realFleet,
  groupsData 
}: LandingProps) => { 
  
  // --- STATE MANAGEMENT ---
  const [showMoney, setShowMoney] = useState(initialDisplayCost);
  const [isLoaded, setIsLoaded] = useState(false);

  // --- EFFECT: PERSISTENCE ---
  useEffect(() => {
    const storedPref = localStorage.getItem('sunbuggy-dashboard-show-financials');
    if (storedPref !== null) {
      setShowMoney(storedPref === 'true');
    }
    setIsLoaded(true);
  }, []);

  // --- HANDLER ---
  const toggleMoney = () => {
    const newState = !showMoney;
    setShowMoney(newState);
    localStorage.setItem('sunbuggy-dashboard-show-financials', String(newState));
  };

  if (!data) return <div className="p-8 text-center text-muted-foreground">No data available</div>;

  // --- [DEFINITIVE FIX] SORTING LOGIC ---
  // The data keys are strings like "2", "8", "10".
  // Problem: Numerically, 2 < 8, so 2pm appears before 8am.
  // Solution: Apply business logic. Hours 1-6 are treated as PM (+12h).
  const sortedKeys = Object.keys(data).sort((keyA, keyB) => {
    const getSortValue = (k: string) => {
      let h = parseInt(k, 10);
      // HEURISTIC: If hour is 1-6, assume PM (13-18).
      // This correctly places "2" (14) after "10".
      if (h >= 1 && h <= 6) return h + 12;
      return h;
    };

    return getSortValue(keyA) - getSortValue(keyB);
  });

  // --- CALCULATIONS ---
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

  // Permission Check
  const isManager = role && role >= 500;

  return (
    <div className="flex flex-col gap-5 w-full max-w-full">
      
      {/* --- DASHBOARD HEADER --- */}
      <div className="flex flex-col gap-3 p-4 bg-card rounded-md border border-border w-full max-w-full overflow-hidden shadow-sm">
        
        {/* ROW 1: STATS SUMMARY */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm border-b border-border pb-3 mb-1 w-full">
          
          <div className="flex flex-wrap items-center gap-6">
            {/* Total Revenue */}
            {isLoaded && showMoney && (
              <div className="font-semibold text-green-600 dark:text-green-400 whitespace-nowrap flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                <span>Total: ${calculateTotalRevenue()}</span>
              </div>
            )}

            <div className="font-medium text-muted-foreground whitespace-nowrap">
              Total People: <span className="text-foreground font-bold ml-1">{calculateTotalPax()}</span>
            </div>

            {/* Vehicle Breakdown */}
            <div className="flex-1 text-muted-foreground min-w-[200px] text-xs break-words">
              {vehiclesList
                .filter((key) => Object.keys(data).some((hr) => Object.keys(data[hr]).some((loc) => data[hr][loc].some((r) => Number(r[key as keyof typeof r]) > 0))))
                .map((key) => {
                  const count = Object.keys(data).reduce((acc, hr) => {
                    return acc + Object.keys(data[hr]).reduce((accLoc, loc) => {
                      return accLoc + data[hr][loc].reduce((accRes, r) => {
                        return accRes + Number(r[key as keyof typeof r]);
                      }, 0);
                    }, 0);
                  }, 0);
                  
                  return `${count}-${key}${count > 1 ? 's' : ''}`;
                }).join(', ')}
            </div>
          </div>

          {/* MANAGER TOGGLE */}
          {isManager && isLoaded && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMoney}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              title={showMoney ? "Hide Financials (Saved to Device)" : "Show Financials (Saved to Device)"}
            >
              {showMoney ? (
                <>
                  <EyeOff className="w-3 h-3 mr-2" />
                  Hide $$$
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3 mr-2" />
                  Show $$$
                </>
              )}
            </Button>
          )}
        </div>

        {/* ROW 2: ACTIVE FLEET / ROSTER BAR */}
        <div className="flex flex-wrap items-center gap-2 text-xs w-full">
           
           <div className="flex items-center gap-2 shrink-0">
             <div className="bg-secondary text-secondary-foreground border border-border px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
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
                   variant="outline" 
                   size="icon" 
                   className="h-6 w-6 rounded-full border border-border hover:bg-yellow-500 hover:text-black text-muted-foreground transition-colors"
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
                  <div key={fleet.id} className="flex items-center px-2 py-1 rounded border bg-muted/50 border-border shadow-sm shrink-0 max-w-full">
                    <div className="w-5 h-5 relative flex items-center justify-center mr-2">
                       <div className="scale-50 origin-center transform"><UserStatusAvatar user={avatarUser} size="sm" /></div>
                    </div>
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <span className="font-bold text-yellow-600 dark:text-yellow-500 whitespace-nowrap text-xs truncate">{fleet.driverName}</span>
                      <span className="text-muted-foreground">-</span>
                      <span className="text-foreground font-mono font-medium uppercase text-xs">{shortId}</span>
                    </div>
                  </div>
                );
             })
           ) : (
             <div className="flex items-center gap-2 text-xs text-muted-foreground italic px-1 ml-2">
                <FaExclamationTriangle className="text-yellow-600 dark:text-yellow-500" />
                <span>No drivers scheduled. Click + to add.</span>
             </div>
           )}
        </div>
      </div>

      {/* CARDS LOOP - USING SORTED KEYS */}
      {sortedKeys.map((key, idx) => {
        return (
          <HourCard
            key={idx}
            hr={key}
            data={data}
            display_cost={isLoaded ? showMoney : initialDisplayCost}
            date={date}
            full_name={full_name}
            activeFleet={activeFleet}
            reservationStatusMap={reservationStatusMap}
            hourlyUtilization={hourlyUtilization}
            drivers={drivers}
            groupsData={groupsData}
            todaysShifts={todaysShifts}
          />
        );
      })}
    </div>
  );
};

export default Landing;