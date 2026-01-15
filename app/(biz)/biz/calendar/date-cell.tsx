'use client';

import { vehiclesList } from '@/utils/old_db/helpers';
import React from 'react';
import { Reservation } from '../types';
import { ImFilesEmpty } from 'react-icons/im';

/**
 * @file /app/(biz)/biz/schedule/components/date-cell.tsx
 * @description Renders the content of a single day cell in the calendar.
 * Updated: v1.2 - Mobile Optimized Revenue (Rounded + Compact)
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

  // vehicleslist logic...
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

  // Flatten the array of objects...
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
        // SEMANTIC: Empty State
        <div className="flex justify-center items-center h-full opacity-50">
          <ImFilesEmpty className="text-muted-foreground w-4 h-4" />
        </div>
      ) : (
        <div className="flex flex-col gap-0.5 md:gap-1">
          {role > 899 && showRevenue && (
            // RESPONSIVE REVENUE: 
            // - Mobile: text-[10px], Rounded (No decimals)
            // - Desktop: text-xs, Full Precision
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-[10px] md:text-xs tracking-tight">
               {/* Mobile View: Rounded */}
               <span className="md:hidden">
                 ${Math.round(daily_revenue).toLocaleString()}
               </span>
               {/* Desktop View: Full Decimals */}
               <span className="hidden md:inline">
                 ${daily_revenue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
               </span>
            </span>
          )}
          
          <div className="flex gap-2 text-xs">
            {/* SUMMARY SECTION: Always Visible */}
            <div className="flex flex-col font-bold leading-tight">
              {/* Fleet Total */}
              <span className="text-orange-600 dark:text-orange-400">
                F: {total_vehicle_count as number}
              </span>
              {/* People Total */}
              <span className="text-lime-600 dark:text-lime-400">
                P: {ppl_count as number}
              </span>
            </div>
            
            {/* DETAILS SECTION: 
                hidden on mobile (<768px), 
                visible (flex) on tablet/desktop (md:flex) 
            */}
            <div className="hidden md:flex flex-col justify-end text-[10px] leading-tight">
              {Object.entries(vehicle_count).map(([key, value], idx) => {
                return (
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