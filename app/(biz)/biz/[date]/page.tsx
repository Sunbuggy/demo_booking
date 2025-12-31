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
    <div className="min-h-screen w-full flex flex-col gap-5">
      {role > 299 && (
        <div className="flex gap-4 justify-center items-center pt-6">
          <Link href={`/biz/${yesterday}${dcos ? '?dcos=true' : ''}`}>
            <RiArrowLeftWideFill className="text-4xl hover:text-gray-600 transition" />
          </Link>
          <Link href="/biz/calendar">
            <Button variant="outline" size="lg">
              {dayjs(date).format('dddd, MMMM D, YYYY')}
            </Button>
          </Link>
          <Link href={`/biz/${tomorrow}${dcos ? '?dcos=true' : ''}`}>
            <RiArrowRightWideFill className="text-4xl hover:text-gray-600 transition" />
          </Link>
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
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <h2 className="text-3xl font-semibold mb-4">No reservations for {dayjs(date).format('MMMM D, YYYY')}</h2>
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

  const reservations = await fetchReservationsForDate(date);
  
  const [operationsData, drivers] = await Promise.all([
    getDailyOperations(date, reservations),
    getVegasShuttleDrivers()
  ]);

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
      />
    </Suspense>
  );
}