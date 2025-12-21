// app/account/page.tsx
// Account Page – Server Component
// This page serves as the authenticated user's personal dashboard in the Sunbuggy admin app.
// It is a server component (async is allowed) and runs entirely on the server.
// Purpose:
// - Provide a personalized "Account" view for the logged-in user
// - Run the auto_clock_out RPC to clean up any stuck clock-in sessions from previous days
// - Fetch the current user's profile from the 'users' table
// - Render the same UserPage component that managers use to view employee profiles (code reuse)
// - Show the ClockinForm for employees (user_level > 284)
// - Include the BackgroundPickerButton so users can customize their profile background
//
// Why we fetch the user directly here:
// - We previously used getUserDetails from queries.ts, but due to TypeScript + Turbopack type inference bugs
//   with cached async functions, it caused persistent "Promise<{ id: string }>" type errors.
// - By fetching the user directly in this page (standard Supabase pattern), we eliminate that bug completely.
// - This is faster, simpler, and more reliable.

import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server'; // Server-side client – returns Promise<SupabaseClient>
import { fetchTimeEntryByUserId } from '@/utils/supabase/queries';
import ClockinForm from '@/components/ui/AccountForms/ClockinForm';
import BackgroundPickerButton from './components/background-picker-button';
import UserPage from '../(biz)/biz/users/[id]/page';

// Type for time entry data – used by ClockinForm to show current clock-in time
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

// Server Component – async is allowed here
export default async function Account() {
  // Create server-side Supabase client – must be awaited because createClient returns a Promise
  const supabase = await createClient();

  // Run auto_clock_out RPC to clean up any orphaned clock-in sessions
  // This prevents users from being stuck "clocked in" after a crash or logout
  try {
    const { error } = await supabase.rpc('auto_clock_out');
    if (error) {
      console.error('Error calling auto_clock_out RPC:', error);
    }
  } catch (err) {
    console.error('Unexpected error while calling auto_clock_out:', err);
  }

  // Fetch the currently authenticated user directly from Supabase auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  // If no authenticated user or an error occurred – redirect to sign-in page
  if (authError || !user) {
    return redirect('/signin');
  }

  // Fetch the user's profile from the 'users' table using the auth user ID
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  // If profile fetch fails or no profile exists – redirect to sign-in (safety)
  if (profileError || !profile) {
    console.error('Error fetching user profile:', profileError);
    return redirect('/signin');
  }

  // Extract needed fields from the user profile
  const userId = profile.id; // string – safe, no Promise
  const role = profile.user_level;
  const clockinStatus = profile.time_entry_status;

  // Fetch the current time entry (if any) to display the clock-in timestamp in ClockinForm
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

          {/* Main content area */}
          <div className="p-4">
            {/* Re-use the manager employee profile view for the current user */}
            {/* This gives the logged-in user the same detailed view managers see */}
            <UserPage params={{ id: userId }} />

            {/* Clock-in/clock-out form – only shown to employees (role > 284) */}
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

        {/* Background image picker button – lets user customize their profile background */}
        <BackgroundPickerButton user={profile} />
      </div>
    </section>
  );
}