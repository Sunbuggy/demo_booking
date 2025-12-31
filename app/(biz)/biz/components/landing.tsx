// app/(biz)/biz/components/landing.tsx

// NOTE: No 'use client' here! This must be a Server Component.
import React from 'react';
import { Reservation } from '../types';
import HourCard from './cards/hour-card';
import { countPeople, vehiclesList } from '@/utils/old_db/helpers';
import FleetManagerDialog from '@/components/biz/fleet-manager-dialog'; 
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FaExclamationTriangle } from 'react-icons/fa';

// Import the User Avatar Component
import UserStatusAvatar from '@/components/UserStatusAvatar';

const Landing = ({
  data,
  display_cost,
  role,
  date,
  full_name,
  activeFleet,
  reservationStatusMap,
  hourlyUtilization,
  drivers
}: {
  data: Record<string, Record<string, Reservation[]>>;
  display_cost: boolean;
  role: number | undefined;
  date: string;
  full_name: string;
  activeFleet: any[];         
  reservationStatusMap: any;  
  hourlyUtilization: any;
  drivers: any[];             
}): JSX.Element => {
  
  if (!data) return <div className="p-8 text-center text-gray-500">No data available</div>;

  return (
    <div className="flex flex-col gap-5 w-full max-w-full">
      {/* HEADER CONTAINER */}
      <div className="flex flex-col gap-3 p-3 bg-slate-900/50 rounded-md border border-slate-800">
        
        {/* ROW 1: General Stats */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm border-b border-slate-800 pb-3 mb-1">
          {/* Cost */}
          {role && role > 899 && display_cost && (
            <div className="font-semibold text-green-400">
              Total: $
              {Object.keys(data)
                .reduce((acc, hr) => {
                  return (
                    acc +
                    Object.keys(data[hr]).reduce((acc, locationKey) => {
                      return (
                        acc +
                        data[hr][locationKey].reduce((acc, reservation) => {
                          return acc + Number(reservation.total_cost);
                        }, 0)
                      );
                    }, 0)
                  );
                }, 0)
                .toFixed(2)}
            </div>
          )}

          {/* People Count */}
          <div className="font-medium text-slate-200">
            Total People:{' '}
            <span className="text-white font-bold">
              {Object.keys(data).reduce((acc, hr) => {
                return (
                  acc +
                  Object.keys(data[hr]).reduce((acc, locationKey) => {
                    return (
                      acc +
                      data[hr][locationKey].reduce((acc, reservation) => {
                        return acc + countPeople(reservation);
                      }, 0)
                    );
                  }, 0)
                );
              }, 0)}
            </span>
          </div>

          {/* Vehicle Counts */}
          <div className="flex-1 text-slate-300 min-w-[200px]">
            {vehiclesList
              .filter((key) => {
                return Object.keys(data).some((hr) => {
                  return Object.keys(data[hr]).some((locationKey) => {
                    return data[hr][locationKey].some(
                      (reservation) =>
                        Number(reservation[key as keyof typeof reservation]) > 0
                    );
                  });
                });
              })
              .map((key) => {
                const count = Object.keys(data).reduce((acc, hr) => {
                  return (
                    acc +
                    Object.keys(data[hr]).reduce((acc, locationKey) => {
                      return (
                        acc +
                        data[hr][locationKey].reduce((acc, reservation) => {
                          return (
                            acc +
                            Number(reservation[key as keyof typeof reservation])
                          );
                        }, 0)
                      );
                    }, 0)
                  );
                }, 0);
                return `${count}-${key}${count > 1 ? 's' : ''}`;
              })
              .join(', ')}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            {/* UPDATED: Pass activeFleet so the dialog can list/delete drivers */}
            <FleetManagerDialog 
              date={date} 
              drivers={drivers} 
              activeFleet={activeFleet} 
            />
            
            <Button asChild size="sm" variant="secondary">
              <Link href="/biz/reservations/new">Create Reservation</Link>
            </Button>
          </div>
        </div>

        {/* ROW 2: ACTIVE FLEET BAR */}
        {activeFleet && activeFleet.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 text-xs animate-in fade-in duration-500">
             <div className="px-2 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                Fleet
             </div>

             {activeFleet.map((fleet: any) => {
                const shortId = fleet.vehicleName.split(' - ')[0] || fleet.vehicleName;
                
                // Find the full user object to pass to the Avatar component
                const driverUser = drivers.find((d: any) => d.id === fleet.driverId);
                
                // Fallback user object if not found
                const avatarUser = driverUser || {
                  id: fleet.driverId || 'unknown',
                  full_name: fleet.driverName,
                  email: '',
                  phone: ''
                };

                return (
                  <div 
                    key={fleet.id} 
                    className="flex items-center gap-2 px-2 py-1 rounded border bg-slate-900 border-slate-700 shadow-sm"
                  >
                    {/* TINY AVATAR - CLICKABLE */}
                    <div className="scale-75 origin-left">
                       <UserStatusAvatar user={avatarUser} size="xs" />
                    </div>

                    <div className="flex items-center gap-1.5 -ml-1">
                      {/* Driver Name */}
                      <span className="font-bold text-yellow-500 whitespace-nowrap">
                        {fleet.driverName}
                      </span>
                      
                      <span className="text-slate-600">-</span>
                      
                      {/* Vehicle ID */}
                      <span className="text-slate-300 font-mono font-medium uppercase">
                        {shortId}
                      </span>

                      <span className="text-slate-600">-</span>

                      {/* Capacity */}
                      <span className="text-slate-400 font-mono">
                        {fleet.capacity}pax
                      </span>
                    </div>
                  </div>
                );
             })}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-500 italic px-1 py-1">
            <FaExclamationTriangle className="text-yellow-900" />
            <span>No drivers scheduled. Use "Morning Roll Call" to setup.</span>
          </div>
        )}
      </div>

      {/* HOUR CARDS */}
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
          />
        );
      })}
    </div>
  );
};

export default Landing;