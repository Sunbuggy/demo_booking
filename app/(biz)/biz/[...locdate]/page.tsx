// app/(biz)/biz/[...locdate]/page.tsx
// This is the new Pismo Beach operations board route: /biz/pismo/2025-12-20
// It uses a mandatory catch-all segment [...locdate] to avoid any routing conflicts with:
//   - Existing legacy /biz/[date] → Las Vegas board (old DB, untouched)
//   - Any static /biz page
// Data is fetched safely from the NEW Supabase database — no impact on legacy Las Vegas reservations.

import { notFound, redirect } from 'next/navigation';
import dayjs from 'dayjs';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// CORRECT IMPORT: Use your project's server client creator
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Always fetch fresh data — important for live ops board

/**
 * Fetches all Pismo Beach reservations for a given date from the NEW Supabase database.
 * 
 * This is a server action (read-only) that:
 * - Uses the project's official server Supabase client (from utils/supabase/server.ts)
 * - Authenticates via the public anon key + cookie handling (safe for authenticated staff)
 * - Filters explicitly to 'pismo' location for data isolation
 * - Returns typed data or empty array on error
 * 
 * No writes occur — completely safe and isolated from the old legacy database.
 */
async function fetchPismoReservations(date: string) {
  'use server';

  // Create the Supabase client using your project's standard server setup
  // This handles cookies properly for session/auth (e.g., logged-in dispatcher)
  const supabase = await createClient();

  // TODO: Confirm your actual table name — likely 'reservations' or 'bookings'
  // TODO: Confirm column names:
  //   - Date column: 'date' or 'sch_date'?
  //   - Time column: 'time' or 'start_time'?
  //   - Location value: 'pismo', 'pismobeach', 'pismo_beach'?
  const { data, error } = await supabase
    .from('reservations')           // ← Change if your table is named differently
    .select('*')
    .eq('date', date)               // ← Change to .eq('sch_date', date) if needed
    .eq('location', 'pismo')        // ← Adjust if location stored differently
    .order('time', { ascending: true }); // ← Adjust 'time' column name if needed

  if (error) {
    console.error('Error fetching Pismo reservations from Supabase:', error.message);
    // You could add Sentry/loggin here later
    return [];
  }

  // Type safety: data is any[] unless you define an interface
  // We'll cast or define types later when building the full board
  return data || [];
}

export default async function PismoBoardPage({
  params,
}: {
  params: Promise<{ locdate: string[] }>;
}) {
  const { locdate } = await params;

  // Mandatory catch-all requires at least one segment
  // We expect exactly two: ['pismo', '2025-12-20']
  if (locdate.length !== 2) {
    notFound();
  }

  const [locationSlug, dateStr] = locdate;

  // Validate date format to prevent bad URLs
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    redirect('/biz/calendar');
  }

  const date = dateStr;

  // Only allow 'pismo' for now — easy to extend later
  if (locationSlug !== 'pismo') {
    notFound();
  }

  // Fetch live data from Supabase
  const reservations = await fetchPismoReservations(date);

  // Calculate navigation dates
  const yesterday = dayjs(date).subtract(1, 'day').format('YYYY-MM-DD');
  const tomorrow = dayjs(date).add(1, 'day').format('YYYY-MM-DD');

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with date navigation */}
        <div className="flex justify-between items-center mb-8">
          <Button variant="outline" asChild>
            <Link href={`/biz/pismo/${yesterday}`}>
              ← Previous Day
            </Link>
          </Button>

          <h1 className="text-4xl font-bold">
            Pismo Beach Operations Board — {dayjs(date).format('dddd, MMMM D, YYYY')}
          </h1>

          <Button variant="outline" asChild>
            <Link href={`/biz/pismo/${tomorrow}`}>
              Next Day →
            </Link>
          </Button>
        </div>

        {/* Navigation helpers */}
        <div className="flex gap-4 mb-8">
          <Button variant="outline" asChild>
            <Link href="/biz/calendar">Operations Calendar</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/biz/${date}`}>← Switch to Las Vegas Board</Link>
          </Button>
        </div>

        {/* Main content area */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">
            {reservations.length} Reservation(s) Found for {date}
          </h2>

          {reservations.length === 0 ? (
            <div className="text-gray-400 py-8 text-center">
              <p className="text-xl">No bookings yet for this date in Pismo Beach.</p>
              <p className="mt-4">Customers arrive on-site and rent vehicles by the hour.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Temporary detailed view — replace with proper hourly grid later */}
              <pre className="text-sm bg-black p-4 rounded overflow-x-auto">
                {JSON.stringify(reservations, null, 2)}
              </pre>
            </div>
          )}

          <p className="text-sm text-gray-500 mt-8 border-t border-gray-700 pt-4">
            This is a temporary debug view to confirm Supabase connection and data flow.<br />
            Next step: Build the full Pismo hourly rental board with vehicle availability, customer list, and SST support flags.
          </p>
        </div>
      </div>
    </div>
  );
}