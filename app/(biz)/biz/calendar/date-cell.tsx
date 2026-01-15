'use client';

import { vehiclesList } from '@/utils/old_db/helpers';
import React from 'react';
import { Reservation } from '../types';
import { ImFilesEmpty } from 'react-icons/im';

/**
 * @file /app/(biz)/biz/schedule/components/date-cell.tsx
 * @description Renders the content of a single day cell in the calendar.
 * Updated: Semantic Theming Applied (v1.0)
 */

const DateCell = ({
  date_data,
  role,
  showRevenue
}: {
  date_data: Reservation[];
  role: number;
  showRevenue: boolean;
}) => {
  // Collect daily revenue adding up the total_cost of each reservation in date_data
  const daily_revenue = date_data.reduce((acc, reservation) => {
    return acc + Number(reservation.total_cost);
  }, 0);

  // From date_data collect ppl_count and sum them up
  const ppl_count = date_data.reduce((acc, reservation) => {
    return acc + Number(reservation.ppl_count);
  }, 0);

  // vehicleslist is the properties of the date_data.
  // First identify which vehicle has a value greater than zero,
  // then extract them in an object with the name as their key and their quantity as their value.
  const vehicle_init = date_data.map((reservation) => {
    return vehiclesList.reduce((acc, key) => {
      const count = Number(reservation[key as keyof typeof reservation]);
      if (count > 0) {
        return {
          ...acc,
          [key]: count
        };
      }
      return acc;
    }, {});
  });

  // Flatten the array of objects and sum up the values of the same key
  // to get the total count of each vehicle.
  const vehicle_count = vehicle_init.reduce(
    (acc: { [key: string]: number }, obj) => {
      return Object.entries(obj).reduce((acc, [key, value]) => {
        return {
          ...acc,
          [key]: (acc[key] || 0) + Number(value)
        };
      }, acc);
    },
    {}
  );

  // Get the total count of all vehicles
  const total_vehicle_count = Object.values(vehicle_count).reduce(
    (acc, value) => Number(acc) + Number(value),
    0
  );

  return (
    <div className="h-full w-full">
      {!total_vehicle_count ? (
        // SEMANTIC: Empty State (Muted Icon instead of Red)
        <div className="flex justify-center items-center h-full opacity-50">
          <ImFilesEmpty className="text-muted-foreground w-4 h-4" />
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {role > 899 && showRevenue && (
            // RESPONSIVE: Emerald Green for Revenue (Dark/Light safe)
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
              ${daily_revenue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            </span>
          )}
          
          <div className="flex gap-2 text-xs">
            <div className="flex flex-col font-bold">
              {/* RESPONSIVE: Orange for Vehicles */}
              <span className="text-orange-600 dark:text-orange-400">
                F: {total_vehicle_count as number}
              </span>
              {/* RESPONSIVE: Lime for People */}
              <span className="text-lime-600 dark:text-lime-400">
                P: {ppl_count as number}
              </span>
            </div>
            
            <div className="flex flex-col justify-end text-[10px] leading-tight">
              {Object.entries(vehicle_count).map(([key, value], idx) => {
                return (
                  // SEMANTIC: Standard text color for list items
                  <div className="flex gap-1 text-foreground/80" key={idx}>
                    <span className="lowercase opacity-80">{key}</span>
                    <span className="font-medium">- {String(value)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateCell;