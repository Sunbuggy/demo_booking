import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { DialogDemo } from '@/components/ui/Dialog';
import React from 'react';
import { Reservation } from '../../types';

export type Groups = {
  created_by: string;
  group_date: string;
  group_name: string;
};
export type GroupNamesType = {
  groups: any;
}[];

const BookingCard = async ({
  reservation,
  vehiclesList,
  display_cost
}: {
  reservation: Reservation;
  vehiclesList: string[];
  display_cost: boolean;
}) => {
  let fleet = {};
  vehiclesList
    .filter((key) => Number(reservation[key as keyof typeof reservation]) > 0)
    .map((key) => {
      const count = Number(reservation[key as keyof typeof reservation]);
      fleet = { [key]: count };
    });

  return (
    <Card
      key={reservation.res_id}
      className={` rounded-md border-l-0 border-t-0 pl-3 py-2 shadow-none ${reservation.is_special_event ? 'text-green-600 dark:text-green-500' : ''}`}
    >
      <CardTitle className="text-base flex gap-2">
        <i>
          <DialogDemo reservation={reservation} />
        </i>{' '}
        <strong>{reservation.full_name}</strong> {/* Total Cost */}
        {display_cost && (
          <i className="text-green-600"> ${reservation.total_cost}</i>
        )}
      </CardTitle>
      <CardContent className="p-0">
        <div className="flex gap-2">
          <p>
            {reservation.occasion?.toLowerCase().slice(0, 12) || 'occasion'}
          </p>
          <p>
            {reservation.hotel?.toLocaleLowerCase() === 'drive here' ? (
              <span className="text-gray-600 dark:text-red-300">
                {reservation.hotel?.toLowerCase()}
              </span>
            ) : (
              reservation.hotel?.toLowerCase().slice(0, 12)
            )}
          </p>
          <p className=" text-sm text-lime-200 flex items-end">
            P-{reservation.ppl_count}
          </p>
        </div>
        <div className="flex gap-2 text-sm ">
          {/* Vehicles */}
          {vehiclesList
            .filter(
              (key) => Number(reservation[key as keyof typeof reservation]) > 0
            )
            .map((key) => {
              const count = Number(
                reservation[key as keyof typeof reservation]
              );
              return (
                <>
                  <p className="italic font-thin text-orange-200" key={key}>
                    {count}-{key}
                    {count > 1 ? 's' : ''}
                  </p>
                </>
              );
            })}
          <div className="flex gap-2 "></div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingCard;
