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
      className={`bookingcard ${reservation.is_special_event ? 'text-orange-500 dark:text-orange-500' : ''}`}
    >
      <CardContent className="bookingcardcontent">
        <i>
          <DialogDemo reservation={reservation} />
        </i>{' '}
        {reservation.full_name} {/* Total Cost */}
        {display_cost && (
          <i className="text-green-600"> ${reservation.total_cost}</i>
        )}
           <div className="flex gap-2 items-center">        
          <p className="occasionbox itembox">
            {reservation.occasion?.toLowerCase().slice(0, 28) || 'occasion' }
           </p><p> 
            {reservation.hotel?.toLocaleLowerCase() === 'drive here' ? (
              <span className="HotelListing itembox">
                 {/* OBJECTIVE come back here and add links to call the hotel or get directions, or see pickup location */}
                {reservation.hotel?.toLowerCase()}
              </span>
            ) : (<span className="HotelListing itembox">
              {reservation.hotel?.toLowerCase().slice(0, 28)}
              </span>)}
          </p>
          
          <span className="text-sm text-orange-500">
            {reservation.ppl_count}-PPL:
          </span>
        
        <span className="flex gap-2 text-sm">
          {/* Vehicles */}
          {vehiclesList
            .filter(
              (key) => Number(reservation[key as keyof typeof reservation]) > 0
            )
            .map((key, idx, filteredList) => {
              const count = Number(
                reservation[key as keyof typeof reservation]
              );
              const full_name=`${count}-${key}`
              return (
                <div key={idx}>
                  <span className="italic font-thin text-orange-500" key={key}>
                    {full_name} {idx !== filteredList.length - 1 && ', '} 
                  </span>
                </div>
              );
            })}
                  </span>
                  </div>     
      </CardContent>
      
    </Card>
  );
};

export default BookingCard;
