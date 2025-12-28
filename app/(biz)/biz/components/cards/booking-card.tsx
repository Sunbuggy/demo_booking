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
      // Added dark:bg-slate-950 to make the card slightly darker than the background in dark mode for contrast
      className={`bookingcard mb-1 border-gray-200 dark:border-gray-800 dark:bg-slate-950 ${reservation.is_special_event ? 'text-orange-500 dark:text-orange-500' : ''}`}
    >
      <CardContent className="flex flex-wrap items-center gap-x-3 gap-y-1 p-2 text-sm leading-tight">
        
        {/* 1. Reservation ID */}
        <Link
          href={`/biz/reservations/${reservation.res_id}`}
          className="text-pink-500 hover:underline font-mono italic"
        >
          {reservation.res_id}
        </Link>

        {/* 2. Customer Name - FIX: Changed text-white to dark:text-white */}
        <span className="font-bold text-gray-900 dark:text-white whitespace-nowrap">
          {reservation.full_name || '—'}
        </span>

        {/* 3. Tags (Occasion & Hotel) - Compact badges adjusted for light/dark mode */}
        {reservation.occasion && (
          <span className="occasionbox px-1.5 py-0.5 text-xs rounded border border-gray-300 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 whitespace-nowrap">
            {reservation.occasion.toLowerCase().slice(0, 20)}
          </span>
        )}
        
        {reservation.hotel && (
          <span className="HotelListing px-1.5 py-0.5 text-xs rounded border border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900/40 dark:bg-yellow-900/20 dark:text-yellow-500 whitespace-nowrap">
            {reservation.hotel.toLowerCase().slice(0, 20)}
          </span>
        )}

        {/* 4. Stats (People & Vehicles) - Side by Side */}
        <div className="flex items-center gap-2 text-orange-600 dark:text-orange-500">
          <span className="font-semibold whitespace-nowrap">
            {reservation.ppl_count || 0}-PPL
          </span>
          
          {bookedVehicles && (
            <span className="italic font-light text-orange-600/90 dark:text-orange-400/90 whitespace-nowrap">
              {bookedVehicles}
            </span>
          )}
        </div>

        {/* 5. Cost (Optional) */}
        {display_cost && (
          <span className="text-green-600 dark:text-green-500 font-bold ml-1">
            ${Number(reservation.total_cost || 0).toFixed(0)}
          </span>
        )}

        {/* 6. Edit Link (Pushed to far right) */}
        <Link
          href={`https://www.sunbuggy.biz/edt_res.php?Id=${reservation.res_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto pl-2"
        >
          <BsArrowReturnRight className="text-xl text-pink-500 hover:text-pink-600 transition-colors" />
        </Link>

      </CardContent>
    </Card>
  );
};

export default BookingCard;