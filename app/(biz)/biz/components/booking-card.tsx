import { Card, CardContent, CardTitle } from '@/components/ui/card';
import React from 'react';
import { Reservation } from '../types';

const BookingCard = ({
  reservation,
  vehiclesList
}: {
  reservation: Reservation;
  vehiclesList: string[];
}) => {
  return (
    <Card
      key={reservation.res_id}
      className={` rounded-md border-l-0 border-t-0 pl-3 py-2 shadow-none ${reservation.is_special_event ? 'text-green-600 dark:text-green-500' : ''}`}
    >
      <CardTitle className=" text-base">
        {reservation.full_name} [{reservation.res_id}]
      </CardTitle>
      <CardContent className="p-0">
        <div className="flex gap-2">
          <p>{reservation.occasion?.toLowerCase().slice(0, 12)}/</p>
          <p>{reservation.hotel?.toLowerCase().slice(0, 12)}/</p>
          <p>#PPL: {reservation.ppl_count}/</p>
        </div>
        <div className="flex gap-2">
          {vehiclesList
            .filter(
              (key) => Number(reservation[key as keyof typeof reservation]) > 0
            )
            .map((key) => {
              const count = Number(
                reservation[key as keyof typeof reservation]
              );
              return (
                <p key={key}>
                  {count}-{key}
                  {count > 1 ? 's' : ''}/
                </p>
              );
            })}
        </div>

        <div className="flex gap-2"></div>
      </CardContent>
    </Card>
  );
};

export default BookingCard;

// TODO: Create Group, Assign Shuttle, Show $, create calendar, people counter for the day, vehicle counter for the day
