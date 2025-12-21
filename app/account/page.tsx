// app/account/page.tsx
// Account Page – Server Component
// Authenticated user dashboard
// - Creates server-side Supabase client
// - Calls auto_clock_out RPC
// - Fetches current user directly (no getUserDetails dependency)
// - Renders UserPage with string id
// - ClockinForm for employees
// - Background picker button

import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { fetchTimeEntryByUserId } from '@/utils/supabase/queries';
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

  // Fetch current authenticated user directly
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return redirect('/signin');
  }

  // Fetch user profile from 'users' table
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !userProfile) {
    console.error('Error fetching user profile:', profileError);
    return redirect('/signin');
  }

  const userId = userProfile.id as string;
  const role = userProfile.user_level;
  const clockinStatus = userProfile.time_entry_status;

  // Fetch current time entry
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

        <BackgroundPickerButton user={userProfile} />
      </div>
    </section>
  );
}