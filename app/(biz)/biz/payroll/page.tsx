import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import PayrollManager from './components/payroll-manager';
import PayrollFilters from './components/payroll-filters'; // Import new component

// Define the Props type to accept searchParams
export default async function PayrollPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/signin');

  // Check Admin Access (Level 500+)
  const { data: userProfile } = await supabase.from('users').select('user_level').eq('id', user.id).single();
  if (!userProfile || (userProfile.user_level || 0) < 500) {
      return <div className="p-8 text-center text-red-500">Access Denied: Managers Only.</div>;
  }

  // 1. Fetch User List (For the Dropdown)
  // We want all active employees to populate the filter list
  const { data: allEmployees } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('user_type', 'employee') // Assuming you distinguish them
    .order('full_name');

  // 2. Fetch Pending Requests (Queue - always show pending)
  const { data: requests } = await supabase
    .from('time_sheet_requests')
    .select(`*, user:users (full_name, avatar_url)`)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  // 3. Build the Time Entries Query based on Filters
  let query = supabase
    .from('time_entries')
    .select(`*, user:users (full_name, avatar_url)`)
    .order('start_time', { ascending: false });

  // --- APPLY FILTERS ---
  const filterUserId = searchParams['userId'] as string;
  const filterDate = searchParams['date'] as string;

  if (filterUserId && filterUserId !== 'all') {
    query = query.eq('user_id', filterUserId);
  }

  if (filterDate) {
    // If your DB has a 'date' column, use that:
    query = query.eq('date', filterDate);
    
    // OR if you only have timestamps, filter by range:
    // const startOfDay = `${filterDate}T00:00:00`;
    // const endOfDay = `${filterDate}T23:59:59`;
    // query = query.gte('start_time', startOfDay).lte('start_time', endOfDay);
  }

  // If NO filters are applied, limit to 50 so we don't crash the browser
  if (!filterUserId && !filterDate) {
    query = query.limit(50);
  } else {
    // If filtering, we can show more history (e.g. 100) since it's targeted
    query = query.limit(100);
  }

  const { data: entries } = await query;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
         <h1 className="text-3xl font-bold tracking-tight">Payroll & Time Review</h1>
         <p className="text-muted-foreground">Manage correction requests and audit time cards.</p>
      </div>

      {/* Insert Filter Component */}
      <PayrollFilters users={allEmployees || []} />

      <PayrollManager 
         requests={requests as any || []} 
         entries={entries as any || []} 
      />
    </div>
  );
}