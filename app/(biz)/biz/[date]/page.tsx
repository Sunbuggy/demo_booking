// app/(biz)/biz/[date]/page.tsx

import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import dayjs from 'dayjs';
import { RiArrowLeftWideFill, RiArrowRightWideFill } from 'react-icons/ri';
import { Button } from '@/components/ui/button';
import LoadingModal from '../components/loading-modal';
import Landing from '../components/landing';
import { createClient } from '@/utils/supabase/server';
import { getUserDetails } from '@/utils/supabase/queries';
import { Reservation } from '../types';
import { getTimeSortedData } from '@/utils/old_db/helpers';
import { getDailyOperations } from '@/app/actions/shuttle-operations'; 
import { getVegasShuttleDrivers } from '@/app/actions/user-actions'; 

// IMPORT THE NEW GLOBAL LISTENER
import RealtimeGroupsListener from '../components/realtime-groups-listener';

export const dynamic = 'force-dynamic';

async function fetchReservationsForDate(date: string): Promise<Reservation[]> {
  'use server';
  const { fetch_from_old_db } = await import('@/utils/old_db/actions');
  const query = `SELECT * FROM reservations_modified WHERE sch_date = '${date}'`;
  try {
    const data = (await fetch_from_old_db(query)) as Reservation[];
    return data || [];
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return [];
  }
}

function BizContent({
  date, dcos, role, full_name, reservations, yesterday, tomorrow,
  activeFleet, reservationStatusMap, hourlyUtilization, drivers,
  todaysShifts
}: any) {
  const hasReservations = reservations.length > 0;
  let sortedData = hasReservations ? getTimeSortedData(reservations) : null;

  if (Array.isArray(sortedData)) {
    sortedData = sortedData.sort((a: any, b: any) => {
      const timeA = parseInt(a.time || a.key || a, 10); 
      const timeB = parseInt(b.time || b.key || b, 10);
      return timeA - timeB;
    });
  } 

  return (
    <div className="min-h-screen w-full flex flex-col gap-5 relative">
      
      {/* --- GLOBAL REALTIME LISTENER --- */}
      {/* This single component handles all group/timing updates to prevent network saturation */}
      <RealtimeGroupsListener />

      {/* --- STICKY "FLOATING ISLAND" NAVIGATION --- */}
      {role > 299 && (
        <div className="sticky top-2 z-50 mx-auto w-fit flex justify-center">
          <div className="flex gap-4 items-center bg-slate-950/80 backdrop-blur-md border border-slate-700/50 rounded-xl px-4 py-1.5 shadow-2xl">
            {/* Prev Day */}
            <Link 
              href={`/biz/${yesterday}${dcos ? '?dcos=true' : ''}`}
              className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded-full"
            >
              <RiArrowLeftWideFill className="text-2xl" />
            </Link>

            {/* Calendar Button */}
            <Link href="/biz/calendar">
              <Button 
                variant="ghost" 
                size="sm" 
                className="font-mono font-bold h-8 bg-transparent text-slate-200 hover:bg-slate-800 hover:text-white"
              >
                {dayjs(date).format('ddd, MMM D, YYYY')}
              </Button>
            </Link>

            {/* Next Day */}
            <Link 
              href={`/biz/${tomorrow}${dcos ? '?dcos=true' : ''}`}
              className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded-full"
            >
              <RiArrowRightWideFill className="text-2xl" />
            </Link>
          </div>
        </div>
      )}

      {hasReservations && sortedData ? (
        <Landing
          data={sortedData}
          display_cost={dcos}
          role={role}
          date={date}
          full_name={full_name}
          activeFleet={activeFleet}
          reservationStatusMap={reservationStatusMap}
          hourlyUtilization={hourlyUtilization}
          drivers={drivers}
          todaysShifts={todaysShifts} 
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 mt-10">
          <h2 className="text-3xl font-semibold mb-4 text-slate-500">No reservations for {dayjs(date).format('MMMM D, YYYY')}</h2>
        </div>
      )}
    </div>
  );
}

export default async function BizPage({ params, searchParams }: any) {
  const { date } = await params;
  const search = await searchParams;
  const dcos = search.dcos === 'true';

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) redirect('/biz/calendar');

  const supabase = await createClient(); 
  const user = await getUserDetails(supabase);
  if (!user || !user[0]) redirect('/signin');

  const role = user[0].user_level;
  if (role < 299) return <div>Unauthorized</div>;

  const yesterday = dayjs(date).subtract(1, 'day').format('YYYY-MM-DD');
  const tomorrow = dayjs(date).add(1, 'day').format('YYYY-MM-DD');

  // 1. Fetch Legacy Reservations
  const reservations = await fetchReservationsForDate(date);
  
  // 2. Prepare the Schedule Query
  const shiftsQuery = supabase
    .from('employee_schedules')
    .select('user_id, role, location, task')
    .gte('start_time', `${date}T00:00:00`)
    .lte('start_time', `${date}T23:59:59`);

  // 3. Run all fetches in parallel
  const [operationsData, drivers, shiftsResult] = await Promise.all([
    getDailyOperations(date, reservations),
    getVegasShuttleDrivers(),
    shiftsQuery
  ]);

  const todaysShifts = shiftsResult.data || [];

  return (
    <Suspense fallback={<LoadingModal />}>
      <BizContent
        date={date}
        dcos={dcos}
        role={role}
        full_name={user[0].full_name}
        reservations={reservations}
        yesterday={yesterday}
        tomorrow={tomorrow}
        activeFleet={operationsData.activeFleet}
        reservationStatusMap={operationsData.reservationStatusMap}
        hourlyUtilization={operationsData.hourlyUtilization}
        drivers={drivers}
        todaysShifts={todaysShifts} 
      />
    </Suspense>
  );
}