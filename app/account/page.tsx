// app/account/page.tsx
// Account Page – Server Component
// Authenticated user dashboard
// - Server-side Supabase client (await required)
// - Auto clock-out RPC
// - Fetch user and time entry
// - Render UserPage with correct string id
// - ClockinForm for employees
// - Background picker button

import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import {
  fetchTimeEntryByUserId,
  getUserDetails
} from '@/utils/supabase/queries';
import ClockinForm from '@/components/ui/AccountForms/ClockinForm';
import BackgroundPickerButton from './components/background-picker-button';
import UserPage from '../(biz)/biz/users/[id]/page';

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

  // Auto clock-out stuck sessions
  try {
    const { error } = await supabase.rpc('auto_clock_out');
    if (error) console.error('auto_clock_out error:', error);
  } catch (err) {
    console.error('Unexpected auto_clock_out error:', err);
  }

  // Fetch current user — getUserDetails returns array of user objects
  const userArray = await getUserDetails(supabase);

  if (!userArray || userArray.length === 0) {
    return redirect('/signin');
  }

  const currentUser = userArray[0];
  const userId = currentUser.id as string; // id is string from DB
  const role = currentUser.user_level;
  const clockinStatus = currentUser.time_entry_status;

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

        <BackgroundPickerButton user={currentUser} />
      </div>
    </section>
  );
}