// app/account/page.tsx
// Account Page – Server Component
// This page is the main entry point for authenticated users' account view.
// It:
// - Creates a server-side Supabase client
// - Calls auto_clock_out RPC to handle any stuck clock-ins
// - Fetches current user details
// - Redirects to sign-in if not authenticated
// - Renders the UserPage component (manager view of own profile)
// - Conditionally shows ClockinForm for users with role > 284 (employees)
// - Includes BackgroundPickerButton for profile customization
//
// All Supabase calls use the server client — safe for server components
// No client-side state needed here — everything is resolved on the server

import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server'; // Server-side Supabase client
import {
  fetchTimeEntryByUserId,
  getUserDetails
} from '@/utils/supabase/queries';
import ClockinForm from '@/components/ui/AccountForms/ClockinForm';
import BackgroundPickerButton from './components/background-picker-button';
import UserPage from '../(biz)/biz/users/[id]/page';

// Type for time entry data (used for clock-in status)
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

// Server Component — async allowed here
export default async function Account() {
  // Create server-side Supabase client (safe — runs only on server)
  const supabase = createClient();

  // Auto clock-out any stuck sessions (RPC handles edge cases)
  try {
    const { error } = await supabase.rpc('auto_clock_out');
    if (error) {
      console.error('Error calling auto_clock_out function:', error);
    }
  } catch (error) {
    console.error('Unexpected error in auto_clock_out:', error);
  }

  // Fetch current authenticated user details
  const user = await getUserDetails(supabase);

  // If no user — redirect to sign-in page
  if (!user || user.length === 0) {
    return redirect('/signin');
  }

  // Extract needed fields from user record
  const currentUser = user[0];
  const userId = currentUser.id;
  const role = currentUser.user_level;
  const clockinStatus = currentUser.time_entry_status;

  // Fetch latest time entry for clock-in timestamp display
  const timeEntry = await fetchTimeEntryByUserId(supabase, userId);
  const timeEnt = timeEntry as unknown as TimeEntry[];
  const clockInTimeStamp = timeEnt[0]?.clock_in?.clock_in_time;

  return (
    <section className="mb-32 w-screen">
      <div className="max-w-6xl px-4 py-8 mx-auto sm:px-6 sm:pt-24 lg:px-8">
        <div className="sm:align-center sm:flex sm:flex-col">
          <h1 className="text-4xl font-extrabold dark:text-white sm:text-center sm:text-6xl">
            Account
          </h1>

          <div className="p-4">
            {/* Render the manager-style user profile page for the current user */}
            <UserPage params={{ id: userId }} />

            {/* Show clock-in form only for employees (role > 284) */}
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

        {/* Background picker button — allows user to customize profile background */}
        <BackgroundPickerButton user={currentUser} />
      </section>
    );
  );
}