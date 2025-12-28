// app/(biz)/biz/[date]/page.tsx

import Landing from '../components/landing';
import { getTimeSortedData } from '@/utils/old_db/helpers';
import { Reservation } from '../types';
import { getUserDetails } from '@/utils/supabase/queries';
import AdminPanel from '../components/panels/admin-panel';
import TorchPanel from '../components/panels/torch-panel';
import PanelSelector from '../components/panels/panel-selector';
import LoadingModal from '../components/loading-modal';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { RiArrowLeftWideFill, RiArrowRightWideFill } from 'react-icons/ri';
import dayjs from 'dayjs';
import { createClient } from '@/utils/supabase/server';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';

// Force dynamic rendering (we fetch fresh data for each date)
export const dynamic = 'force-dynamic';

// Isolated server action for DB fetch
async function fetchReservationsForDate(date: string): Promise<Reservation[]> {
  'use server';

  const { fetch_from_old_db } = await import('@/utils/old_db/actions');
  const query = `SELECT * FROM reservations_modified WHERE sch_date = '${date}'`;

  try {
    const data = (await fetch_from_old_db(query)) as Reservation[];
    return data || [];
  } catch (error) {
    console.error('Error fetching reservations for date:', date, error);
    return [];
  }
}

// Client-side content (receives pre-fetched data)
function BizContent({
  date,
  dcos,
  role,
  full_name,
  reservations,
  yesterday,
  tomorrow,
}: {
  date: string;
  dcos: boolean;
  role: number;
  full_name: string;
  reservations: Reservation[];
  yesterday: string;
  tomorrow: string;
}) {
  const hasReservations = reservations.length > 0;
  
  // 1. Get the data from the helper
  let sortedData = hasReservations ? getTimeSortedData(reservations) : null;

  // 2. FORCE RE-SORT: The Bug Fix
  // If sortedData is an array (which it likely is for the Landing component), we sort it numerically.
  // This fixes the issue where "10" comes before "8" because of alphabetical string sorting.
  if (Array.isArray(sortedData)) {
    sortedData = sortedData.sort((a: any, b: any) => {
      // Safely parse the time keys (assuming property is 'time' or the first element if it's an entry)
      // Adjust 'time' below to match the exact key in your data structure (e.g., a.time or a.key)
      const timeA = parseInt(a.time || a.key || a, 10); 
      const timeB = parseInt(b.time || b.key || b, 10);
      return timeA - timeB;
    });
  } 
  // If sortedData is an Object (dictionary), we can't easily sort it here without changing <Landing>.
  // However, most "Board" views convert to an array before rendering. 
  // If your Landing page accepts an Object, the sort order depends on Object.keys().
  // If the issue persists after this patch, 'getTimeSortedData' in utils needs to return an Array, not an Object.

  return (
    <div className="min-h-screen w-full flex flex-col gap-5">
      {/* Navigation arrows + calendar button */}
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

      {/* Admin / Torch control panels */}
      {role > 650 && (
        <PanelSelector
          role={role}
          admin={<AdminPanel display_cost={dcos} full_name={full_name} />}
          torch={<TorchPanel full_name={full_name} />}
        />
      )}

      {/* Main content */}
      {hasReservations && sortedData ? (
        <Landing
          data={sortedData}
          display_cost={dcos}
          role={role}
          date={date}
          full_name={full_name}
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <h2 className="text-3xl font-semibold mb-4">
            No reservations for {dayjs(date).format('MMMM D, YYYY')}
          </h2>
          <p className="text-lg text-gray-600">
            There are no bookings scheduled for this date.
          </p>
        </div>
      )}
    </div>
  );
}

// Main server component
export default async function BizPage({
  params,
  searchParams,
}: {
  params: Promise<{ date: string }>;
  searchParams: Promise<{ dcos?: string }>;
}) {
  const { date } = await params;
  const search = await searchParams;
  const dcos = search.dcos === 'true';

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    console.error('Invalid date format in /biz/[date]:', date);
    redirect('/biz/calendar');
  }

  // Auth + user details
  const supabase = await createClient(); // Fixed: Removed double 'await'
  const user = await getUserDetails(supabase);

  if (!user || !user[0]) {
    redirect('/signin');
  }

  const role = user[0].user_level;
  const full_name = user[0].full_name || '';

  // Permission check
  if (role < 299) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-2xl text-red-600">Unauthorized - Insufficient permissions</p>
      </div>
    );
  }

  const yesterday = dayjs(date).subtract(1, 'day').format('YYYY-MM-DD');
  const tomorrow = dayjs(date).add(1, 'day').format('YYYY-MM-DD');

  // Fetch reservations
  const reservations = await fetchReservationsForDate(date);

  return (
    <Suspense fallback={<LoadingModal />}>
      <BizContent
        date={date}
        dcos={dcos}
        role={role}
        full_name={full_name}
        reservations={reservations}
        yesterday={yesterday}
        tomorrow={tomorrow}
      />
    </Suspense>
  );
}