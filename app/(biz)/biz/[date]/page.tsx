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
  fetchShuttlesOnly 
} from '@/utils/supabase/queries';
import { Reservation } from '../types';
import { getTimeSortedData } from '@/utils/old_db/helpers';
import { getDailyOperations } from '@/app/actions/shuttle-operations'; 
import { getVegasShuttleDrivers } from '@/app/actions/user-actions'; 
import RealtimeGroupsListener from '../vegas/components/realtime-groups-listener';

// --- WEATHER INTEGRATION ---
import { getLocationWeather } from '@/app/actions/weather';
import DashboardWeatherPill from '../vegas/components/dashboard-weather-pill';

export const dynamic = 'force-dynamic';

/**
 * Server Action: Fetch legacy reservations from MySQL.
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
    return []; 
  }
}

/**
 * Component: BizContent
 * Handles the visual rendering of the dashboard.
 */
function BizContent({
  date, dcos, role, full_name, reservations, yesterday, tomorrow,
  activeFleet, reservationStatusMap, hourlyUtilization, drivers,
  todaysShifts, realFleet, weatherData
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
    <div className="min-h-screen w-full flex flex-col gap-5 relative bg-slate-50/50 dark:bg-slate-950">
      
      {/* --- GLOBAL REALTIME LISTENER --- */}
      <RealtimeGroupsListener />

      {/* --- FLOATING DATE NAVIGATION & WEATHER (COMPACT VERSION) --- */}
      {role >= 300 && (
        <div className="sticky top-16 z-50 mx-auto w-full max-w-[98vw] flex justify-center pointer-events-none">
          {/* Pointer events auto allows clicking buttons but lets clicks pass through the empty sides */}
          <div className="pointer-events-auto flex flex-row items-center justify-center gap-1 sm:gap-4 bg-slate-950/90 backdrop-blur-md border border-slate-700/50 rounded-xl px-2 py-1.5 shadow-xl mt-2">
            
            {/* 1. Date Navigation Group */}
            <div className="flex items-center gap-1 sm:gap-2">
                {/* Prev Day */}
                <Link 
                  href={`/biz/${yesterday}${dcos ? '?dcos=true' : ''}`}
                  className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded-full"
                >
                  <RiArrowLeftWideFill className="text-xl sm:text-2xl" />
                </Link>

                {/* Calendar Button (Compact Text on Mobile) */}
                <Link href="/biz/calendar">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="font-mono font-bold h-7 px-2 bg-transparent text-slate-200 hover:bg-slate-800 hover:text-white text-xs sm:text-sm"
                  >
                    {/* Mobile: "Jan 10" | Desktop: "Sat, Jan 10, 2026" */}
                    <span className="sm:hidden">{dayjs(date).format('MMM D')}</span>
                    <span className="hidden sm:inline">{dayjs(date).format('ddd, MMM D, YYYY')}</span>
                  </Button>
                </Link>

                {/* Next Day */}
                <Link 
                  href={`/biz/${tomorrow}${dcos ? '?dcos=true' : ''}`}
                  className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded-full"
                >
                  <RiArrowRightWideFill className="text-xl sm:text-2xl" />
                </Link>
            </div>

            {/* 2. Weather Pill (Inline) */}
            {weatherData && (
              <>
                {/* Vertical Divider */}
                <div className="h-5 w-px bg-slate-700/50 mx-0.5" />
                
                {/* Weather Pill */}
                <div className="flex-shrink-0 scale-90 sm:scale-100 origin-left">
                    <DashboardWeatherPill data={weatherData} location="Las Vegas" />
                </div>
              </>
            )}

          </div>
        </div>
      )}

      {/* --- MAIN CONTENT AREA --- */}
      <div className="w-full">
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
            realFleet={realFleet}
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
    </div>
  );
}

/**
 * Page: BizPage
 * The main entry point for the NV Dashboard.
 */
export default async function BizPage({ params, searchParams }: any) {
  const { date } = await params;
  const search = await searchParams;
  const dcos = search.dcos === 'true';

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) redirect('/biz/calendar');

  const supabase = await createClient(); 
  const user = await getUserDetails(supabase);
  
  if (!user || !user[0]) redirect('/signin');

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

  const yesterday = dayjs(date).subtract(1, 'day').format('YYYY-MM-DD');
  const tomorrow = dayjs(date).add(1, 'day').format('YYYY-MM-DD');

  try {
    const reservationsPromise = fetchReservationsForDate(date);
    
    const shiftsQuery = supabase
      .from('employee_schedules')
      .select('user_id, role, location, task')
      .gte('start_time', `${date}T00:00:00`)
      .lte('start_time', `${date}T23:59:59`);

    const reservations = await reservationsPromise;

    const [operationsData, drivers, shiftsResult, shuttles, weatherResult] = await Promise.all([
      getDailyOperations(date, reservations),
      getVegasShuttleDrivers(),
      shiftsQuery,
      fetchShuttlesOnly(supabase),
      getLocationWeather('Las Vegas', date, 1) 
    ]);

    const todaysShifts = shiftsResult.data || [];
    const dailyWeather = weatherResult && weatherResult.length > 0 ? weatherResult[0] : null;

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
          realFleet={shuttles}
          weatherData={dailyWeather}
        />
      </Suspense>
    );

  } catch (error) {
    console.error('Error loading BizPage data:', error);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h2 className="text-xl font-bold text-red-600">System Error</h2>
        <p>Could not load daily operations. Please try refreshing.</p>
      </div>
    );
  }
}