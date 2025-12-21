// app/account/page.tsx
// Account Page – Server Component
// This page serves as the authenticated user's personal dashboard.
// It:
// - Creates a server-side Supabase client (await required because createClient returns a Promise)
// - Calls the auto_clock_out RPC to clean up any stuck clock-in sessions
// - Fetches the current user's details
// - Redirects to sign-in if the user is not authenticated
// - Renders the same UserPage component used for manager employee profiles (re-using code)
// - Shows the ClockinForm for employees (role > 284)
// - Includes the BackgroundPickerButton for profile background customization
//
// All data fetching happens on the server – no client-side fetching needed.
// This keeps the page fast and secure.

import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server'; // Server-side client – returns Promise
import {
  fetchTimeEntryByUserId,
  getUserDetails
} from '@/utils/supabase/queries';
import ClockinForm from '@/components/ui/AccountForms/ClockinForm';
import BackgroundPickerButton from './components/background-picker-button';
import UserPage from '../(biz)/biz/users/[id]/page';

// Type definition for time entry data used by ClockinForm
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
  // Server-side Supabase client – must be awaited
  const supabase = await createClient();

  // Clean up any orphaned clock-in sessions
  try {
    const { error } = await supabase.rpc('auto_clock_out');
    if (error) {
      console.error('Error running auto_clock_out:', error);
    }
  } catch (err) {
    console.error('Unexpected error in auto_clock_out:', err);
  }

  // Fetch authenticated user details
  const user = await getUserDetails(supabase);

  // If no authenticated user – redirect to sign-in page
  if (!user || user.length === 0) {
    return redirect('/signin');
  }

  // Extract data from the first (and only) user record
  const currentUser = user[0];
  const userId = currentUser.id as string; // id is always a string from Supabase auth
  const role = currentUser.user_level;
  const clockinStatus = currentUser.time_entry_status;

  // Fetch the current time entry to display the latest clock-in timestamp
  const timeEntry = await fetchTimeEntryByUserId(supabase, userId);
  const timeEnt = timeEntry as unknown as TimeEntry[];
  const clockInTimeStamp = timeEnt[0]?.clock_in?.clock_in_time;

  return (
    <section className="mb-32 w-screen">
      <div className="max-w-6xl px-4 py-8 mx-auto sm:px-6 sm:pt-24 lg:px-8">
        <div className="sm:align-center sm:flex sm:flex-col">
          {/* Page title */}
          <h1 className="text-4xl font-extrabold dark:text-white sm:text-center sm:text-6xl">
            Account
          </h1>

          <div className="p-4">
            {/* Re-use the same UserPage component managers use for employee profiles */}
            {/* Type assertion ensures TypeScript accepts the params shape */}
            <UserPage params={{ id: userId } as { id: string }} />

            {/* Clock-in form – only shown to employees (role > 284) */}
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

        {/* Background image picker button – lets user customize profile background */}
        <BackgroundPickerButton user={currentUser} />
      </div>
    </section>
  );
}