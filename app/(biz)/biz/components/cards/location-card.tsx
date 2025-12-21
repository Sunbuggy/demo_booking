import { Card, CardContent, CardTitle } from '@/components/ui/card';
import React from 'react';
import { Reservation } from '../../types';
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
  // Helper: count vehicles booked in a single reservation
  const getVehicleCount = (reservation: Reservation): number => {
    return vehiclesList.reduce((acc, key) => {
      return acc + Number(reservation[key as keyof Reservation] || 0);
    }, 0);
  };

  // Helper: total people in a reservation
  const countPeople = (reservation: Reservation): number => {
    return reservation.ppl_count || 0;
  };

  // Get list of vehicles actually used in this location (with counts)
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

  return (
    <Card key={locationKey} className="LocationCardStyle">
      <CardTitle>
        <span className="text-sm font-light flex flex-col gap-1">
          <span className="text-xl">{locationKey}</span>
          <span className="text-orange-500">
            {data[id][locationKey].reduce((acc, reservation) => acc + countPeople(reservation), 0)} People
          </span>
          <span className="text-orange-500">
            {data[id][locationKey].reduce((acc, reservation) => acc + getVehicleCount(reservation), 0)} Vehicles
          </span>
          <span className="text-sm font-light italic text-orange-500">
            ({usedVehicles || 'None'})
          </span>
        </span>

        {display_cost && (
          <div className="text-green-600 font-bold">
            $
            {data[id][locationKey]
              .reduce((acc, reservation) => acc + Number(reservation.total_cost || 0), 0)
              .toFixed(2)}
          </div>
        )}
      </CardTitle>

      <CardContent className="flex flex-col gap-2 p-1">
        {data[id][locationKey].map((reservation, index) => (
          <BookingCard
            reservation={reservation}
            key={index}
            // Safe cast — vehiclesList is readonly, but BookingCard only reads it
            vehiclesList={vehiclesList as readonly string[]}
            display_cost={display_cost}
          />
        ))}
      </CardContent>
    </Card>
  );
};

export default LocationCard;