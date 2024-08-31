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
      className={` rounded-md pl-3 py-2 shadow-none ${reservation.is_special_event ? 'text-orange-500 dark:text-orange-500' : ''}`}
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
              <span className="HotelListing">
                 {/*come back here and add links to call the hotel or get directions, or see pickup location */}
                {reservation.hotel?.toLowerCase()}
              </span>
            ) : (<span className="HotelListing">
              {reservation.hotel?.toLowerCase().slice(0, 12)}
              </span>)}
          </p>
          <p className=" text-sm text-orange-500 flex items-end">
            P-{reservation.ppl_count}
          </p>
        </div>
        <div className="flex gap-2 text-sm ">
          {/* Vehicles */}
          {vehiclesList
            .filter(
              (key) => Number(reservation[key as keyof typeof reservation]) > 0
            )
            .map((key, idx) => {
              const count = Number(
                reservation[key as keyof typeof reservation]
              );
              return (
                <div key={idx}>
                  <span className="italic font-thin text-orange-500" key={key}>
                    {count}-{key}
                    {count > 1 ? 's' : ''}
                  </span>
                </div>
              );
            })}
          <div className="flex gap-2 "></div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingCard;
