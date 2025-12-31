'use client';

import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { BsArrowReturnRight } from 'react-icons/bs';
import { Reservation } from '../../types';

// Import the shared component from the correct path
import SplitShuttleAssigner from '@/components/biz/split-shuttle-assigner'; 

interface BookingCardProps {
  reservation: Reservation;
  vehiclesList: readonly string[]; 
  display_cost: boolean;
  
  // --- NEW SHUTTLE PROPS ---
  activeFleet: any[];
  reservationStatusMap: any;
  hourlyUtilization: any;
  hourContext: string;
}

const BookingCard: React.FC<BookingCardProps> = ({
  reservation,
  vehiclesList,
  display_cost,
  activeFleet,
  reservationStatusMap,
  hourlyUtilization,
  hourContext
}) => {
  // 1. Helper: Format Vehicle List
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

  // 2. Logic: Should we show the shuttle icon?
  // We exclude anyone whose location is "Drive Here".
  const pickupLoc = reservation.pickup_location || reservation.hotel || '';
  const isSelfDrive = pickupLoc.toLowerCase().includes('drive here');

  // 3. Get Current Assignment Status (if any)
  const currentStatus = reservationStatusMap?.[reservation.res_id];

  return (
    <Card
      key={reservation.res_id}
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

        {/* 2. Customer Name */}
        <span className="font-bold text-gray-900 dark:text-white whitespace-nowrap">
          {reservation.full_name || '—'}
        </span>

        {/* 3. Tags (Occasion & Hotel) */}
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

        {/* --- 4. NEW SHUTTLE ICON (Right after Location) --- */}
        {!isSelfDrive && (
          <div className="ml-1">
            <SplitShuttleAssigner
              reservationId={reservation.res_id.toString()}
              totalGroupSize={reservation.ppl_count || 0}
              reservationHour={hourContext}
              currentStatus={currentStatus}
              activeFleet={activeFleet || []}
              hourlyUtilization={hourlyUtilization || {}}
              dateContext={reservation.sch_date} 
              
              // --- PASS CONTEXT PROPS FOR DIALOG HEADER ---
              pickupLocation={pickupLoc || 'Unknown Location'}
              groupName={reservation.full_name || 'Guest'}
            />
          </div>
        )}

        {/* 5. Stats (People & Vehicles) */}
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

        {/* 6. Cost (Optional) */}
        {display_cost && (
          <span className="text-green-600 dark:text-green-500 font-bold ml-1">
            ${Number(reservation.total_cost || 0).toFixed(0)}
          </span>
        )}

        {/* 7. Edit Link (Pushed to far right) */}
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