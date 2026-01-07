// app/(biz)/biz/components/cards/location-card.tsx

import { Card, CardContent, CardTitle } from '@/components/ui/card';
import React from 'react';
import { Reservation } from '../../../types';
import BookingCard from './booking-card';
import { vehiclesList } from '@/utils/old_db/helpers';

const LocationCard = ({
  id,
  data,
  locationKey,
  display_cost,
  activeFleet,
  reservationStatusMap,
  hourlyUtilization,
  hourContext,
  drivers
}: {
  id: string;
  data: Record<string, Record<string, Reservation[]>>;
  locationKey: string;
  display_cost: boolean;
  activeFleet: any[];
  reservationStatusMap: any;
  hourlyUtilization: any;
  hourContext: string;
  drivers: any[]; 
}) => {
  const getVehicleCount = (reservation: Reservation): number => {
    return vehiclesList.reduce((acc, key) => {
      return acc + Number(reservation[key as keyof Reservation] || 0);
    }, 0);
  };

  const countPeople = (reservation: Reservation): number => {
    return reservation.ppl_count || 0;
  };

  const usedVehicles = vehiclesList
    .filter((key) => {
      return data[id][locationKey].some(
        (reservation) => Number(reservation[key as keyof Reservation] || 0) > 0
      );
    })
    .map((key) => {
      const count = data[id][locationKey].reduce((acc, reservation) => {
        return acc + Number(reservation[key as keyof Reservation] || 0);
      }, 0);
      return `${count}-${key}`;
    })
    .join(', ');

  const totalPeople = data[id][locationKey].reduce((acc, r) => acc + countPeople(r), 0);
  const totalVehicles = data[id][locationKey].reduce((acc, r) => acc + getVehicleCount(r), 0);
  const totalCost = data[id][locationKey].reduce((acc, r) => acc + Number(r.total_cost || 0), 0);

  return (
    <Card key={locationKey} className="LocationCardStyle mb-4 overflow-hidden border border-slate-200 dark:border-slate-800 w-full max-w-full">
      <CardTitle className="px-4 py-2 border-b border-slate-200 dark:border-gray-800 bg-slate-100 dark:bg-gray-900/40">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 w-full">
          {/* 1. Tour Name */}
          <span className="text-lg font-bold text-slate-800 dark:text-white shrink-0">
            {locationKey}
          </span>

          {/* 2. Stats Row (Wraps on mobile) */}
          <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-orange-700 dark:text-orange-500">
            <span className="whitespace-nowrap">{totalPeople} People</span>
            <span className="hidden sm:inline text-slate-400">â€¢</span>
            <span className="whitespace-nowrap">{totalVehicles} Vehicles</span>
            
            {/* 3. Vehicle Breakdown */}
            {usedVehicles && (
              <span className="font-light italic text-orange-600/80 dark:text-orange-400/80 break-words max-w-full">
                ({usedVehicles})
              </span>
            )}
          </div>

          {/* 4. Cost */}
          {display_cost && (
            <div className="ml-auto text-green-600 dark:text-green-400 font-bold text-sm">
              ${totalCost.toFixed(2)}
            </div>
          )}
        </div>
      </CardTitle>

      <CardContent className="flex flex-col gap-1 p-1 bg-white dark:bg-transparent">
        {data[id][locationKey].map((reservation, index) => (
          <BookingCard
            reservation={reservation}
            key={index}
            vehiclesList={vehiclesList as readonly string[]}
            display_cost={display_cost}
            activeFleet={activeFleet}
            reservationStatusMap={reservationStatusMap}
            hourlyUtilization={hourlyUtilization}
            hourContext={hourContext}
            drivers={drivers} 
          />
        ))}
      </CardContent>
    </Card>
  );
};

export default LocationCard;