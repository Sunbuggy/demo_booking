import { CardTitle } from '@/components/ui/card';
import {
  countPeople,
  getVehicleCount,
  vehiclesList
} from '@/utils/old_db/helpers';
import React from 'react';
import { Reservation } from '../../types';

const HourCardTitle = ({
  hr,
  data,
  display_cost
}: {
  hr: string;
  data: Record<string, Record<string, Reservation[]>>;
  display_cost: boolean;
}) => {
  return (
    <CardTitle className="m-2 flex gap-3 items-start max-w-full">
      {hr}{' '}
      <span className="text-base flex gap-3">
      <span className="text-orange-500">
        
          {
            // map through the data and get the total count of people by  adding up every location found and return the sum
            Object.keys(data[hr]).reduce((acc, locationKey) => {
              return (
                acc +
                data[hr][locationKey].reduce((acc, reservation) => {
                  return acc + countPeople(reservation);
                }, 0)
              );
            }, 0)
          }-People
        </span>
        <span className="text-orange-500">
          {
            // map through the data and get the total count of vehicles by  adding up every location found and return the sum
            Object.keys(data[hr]).reduce((acc, locationKey) => {
              return (
                acc +
                data[hr][locationKey].reduce((acc, reservation) => {
                  return acc + getVehicleCount(reservation);
                }, 0)
              );
            }, 0)
          }-Vehicles
        </span>
        {' '}
        <span className="text-base font-light italic text-orange-500">
          ({' '}
          {
            // Group and count vehicles for the given data. if same vehicle add count and display vehicle with count ignore if count is 0
            vehiclesList
              .filter((key) => {
                return Object.keys(data[hr]).some((locationKey) => {
                  return data[hr][locationKey].some(
                    (reservation) =>
                      Number(reservation[key as keyof typeof reservation]) > 0
                  );
                });
              })
              .map((key) => {
                const count = Object.keys(data[hr]).reduce(
                  (acc, locationKey) => {
                    return (
                      acc +
                      data[hr][locationKey].reduce((acc, reservation) => {
                        return (
                          acc +
                          Number(reservation[key as keyof typeof reservation])
                        );
                      }, 0)
                    );
                  },
                  0
                );
                return ` ${count}-${key}${count > 1 ? ' ' : ' '}`;
              })
             .join(', ')
          }
          )
        </span>
      </span>
      {display_cost && (
        <div className="font-light text-sm text-green-600">
          $
          {
            //  Sum of all reservation.total_cost for the given data
            Object.keys(data[hr])
              .reduce((acc, locationKey) => {
                return (
                  acc +
                  data[hr][locationKey].reduce((acc, reservation) => {
                    return acc + Number(reservation.total_cost);
                  }, 0)
                );
              }, 0)
              .toFixed(2)
          }
        </div>
      )}
    </CardTitle>
  );
};

export default HourCardTitle;
