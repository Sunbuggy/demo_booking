import { Card, CardContent, CardTitle } from '@/components/ui/card';
import React from 'react';
import { Reservation } from '../types';
import BookingCard from './booking-card';
import { vehiclesList } from '@/utils/old_db/helpers';

const LocationCard = ({
  id,
  data,
  locationKey,
  display_cost
}: {
  id: string;
  data: Record<string, Record<string, Reservation[]>>;
  locationKey: string;
  display_cost: boolean;
}) => {
  // Calculate adding up the non zero values of the vehiclesList and return the sum
  const getVehicleCount = (reservation: Reservation): number => {
    return vehiclesList.reduce((acc, key) => {
      return acc + Number(reservation[key as keyof typeof reservation]);
    }, 0);
  };
  // Calculate the total count of people
  const countPeople = (reservation: Reservation): number => {
    return reservation.ppl_count;
  };

  return (
    <Card
      key={locationKey}
      className="p-2 flex flex-col gap-4 border-t-0 border-r-0"
    >
      <CardTitle>
        <span className="text-sm font-light flex gap-2 items-center">
          <span className="text-xl">{locationKey} </span>
          <span className="text-lime-300">
            P-
            {
              // map throuugh the location and get the total count of people
              data[id][locationKey].reduce((acc, reservation) => {
                return acc + countPeople(reservation);
              }, 0)
            }
            ,{' '}
          </span>
          <span className="text-orange-300">
            {' '}
            F-
            {
              // map throuugh the location and get the total count of vehicles
              data[id][locationKey].reduce((acc, reservation) => {
                return acc + getVehicleCount(reservation);
              }, 0)
            }
          </span>
          <span className="text-xs font-light italic text-orange-300">
            (
            {
              // Group and count vehicles for the given location. if same vehicle add count and display vehicle with count ignore if count is 0
              vehiclesList
                .filter((key) => {
                  return data[id][locationKey].some(
                    (reservation) =>
                      Number(reservation[key as keyof typeof reservation]) > 0
                  );
                })
                .map((key) => {
                  const count = data[id][locationKey].reduce(
                    (acc, reservation) => {
                      return (
                        acc +
                        Number(reservation[key as keyof typeof reservation])
                      );
                    },
                    0
                  );
                  return (
                    <span key={key}>
                      {count}-{key}
                      {count > 1 ? 's' : ''}
                    </span>
                  );
                })
            }
            )
          </span>
        </span>
        {display_cost && (
          <div className="text-green-600">
            $
            {
              //  Sum of all reservation.total_cost for the given location
              data[id][locationKey]
                .reduce((acc, reservation) => {
                  return acc + Number(reservation.total_cost);
                }, 0)
                .toFixed(2)
            }
          </div>
        )}
      </CardTitle>{' '}
      <CardContent className=" flex flex-col gap-3 p-2">
        {data[id][locationKey].map((reservation, key) => {
          return (
            <BookingCard
              reservation={reservation}
              key={key}
              vehiclesList={vehiclesList}
              display_cost={display_cost}
            />
          );
        })}
      </CardContent>
    </Card>
  );
};

export default LocationCard;
