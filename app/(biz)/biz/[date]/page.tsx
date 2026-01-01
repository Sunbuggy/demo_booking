import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import dayjs from 'dayjs';
import { RiArrowLeftWideFill, RiArrowRightWideFill } from 'react-icons/ri';
import { Button } from '@/components/ui/button';
import LoadingModal from '../vegas/components/loading-modal';
import Landing from '../vegas/components/landing';
import { createClient } from '@/utils/supabase/server';
import { 
  getUserDetails, 
  fetchShuttlesOnly // *** NEW: Import the shuttle fetcher ***
} from '@/utils/supabase/queries';
import { Reservation } from '../types';
import { getTimeSortedData } from '@/utils/old_db/helpers';
import { getDailyOperations } from '@/app/actions/shuttle-operations'; 
import { getVegasShuttleDrivers } from '@/app/actions/user-actions'; 

// IMPORT THE NEW GLOBAL LISTENER
import RealtimeGroupsListener from '../vegas/components/realtime-groups-listener';

export const dynamic = 'force-dynamic';

/**
 * Server Action: Fetch legacy reservations from MySQL.
 * Wrapped in try/catch to ensure page doesn't crash if legacy DB is unreachable.
 */
async function fetchReservationsForDate(date: string): Promise<Reservation[]> {
  'use server';
  try {
    const { fetch_from_old_db } = await import('@/utils/old_db/actions');
    const query = `SELECT * FROM reservations_modified WHERE sch_date = '${date}'`;
    const data = (await fetch_from_old_db(query)) as Reservation[];
    return data || [];
  } catch (error) {
    console.error('CRITICAL: Error fetching legacy reservations:', error);
    return []; // Return empty array to allow page to render partially
  }
}

/**
 * Component: BizContent
 * Handles the visual rendering of the dashboard.
 */
function BizContent({
  date, dcos, role, full_name, reservations, yesterday, tomorrow,
  activeFleet, reservationStatusMap, hourlyUtilization, drivers,
  todaysShifts,
  realFleet // *** NEW: Accept the real fleet data prop ***
}: any) {
  const hasReservations = reservations.length > 0;
  let sortedData = hasReservations ? getTimeSortedData(reservations) : null;

  // Sort data by time if valid
  if (Array.isArray(sortedData)) {
    sortedData = sortedData.sort((a: any, b: any) => {
      const timeA = parseInt(a.time || a.key || a, 10); 
      const timeB = parseInt(b.time || b.key || b, 10);
      return timeA - timeB;
    });
  } 

  return (
    <div className="min-h-screen w-full flex flex-col gap-5 relative bg-slate-50/50 dark:bg-slate-950">
      
      {/* --- GLOBAL REALTIME LISTENER --- */}
      <RealtimeGroupsListener />

      {/* --- FLOATING DATE NAVIGATION --- */}
      {/* Visible to all authorized staff (Level 300+) */}
      {role >= 300 && (
        <div className="sticky top-2 z-50 mx-auto w-fit flex justify-center">
          <div className="flex gap-4 items-center bg-slate-950/90 backdrop-blur-md border border-slate-700/50 rounded-xl px-4 py-1.5 shadow-2xl">
            {/* Prev Day */}
            <Link 
              href={`/biz/${yesterday}${dcos ? '?dcos=true' : ''}`}
              className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded-full"
            >
              <RiArrowLeftWideFill className="text-2xl" />
            </Link>

            {/* Calendar Indicator */}
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

      {/* --- MAIN CONTENT AREA --- */}
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
          realFleet={realFleet} // *** NEW: Pass realFleet down to Landing ***
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 mt-20">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <h2 className="text-2xl font-semibold mb-2 text-slate-700 dark:text-slate-300">
              No Reservations Found
            </h2>
            <p className="text-slate-500">
              There are no bookings scheduled for {dayjs(date).format('MMMM D, YYYY')}.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Page: BizPage
 * The main entry point for the NV Dashboard.
 */
export default async function BizPage({ params, searchParams }: any) {
  // 1. Await Next.js 15 params (crucial to avoid build errors)
  const { date } = await params;
  const search = await searchParams;
  const dcos = search.dcos === 'true';

  // 2. Validate Date Parameter
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) redirect('/biz/calendar');

  // 3. Authenticate User
  const supabase = await createClient(); 
  const user = await getUserDetails(supabase);
  
  // Redirect to login if session is invalid
  if (!user || !user[0]) redirect('/signin');

  // 4. Permission Check (The Fix)
  // Ensure role is a number. Check strictly for < 300 to allow employees (300+).
  const role = Number(user[0].user_level ?? 0);
  
  if (role < 300) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-200 gap-4">
        <h1 className="text-3xl font-bold text-red-500">Access Denied</h1>
        <p className="text-slate-400">You need Employee Access (Level 300+) to view the Dashboard.</p>
        <Link href="/">
          <Button variant="outline">Return Home</Button>
        </Link>
      </div>
    );
  }

  // 5. Calculate Navigation Dates
  const yesterday = dayjs(date).subtract(1, 'day').format('YYYY-MM-DD');
  const tomorrow = dayjs(date).add(1, 'day').format('YYYY-MM-DD');

  try {
    // 6. Data Fetching
    // Initiate Legacy DB fetch first
    const reservationsPromise = fetchReservationsForDate(date);
    
    // Prepare Supabase Shifts Query
    const shiftsQuery = supabase
      .from('employee_schedules')
      .select('user_id, role, location, task')
      .gte('start_time', `${date}T00:00:00`)
      .lte('start_time', `${date}T23:59:59`);

    // Await legacy data (needed for operations calculation)
    const reservations = await reservationsPromise;

    // Run remaining independent fetches in parallel
    const [operationsData, drivers, shiftsResult, shuttles] = await Promise.all([
      getDailyOperations(date, reservations),
      getVegasShuttleDrivers(),
      shiftsQuery,
      fetchShuttlesOnly(supabase) // *** NEW: Fetch real shuttles in parallel ***
    ]);

    const todaysShifts = shiftsResult.data || [];

    // 7. Render
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
          realFleet={shuttles} // *** NEW: Pass fetched data to the component ***
        />
      </Suspense>
    );

  } catch (error) {
    console.error('Error loading BizPage data:', error);
    // Fallback UI in case of data fetch failure (prevents white screen of death)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h2 className="text-xl font-bold text-red-600">System Error</h2>
        <p>Could not load daily operations. Please try refreshing.</p>
      </div>
    );
  }
}