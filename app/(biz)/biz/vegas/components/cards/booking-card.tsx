'use client';

import Link from 'next/link';
import { BsArrowRight } from 'react-icons/bs';
import { Reservation } from '../../../types';
import SplitShuttleAssigner from '@/components/biz/split-shuttle-assigner'; 
import { cn } from '@/lib/utils';

interface BookingCardProps {
  reservation: Reservation;
  vehiclesList: readonly string[]; 
  display_cost: boolean;
  activeFleet: any[];
  reservationStatusMap: any;
  hourlyUtilization: any;
  hourContext: string;
  drivers: any[];
}

const BookingCard: React.FC<BookingCardProps> = ({
  reservation,
  vehiclesList,
  display_cost,
  activeFleet,
  reservationStatusMap,
  hourlyUtilization,
  hourContext,
  drivers
}) => {
  // 1. Format Vehicles string
  const vehicleString = vehiclesList
    .filter((key) => Number(reservation[key as keyof Reservation]) > 0)
    .map((key) => {
      const count = Number(reservation[key as keyof Reservation]);
      return `${count}-${key}`; 
    })
    .join(', ');

  // 2. Logic vars
  const pickupLoc = (reservation as any).pickup_location || reservation.hotel || '';
  const isSelfDrive = pickupLoc.toLowerCase().includes('drive here');
  const currentStatus = reservationStatusMap?.[reservation.res_id];
  const isSpecial = reservation.is_special_event;

  return (
    <div className={cn(
      "relative flex flex-col gap-2 p-3 border-b border-slate-800 bg-slate-900/40 hover:bg-slate-900 transition-colors min-h-[90px] w-full max-w-full overflow-hidden",
      isSpecial && "bg-orange-950/20 border-l-2 border-l-orange-500 pl-2.5" 
    )}>
      
      {/* --- ROW 1: CUSTOMER INFO --- */}
      <div className="flex flex-wrap items-baseline gap-2 w-full leading-none min-w-0">
        <Link
          href={`/biz/reservations/${reservation.res_id}`}
          className="text-xs font-mono text-pink-500 hover:text-pink-400 font-bold shrink-0"
        >
          {reservation.res_id}
        </Link>
        
        {/* [FIX] Added truncate and min-w-0 to prevent blowout */}
        <span className="text-sm font-bold text-slate-100 truncate min-w-0 flex-1">
          {reservation.full_name || '—'}
        </span>
        
        {reservation.occasion && (
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-purple-900/40 text-purple-300 border border-purple-800 uppercase tracking-wide whitespace-nowrap max-w-[100px] truncate">
            {reservation.occasion}
          </span>
        )}
      </div>

      {/* --- ROW 2: LOGISTICS --- */}
      <div className="flex flex-wrap items-center gap-2 w-full min-h-[24px]">
        {/* Location Badge */}
        {reservation.hotel && (
           <div className="flex items-center gap-1 text-[11px] font-medium text-amber-500/90 bg-slate-950 px-2 py-1 rounded border border-slate-800 max-w-full sm:max-w-[200px]">
              <span className="truncate">{reservation.hotel}</span>
           </div>
        )}

        {/* Driver/Shuttle Assignment */}
        {!isSelfDrive && (
          <SplitShuttleAssigner
            reservationId={reservation.res_id.toString()}
            totalGroupSize={reservation.ppl_count || 0}
            reservationHour={hourContext}
            currentStatus={currentStatus}
            activeFleet={activeFleet || []}
            hourlyUtilization={hourlyUtilization || {}}
            dateContext={reservation.sch_date.toISOString()} 
            pickupLocation={pickupLoc || 'Unknown'}
            groupName={reservation.full_name || 'Guest'}
            drivers={drivers || []}
          />
        )}
      </div>

      {/* --- ROW 3: FLEET STATS --- */}
      <div className="flex items-center justify-between w-full mt-1 pt-1 border-t border-slate-800/30">
        
        {/* LEFT: Fleet Info */}
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
           {/* [FIX] Allow vehicle string to wrap or truncate */}
           <span className="font-mono text-xs font-bold text-orange-400 truncate w-full">
             <span className="text-sm text-orange-500 mr-1">{reservation.ppl_count}P</span>
             {vehicleString && <span className="text-orange-400/80 font-normal">({vehicleString})</span>}
           </span>
        </div>

        {/* RIGHT: Arrow & Cost */}
        <div className="flex items-center gap-3 shrink-0">
           {display_cost && (
             <span className="text-[10px] font-mono text-green-600 font-bold">
               ${Number(reservation.total_cost || 0).toFixed(0)}
             </span>
           )}
           
           <Link
             href={`https://www.sunbuggy.biz/edt_res.php?Id=${reservation.res_id}`}
             target="_blank"
             className="text-pink-600 hover:text-pink-400 transition-colors p-1"
           >
             <BsArrowRight size={18} />
           </Link>
        </div>
      </div>

    </div>
  );
};

export default BookingCard;