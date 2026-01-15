import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import SmartTimeClock from './clock-in'; // Imports your component

export default async function TimeClockPage() {
  const supabase = await createClient();

  // 1. Get the current logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. Security Check: If not logged in, kick them to login page
  if (!user) {
    redirect('/login');
  }

  // 3. Render the Timeclock with their User ID
  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-center mb-6">Staff Timeclock</h1>
      <SmartTimeClock employeeId={user.id} />
    </div>
  );
}