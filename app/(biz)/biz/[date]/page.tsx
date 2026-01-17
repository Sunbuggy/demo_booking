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

// --- NEW UNIFIED FETCHER (Hybrid) ---
import { getUnifiedDashboardData } from '../vegas/lib/fetch-unified-dashboard';

// --- GROUPS DATA FETCHER ---
import { fetchDailyGroupsData } from '../vegas/lib/fetch-groups-data';

// --- WEATHER INTEGRATION ---
import { getLocationWeather } from '@/app/actions/weather';
import DashboardWeatherPill from '../vegas/components/dashboard-weather-pill';

export const dynamic = 'force-dynamic';

// [CONFIG] The UUID for Las Vegas in Supabase
const VEGAS_LOCATION_ID = 'c29cdc8e-8f16-4bc4-987c-e869dcebd6e3';

/**
 * Helper: Deep Sanitize
 * Removes database prototypes (like RowDataPacket) so data can be passed
 * to Client Components without the "Only plain objects" error.
 */
function deepSanitize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

/**
 * Component: BizContent
 * Handles the visual rendering of the dashboard.
 */
function BizContent({
  date, display_cost, role, full_name, reservations, yesterday, tomorrow,
  activeFleet, reservationStatusMap, hourlyUtilization, drivers,
  todaysShifts, realFleet, weatherData, groupsData 
}: any) {
  const hasReservations = reservations.length > 0;
  
  // Use the existing helper to group the Unified Data by Hour
  let sortedData = hasReservations ? getTimeSortedData(reservations) : null;

  // ------------------------------------
  // [FIX] Updated sorting logic to handle 12-hour format (AM/PM) correctly.
  if (Array.isArray(sortedData)) {
    sortedData = sortedData.sort((a: any, b: any) => {
      // 1. Extract the time string (e.g., "08:00 AM" or "2:00 PM")
      const timeStrA = a.time || a.key || a;
      const timeStrB = b.time || b.key || b;

      // 2. Parse using DayJS with the context of the current date.
      const dateA = dayjs(`${date} ${timeStrA}`);
      const dateB = dayjs(`${date} ${timeStrB}`);

      // 3. Compare timestamps
      return dateA.valueOf() - dateB.valueOf();
    });
  } 

  return (
    <div className="min-h-screen w-full flex flex-col gap-5 relative bg-background">
      
      {/* --- GLOBAL REALTIME LISTENER --- */}
      <RealtimeGroupsListener />

      {/* --- FLOATING DATE NAVIGATION & WEATHER --- */}
      {role >= 300 && (
        <div className="sticky top-16 z-50 mx-auto w-full max-w-[98vw] flex justify-center pointer-events-none">
          <div className="pointer-events-auto flex flex-row items-center justify-center gap-1 sm:gap-4 bg-popover/95 backdrop-blur-md border border-border rounded-xl px-2 py-1.5 shadow-xl mt-2 text-popover-foreground">
            
            {/* 1. Date Navigation Group */}
            <div className="flex items-center gap-1 sm:gap-2">
                {/* Prev Day */}
                <Link 
                  href={`/biz/${yesterday}`}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-accent rounded-full"
                >
                  <RiArrowLeftWideFill className="text-xl sm:text-2xl" />
                </Link>

                {/* Calendar Button */}
                <Link href="/biz/calendar">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="font-mono font-bold h-7 px-2 bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground text-xs sm:text-sm"
                  >
                    <span className="sm:hidden">{dayjs(date).format('MMM D')}</span>
                    <span className="hidden sm:inline">{dayjs(date).format('ddd, MMM D, YYYY')}</span>
                  </Button>
                </Link>

                {/* Next Day */}
                <Link 
                  href={`/biz/${tomorrow}`}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-accent rounded-full"
                >
                  <RiArrowRightWideFill className="text-xl sm:text-2xl" />
                </Link>
            </div>

            {/* 2. Weather Pill (Inline) */}
            {weatherData && (
              <>
                <div className="h-5 w-px bg-border mx-0.5" />
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
            data={deepSanitize(sortedData)}
            display_cost={display_cost}
            role={role}
            date={date}
            full_name={full_name} 
            activeFleet={deepSanitize(activeFleet)}
            reservationStatusMap={deepSanitize(reservationStatusMap)}
            hourlyUtilization={deepSanitize(hourlyUtilization)}
            drivers={deepSanitize(drivers)}
            todaysShifts={deepSanitize(todaysShifts)} 
            realFleet={deepSanitize(realFleet)}
            groupsData={deepSanitize(groupsData)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 mt-20">
            <div className="bg-card p-8 rounded-2xl shadow-sm border border-border">
              <h2 className="text-2xl font-semibold mb-2 text-foreground">
                No Reservations Found
              </h2>
              <p className="text-muted-foreground">
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
  
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) redirect('/biz/calendar');

  const supabase = await createClient(); 
  const user = await getUserDetails(supabase);
  
  if (!user || !user[0]) redirect('/signin');

  const role = Number(user[0].user_level ?? 0);
  
  if (role < 300) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground gap-4">
        <h1 className="text-3xl font-bold text-red-500">Access Denied</h1>
        <p className="text-muted-foreground">You need Employee Access (Level 300+) to view the Dashboard.</p>
        <Link href="/">
          <Button variant="outline">Return Home</Button>
        </Link>
      </div>
    );
  }

  // --- PREFERENCE & PROFILE FETCHING ---
  let showFinancials = role >= 500; 
  let displayName = user[0].full_name; 
  
  try {
    const { data: userExtraData } = await supabase
      .from('users')
      .select('preferences, stage_name') 
      .eq('id', user[0].id)
      .single();
      
    if (userExtraData?.preferences && typeof userExtraData.preferences.show_financials !== 'undefined') {
      showFinancials = userExtraData.preferences.show_financials;
    }
    if (userExtraData?.stage_name) {
      displayName = userExtraData.stage_name;
    }

  } catch (err) {
    console.warn('Could not fetch user extra data, using defaults.');
  }

  if (search.dcos === 'true') showFinancials = true;
  if (role < 500) showFinancials = false; 

  const yesterday = dayjs(date).subtract(1, 'day').format('YYYY-MM-DD');
  const tomorrow = dayjs(date).add(1, 'day').format('YYYY-MM-DD');

  try {
    // --- PARALLEL DATA FETCHING ---
    // 1. Kick off all requests
    const [
      unifiedReservations, // <--- REPLACES old 'reservationsPromise'
      drivers,
      shiftsResult,
      shuttles,
      weatherResult,
      groupsData
    ] = await Promise.all([
      // Fetch Hybrid Data (MySQL + Supabase)
      getUnifiedDashboardData(date, VEGAS_LOCATION_ID),
      getVegasShuttleDrivers(),
      supabase
        .from('employee_schedules')
        .select('user_id, role, location, task')
        .gte('start_time', `${date}T00:00:00`)
        .lte('start_time', `${date}T23:59:59`),
      fetchShuttlesOnly(supabase),
      getLocationWeather('Las Vegas', date, 1),
      fetchDailyGroupsData(date) 
    ]);

    // 2. Calculate Operations (Fleet Usage) based on the UNIFIED list
    // This works because we mapped the Supabase data to match the Legacy shape
    const operationsData = await getDailyOperations(date, unifiedReservations as any[]);

    const todaysShifts = shiftsResult.data || [];
    const dailyWeather = weatherResult && weatherResult.length > 0 ? weatherResult[0] : null;

    return (
      <Suspense fallback={<LoadingModal />}>
        <BizContent
          date={date}
          display_cost={showFinancials} 
          role={role}
          full_name={displayName} 
          reservations={unifiedReservations} // <--- Pass the hybrid list
          yesterday={yesterday}
          tomorrow={tomorrow}
          activeFleet={operationsData.activeFleet}
          reservationStatusMap={operationsData.reservationStatusMap}
          hourlyUtilization={operationsData.hourlyUtilization}
          drivers={drivers}
          todaysShifts={todaysShifts}
          realFleet={shuttles}
          weatherData={dailyWeather}
          groupsData={groupsData}
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