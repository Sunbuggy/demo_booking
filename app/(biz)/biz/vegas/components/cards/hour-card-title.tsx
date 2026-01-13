import { CardTitle } from '@/components/ui/card';
import {
  countPeople,
  getVehicleCount,
  vehiclesList
} from '@/utils/old_db/helpers';
import React from 'react';
import { Reservation } from '../../../types';

const HourCardTitle = ({
  hr,
  data,
  display_cost
}: {
  hr: string;
  data: Record<string, Record<string, Reservation[]>>;
  display_cost: boolean;
}) => {
  
  // --- CALCULATIONS ---
  // Extracted logic for readability and safety
  
  const totalPeople = Object.keys(data[hr]).reduce((acc, locationKey) => {
    return acc + data[hr][locationKey].reduce((rAcc, res) => rAcc + countPeople(res), 0);
  }, 0);

  const totalVehicles = Object.keys(data[hr]).reduce((acc, locationKey) => {
    return acc + data[hr][locationKey].reduce((rAcc, res) => rAcc + getVehicleCount(res), 0);
  }, 0);

  const totalCost = Object.keys(data[hr]).reduce((acc, locationKey) => {
    return acc + data[hr][locationKey].reduce((rAcc, res) => rAcc + Number(res.total_cost), 0);
  }, 0);

  // Generate the comma-separated string of vehicle counts (e.g. "2-ATV, 1-Buggy")
  const vehicleSummary = vehiclesList
    .filter((key) => {
      return Object.keys(data[hr]).some((locationKey) => {
        return data[hr][locationKey].some((res) => Number(res[key as keyof typeof res]) > 0);
      });
    })
    .map((key) => {
      const count = Object.keys(data[hr]).reduce((acc, locationKey) => {
        return acc + data[hr][locationKey].reduce((rAcc, res) => rAcc + Number(res[key as keyof typeof res]), 0);
      }, 0);
      return `${count}-${key}`;
    })
    .join(', ');

  // --- RENDER ---
  return (
    <CardTitle className="m-2 flex flex-wrap gap-3 items-baseline max-w-full">
      {/* Time Label (e.g. 09:00) */}
      <span className="text-xl font-bold text-foreground">{hr}</span>
      
      <span className="text-base flex flex-wrap gap-3">
        {/* People Count */}
        <span className="font-bold text-orange-700 dark:text-orange-500">
          {totalPeople}-People
        </span>
        
        {/* Vehicle Count */}
        <span className="font-bold text-orange-700 dark:text-orange-500">
          {totalVehicles}-Vehicles
        </span>
        
        {/* Vehicle Breakdown List (e.g. 4-SB1, 2-ATV) */}
        {vehicleSummary && (
          <span className="text-base font-medium italic text-muted-foreground">
            ({vehicleSummary})
          </span>
        )}
      </span>

      {/* Cost Display (Controlled by 'Show $$$' Toggle) */}
      {display_cost && (
        <div className="font-bold text-sm text-green-600 dark:text-green-400 ml-auto">
          ${totalCost.toFixed(2)}
        </div>
      )}
    </CardTitle>
  );
};

export default HourCardTitle;