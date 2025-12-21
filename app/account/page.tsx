// app/account/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { fetchTimeEntryByUserId } from '@/utils/supabase/queries';
import ClockinForm from '@/components/ui/AccountForms/ClockinForm';
// Ensure this import path matches where your file actually is!
import BackgroundPickerButton from './components/background-picker-button';
// Absolute path prevents "Module Not Found" errors
import UserPage from '@/app/(biz)/biz/users/[id]/page';

// Define the shape of your time entry data
export type TimeEntry = {
  id: any;
  date: any;
  clock_in: {
    clock_in_time: any;
    lat: any;
    long: any;
  };
  clock_out: {
    clock_out_time: any;
    lat: any;
    long: any;
  };
};

export default async function Account() {
  const supabase = await createClient();

  // 1. Auto clock-out maintenance
  try {
    const { error } = await supabase.rpc('auto_clock_out');
    if (error) console.error('auto_clock_out error:', error);
  } catch (err) {
    console.error('Unexpected auto_clock_out error:', err);
  }

  // 2. Auth Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/signin');

  // 3. Profile Fetch
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) return redirect('/signin');

  const userId = profile.id;
  const role = profile.user_level;
  const clockinStatus = profile.time_entry_status;

  // 4. Time Entry Fetch (With NULL Safety)
  const timeEntryData = await fetchTimeEntryByUserId(supabase, userId);
  
  // FIX: Safety check. If API returns null, default to empty array []
  // This prevents "Cannot read properties of null" errors.
  const timeEnt = (timeEntryData || []) as unknown as TimeEntry[];
  
  // Now safely access the first item
  const clockInTimeStamp = timeEnt.length > 0 ? timeEnt[0]?.clock_in?.clock_in_time : null;

  return (
    <section className="mb-32 w-screen">
      <div className="max-w-6xl px-4 py-8 mx-auto sm:px-6 sm:pt-24 lg:px-8">
        <div className="sm:align-center sm:flex sm:flex-col">
          <h1 className="text-4xl font-extrabold dark:text-white sm:text-center sm:text-6xl">
            Account
          </h1>

          <div className="p-4">
            {/* FIX: String(userId) ensures we always pass a string.
              If your DB uses integer IDs, passing a number here would break the build.
            */}
            <UserPage params={Promise.resolve({ id: String(userId) })} />

            {role > 284 && (
              <ClockinForm
                user_role={role || 100}
                status={clockinStatus}
                user_id={userId}
                clockInTimeStamp={clockInTimeStamp}
              />
            )}
          </div>
        </div>

        <BackgroundPickerButton user={profile} />
      </div>
    </section>
  );
}