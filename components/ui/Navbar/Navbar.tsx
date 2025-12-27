import { createClient } from '@/utils/supabase/server';
import Navlinks from './Navlinks';
import {
  fetchTimeEntryByUserId,
  getUser,
  getUserDetails
} from '@/utils/supabase/queries';
import { TimeEntry } from '@/app/account/page';

export async function getServerSideProps() {
  const supabase =  await createClient();
  const user = await getUserDetails(supabase);

  return {
    props: { user }
  };
}

export default async function Navbar() {
  const supabase =  await createClient();
  const user = await getUserDetails(supabase); // Expecting user to be of type UserType | null
  const usr = await getUser(supabase);
  const clockinStatus =
    user && (user[0]?.time_entry_status as string | null | undefined);
  const timeEntry = user
    ? await fetchTimeEntryByUserId(supabase, user[0]?.id)
    : null;
  // ✅ NEW (Safe for Arrays and Objects)
const timeEnt = user ? (timeEntry as unknown as TimeEntry[]) : null;

// Helper to grab the data safely
const rawClockIn = timeEnt?.[0]?.clock_in;

const clockInTimeStamp = user
  ? Array.isArray(rawClockIn)
    ? rawClockIn[0]?.clock_in_time // If Array, grab first item
    : rawClockIn?.clock_in_time    // If Object, grab property directly
  : undefined;
  return (
    // Reduced height: Changed p-2 (padding: 0.5rem/8px) to p-1 (0.25rem/4px) to shorten the nav bar vertically.
    // Also added explicit h-12 (48px) to cap the height, overriding h-fit. This makes the bar take less space (~64px to ~48px total).
    // Kept semi-transparency (bg-background/95 backdrop-blur) intact. If content overflows, adjust child elements in Navlinks.tsx (e.g., reduce font sizes or padding).
    <nav className="z-50 w-[99.7%] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 h-12 p-1">
      <Navlinks
        user={user ? user[0] : null}
        usr={usr}
        status={clockinStatus}
        clockInTimeStamp={clockInTimeStamp}
      />
    </nav>
  );
}