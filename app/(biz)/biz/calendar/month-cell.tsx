'use client';
import { vehiclesList } from '@/utils/old_db/helpers';
import React from 'react';
import { Reservation } from '../types';
import { ImFilesEmpty } from 'react-icons/im';

const MonthCell = ({
  month_data,
  role,
  showRevenue
}: {
  month_data: Reservation[];
  role: number;
  showRevenue: boolean;
}) => {
  // Collect daily revenue adding up the total_cost of each reservation in month_data
  const monthly_revenue = month_data.reduce((acc, reservation) => {
    return acc + Number(reservation.total_cost);
  }, 0);

  // From month_data collect ppl_count and sum them up
  const ppl_count = month_data.reduce((acc, reservation) => {
    return acc + Number(reservation.ppl_count);
  }, 0);

  // vehicleslist is the properties of the month_data. First identify which vehicle has a value greater than zero then extract them in an object with the name as their key and their quantity as their value.
  const vehicle_init = month_data.map((reservation) => {
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

  // Flatten the array of objects and sum up the values of the same key to get the total count of each vehicle.
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

  // Get the total count of all vehicles by summing up the values of the total_vehicle_count object.
  const total_vehicle_count = Object.values(vehicle_count).reduce(
    (acc, value) => Number(acc) + Number(value),
    0
  );

  return (
    <div>
      {!total_vehicle_count ? (
        <div>
          <span className="text-red-600">{<ImFilesEmpty />}</span>
        </div>
      ) : (
        <>
          {role > 899 && showRevenue ? (
            <span className="text-green-600">
              $:{' '}
              {monthly_revenue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            </span>
          ) : (
            ''
          )}
          <div className="flex gap-2">
            <div className="flex flex-col">
              <span className="text-orange-400">
                F: {total_vehicle_count as number}
              </span>
              <span className="text-lime-600">P: {ppl_count as number}</span>
            </div>
            <div className="text-xs flex flex-col justify-end">
              {Object.entries(vehicle_count).map(([key, value]) => {
                return (
                  <div className="flex gap-2 dark:text-white" key={key}>
                    {key.toLowerCase()}- {String(value)}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MonthCell;
