import Landing from '../components/landing';
import { getTimeSortedData } from '@/utils/old_db/helpers';
import { Reservation } from '../types';
import { getUserDetails } from '@/utils/supabase/queries';
import AdminPanel from '../components/panels/admin-panel';
import Link from 'next/link';
import TorchPanel from '../components/panels/torch-panel';
import PanelSelector from '../components/panels/panel-selector';
import { Button } from '@/components/ui/button';
import { RiArrowLeftWideFill, RiArrowRightWideFill } from 'react-icons/ri';
import dayjs from 'dayjs';
import { createClient } from '@/utils/supabase/server';
import LoadingModal from '../components/loading-modal';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

// Separate the database fetch to avoid hydration issues
async function fetchReservationsForDate(date: string): Promise<Reservation[]> {
  'use server';
  
  // Import inside the function to avoid server action issues
  const { fetch_from_old_db } = await import('@/utils/old_db/actions');
  
  const query = `SELECT * FROM reservations_modified WHERE sch_date = '${date}'`;
  try {
    const data = await fetch_from_old_db(query) as Reservation[];
    return data || [];
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return [];
  }
}

// Client component wrapper for the main content
function BizContent({
  date,
  dcos,
  role,
  full_name,
  reservations,
  yesterday,
  tomorrow
}: {
  date: string;
  dcos: boolean;
  role: number;
  full_name: string;
  reservations: Reservation[];
  yesterday: string;
  tomorrow: string;
}) {
  if (!reservations || reservations.length === 0) {
    return (
      <div className="min-h-screen w-full flex flex-col gap-5 justify-center items-center">
        {role && role > 299 && (
          <div className="flex gap-2 justify-center items-center">
            <Link
              href={`/biz/${yesterday}${dcos ? '?dcos=true' : ''}`}
              passHref
            >
              <RiArrowLeftWideFill />
            </Link>
            <Link href="/biz/calendar" passHref>
              <Button>{date}</Button>
            </Link>
            <Link
              href={`/biz/${tomorrow}${dcos ? '?dcos=true' : ''}`}
              passHref
            >
              <RiArrowRightWideFill />
            </Link>
          </div>
        )}
        
        {role && role > 650 && (
          <PanelSelector
            role={role}
            admin={
              <AdminPanel display_cost={dcos} full_name={full_name || ''} />
            }
            torch={<TorchPanel full_name={full_name || ''} />}
          />
        )}

        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">No reservations for {date}</h2>
          <p>There are no bookings scheduled for this date.</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<LoadingModal />}>
      <ReservationsList 
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

// Separate component for the reservations list
async function ReservationsList({
  date,
  dcos,
  role,
  full_name,
  reservations,
  yesterday,
  tomorrow
}: {
  date: string;
  dcos: boolean;
  role: number;
  full_name: string;
  reservations: Reservation[];
  yesterday: string;
  tomorrow: string;
}) {
  const loadedData = reservations && (await getTimeSortedData(reservations));
  
  return (
    <div className="min-h-screen w-full flex flex-col gap-5">
      {role && role > 299 && (
        <div className="flex gap-2 justify-center items-center">
          <Link
            href={`/biz/${yesterday}${dcos ? '?dcos=true' : ''}`}
            passHref
          >
            <RiArrowLeftWideFill />
          </Link>
          <Link href="/biz/calendar" passHref>
            <Button>{date}</Button>
          </Link>
          <Link
            href={`/biz/${tomorrow}${dcos ? '?dcos=true' : ''}`}
            passHref
          >
            <RiArrowRightWideFill />
          </Link>
        </div>
      )}
      {role && role > 650 && (
        <PanelSelector
          role={role}
          admin={
            <AdminPanel display_cost={dcos} full_name={full_name || ''} />
          }
          torch={<TorchPanel full_name={full_name || ''} />}
        />
      )}

      {loadedData && role && role > 299 ? (
        <Landing
          data={loadedData}
          display_cost={dcos}
          role={role}
          date={date}
          full_name={full_name || ''}
        />
      ) : role && role < 299 ? (
        <div className="h-screen flex justify-center items-center">
          unauthorized
        </div>
      ) : !role ? (
        <div className="h-screen flex justify-center items-center gap-2">
          Please{' '}
          <Link
            href="/signin"
            className={`inline-flex items-center leading-6 font-medium transition ease-in-out duration-75 cursor-pointer dark:text-yellow-500 text-black rounded-md h-[36px] underline`}
          >
            Sign In
          </Link>
        </div>
      ) : (
        <div className="h-screen flex justify-center items-center">
          <LoadingModal />
        </div>
      )}
    </div>
  );
}

// Main page component
const BizPage = async ({
  params,
  searchParams
}: {
  params: Promise<{ date: string }>;
  searchParams: Promise<{ dcos?: string; torchc?: string; admc?: string }>; 
}) => {
  // Unwrap params
  const unwrappedParams = await params;
  const unwrappedSearchParams = await searchParams;
  
  const date = unwrappedParams.date;
  const dcos = unwrappedSearchParams.dcos === 'true';
  
  // Validate date format
  const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateFormatRegex.test(date)) {
    console.error('Invalid date format. Expected format: yyyy-dd-mm');
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Date Format</h1>
          <p className="text-gray-600">Expected format: yyyy-mm-dd</p>
          <Link href="/biz/calendar" className="text-blue-500 hover:underline mt-4 inline-block">
            Go to Calendar
          </Link>
        </div>
      </div>
    );
  }

  // Get user info
  const supabase = await createClient();
  const typedSupabase = supabase as any;
  const user = await getUserDetails(typedSupabase);

  if (!user || !user[0]) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <Link
            href="/signin"
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const role = user[0]?.user_level;
  const full_name = user[0]?.full_name || '';
  const yesterday = dayjs(date).subtract(1, 'day').format('YYYY-MM-DD');
  const tomorrow = dayjs(date).add(1, 'day').format('YYYY-MM-DD');

  // Fetch reservations
  const reservations = await fetchReservationsForDate(date);

  // If no role (shouldn't happen since we checked user), show loading
  if (!role) {
    return <LoadingModal />;
  }

  // If role is too low, show unauthorized
  if (role < 299) {
    return (
      <div className="h-screen flex justify-center items-center">
        Unauthorized - You don't have permission to view this page
      </div>
    );
  }

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
};

export default BizPage;