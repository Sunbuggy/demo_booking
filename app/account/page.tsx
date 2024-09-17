'use client'
import NameForm from '@/components/ui/AccountForms/NameForm';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import {
  fetchTimeEntryByUserId,
  getUserDetails
} from '@/utils/supabase/queries';
import ClockinForm from '@/components/ui/AccountForms/ClockinForm';
import QrHistory from '@/app/account/components/QrHistory';
// import RoleForm from '@/components/ui/AccountForms/RoleForm';
type TimeEntry = {
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
  try {
    const { error } = await supabase.rpc('auto_clock_out');
    if (error) {
      console.error('Error calling auto_clock_out function:', error);
    }
  } catch (error) {
    console.error('Error calling auto_clock_out function:', error);
  }
  const user = await getUserDetails(supabase);
  if (!user) {
    return redirect('/signin');
  } else {
    const userId = user[0]?.id;
    const timeEntry = await fetchTimeEntryByUserId(supabase, userId);
    const timeEnt = timeEntry as unknown as TimeEntry[];
    const clockInTimeStamp = timeEnt[0]?.clock_in?.clock_in_time;
    const role = user[0]?.user_level;
    const userName = user[0]?.full_name;
    const phone = user[0]?.phone;
    const clockinStatus = user[0]?.time_entry_status;
    return (
      <section className="mb-32">
        <div className="max-w-6xl px-4 py-8 mx-auto sm:px-6 sm:pt-24 lg:px-8">
          <div className="sm:align-center sm:flex sm:flex-col">
            <h1 className="text-4xl font-extrabold dark:text-white sm:text-center sm:text-6xl">
              Account
            </h1>
            <p className="max-w-2xl m-auto mt-5 text-xl dark:text-zinc-200 sm:text-center sm:text-2xl">
              We partnered with Authorize.net for a simplified billing.
            </p>
          </div>
        </div>
        <div className="p-4">
          <NameForm
            userName={userName ?? ''}
            user_role={role || 100}
            phone={phone}
          />
          {role > 284 && (
            <ClockinForm
              user_role={role || 100}
              status={clockinStatus}
              user_id={userId}
              clockInTimeStamp={clockInTimeStamp}
            />
          )}
          {/* {Number(role) > 900 ? <RoleForm role={String(role) ?? ''} /> : ''} */}
        </div>
      </section>
    );
  }
}
