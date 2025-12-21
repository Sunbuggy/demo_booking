// app/account/page.tsx
// Account Page – Server Component
// Main authenticated user dashboard
// - Server-side Supabase client
// - Auto clock-out stuck sessions
// - Redirect unauthenticated users
// - Render own profile (UserPage)
// - Show ClockinForm for employees (role > 284)
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
  const supabase = createClient();

  // Clean up stuck clock-ins
  try {
    const { error } = await supabase.rpc('auto_clock_out');
    if (error) console.error('auto_clock_out error:', error);
  } catch (error) {
    console.error('Unexpected auto_clock_out error:', error);
  }

  const user = await getUserDetails(supabase);

  if (!user || user.length === 0) {
    return redirect('/signin');
  }

  const currentUser = user[0];
  const userId = currentUser.id;
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