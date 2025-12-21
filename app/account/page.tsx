// app/account/page.tsx
// Account Page – Server Component
// Authenticated user dashboard
// - Creates server-side Supabase client (must await)
// - Calls auto_clock_out RPC
// - Fetches current user and time entry
// - Renders UserPage with correct string id
// - ClockinForm for employees
// - Background picker button

import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server'; // Returns Promise<SupabaseClient>
import {
  fetchTimeEntryByUserId,
  getUserDetails
} from '@/utils/supabase/queries';
import ClockinForm from '@/components/ui/AccountForms/ClockinForm';
import BackgroundPickerButton from './components/background-picker-button';
import UserPage from '../(biz)/biz/users/[id]/page';

// Type for time entry data (clock-in display)
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
  // Create server-side Supabase client — must await
  const supabase = await createClient();

  // Auto clock-out any stuck sessions
  try {
    const { error } = await supabase.rpc('auto_clock_out');
    if (error) console.error('auto_clock_out error:', error);
  } catch (err) {
    console.error('Unexpected auto_clock_out error:', err);
  }

  // Fetch current authenticated user
  const user = await getUserDetails(supabase);

  if (!user || user.length === 0) {
    return redirect('/signin');
  }

  const currentUser = user[0];
  const userId = currentUser.id; // id is string from DB — no need for 'as string'
  const role = currentUser.user_level;
  const clockinStatus = currentUser.time_entry_status;

  // Fetch current time entry for clock-in timestamp
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
            {/* Manager-style profile view for current user */}
            <UserPage params={{ id: userId }} />

            {/* Clock-in form for employees only */}
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

        {/* Background customization button */}
        <BackgroundPickerButton user={currentUser} />
      </div>
    </section>
  );
}