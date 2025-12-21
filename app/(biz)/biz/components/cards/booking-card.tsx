'use client';

import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { BsArrowReturnRight } from 'react-icons/bs';
import { Reservation } from '../../types';

interface BookingCardProps {
  reservation: Reservation;
  vehiclesList: readonly string[]; // readonly to match your const array
  display_cost: boolean;
}

const BookingCard: React.FC<BookingCardProps> = ({
  reservation,
  vehiclesList,
  display_cost
}) => {
  // Build list of vehicles actually booked (with count > 0)
  const bookedVehicles = vehiclesList
    .filter((key) => {
      const count = Number(reservation[key as keyof Reservation]);
      return count > 0;
    })
    .map((key) => {
      const count = Number(reservation[key as keyof Reservation]);
      return `${count}-${key}`;
    })
    .join(', ');

  return (
    <Card
      key={reservation.res_id}
      className={`bookingcard ${reservation.is_special_event ? 'text-orange-500 dark:text-orange-500' : ''}`}
    >
      <CardContent className="bookingcardcontent">
        {/* Reservation ID Link */}
        <Link
          href={`/biz/reservations/${reservation.res_id}`}
          className="p-2 text-pink-500 cursor-pointer hover:underline block mb-2"
        >
          <i>{reservation.res_id}</i>
        </Link>

        {/* Customer Name & Total Cost */}
        <div className="mb-2">
          <span className="font-medium">{reservation.full_name || '—'}</span>
          {display_cost && (
            <i className="text-green-600 ml-4">
              ${Number(reservation.total_cost || 0).toFixed(2)}
            </i>
          )}
        </div>

        {/* Occasion, Hotel, People, Vehicles */}
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="occasionbox itembox">
            {reservation.occasion?.toLowerCase().slice(0, 28) || 'occasion'}
          </span>

          <span className="HotelListing itembox">
            {reservation.hotel?.toLowerCase().slice(0, 28) || '—'}
          </span>

          <span className="text-orange-500 font-medium">
            {reservation.ppl_count || 0}-PPL
          </span>

          {bookedVehicles && (
            <span className="italic font-thin text-orange-500">
              {bookedVehicles}
            </span>
          )}

          {/* External Edit Link */}
          <Link
            href={`https://www.sunbuggy.biz/edt_res.php?Id=${reservation.res_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto"
          >
            <BsArrowReturnRight className="text-2xl text-pink-500 hover:text-pink-600" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingCard;