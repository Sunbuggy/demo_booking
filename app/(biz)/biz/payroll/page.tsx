/**
 * @file /app/(biz)/biz/payroll/page.tsx
 * @description REGULATED PAYROLL HUB.
 * Fix: Stabilized auth call and added case-insensitive Time Off fetching.
 */

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import PayrollManager from './components/payroll-manager';
import PayrollFilters from './components/payroll-filters';

// Force dynamic fetching to ensure managers see updates immediately
export const revalidate = 0;

export default async function PayrollPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();

  // 1. STABILIZED AUTH: Await the user session correctly
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) return redirect('/signin');

  // 2. Resolve searchParams
  const searchParams = await props.searchParams;

  // 3. Check Admin Access (Level 500+)
  const { data: userProfile } = await supabase
    .from('users')
    .select('user_level')
    .eq('id', user.id)
    .single();

  if (!userProfile || (userProfile.user_level || 0) < 500) {
    return <div className="p-8 text-center text-red-500 font-bold uppercase">Access Denied: Managers Only.</div>;
  }

  // 4. Build Queries
  const filterUserId = searchParams['userId'] as string;
  const filterDate = searchParams['date'] as string;

  let entriesQuery = supabase
    .from('time_entries')
    .select(`*, user:users (full_name, avatar_url)`)
    .order('start_time', { ascending: false });

  if (filterUserId && filterUserId !== 'all') {
    entriesQuery = entriesQuery.eq('user_id', filterUserId);
  }
  if (filterDate) {
    entriesQuery = entriesQuery.eq('date', filterDate);
  }

  const limit = (!filterUserId && !filterDate) ? 50 : 100;
  entriesQuery = entriesQuery.limit(limit);

  // 5. Parallel Data Fetching
  const [
    allEmployeesRes,
    punchRequestsRes,
    timeOffRequestsRes,
    entriesRes
  ] = await Promise.all([
    supabase.from('users').select('id, full_name').gte('user_level', 300).order('full_name'),
    
    // Correction Queue: Manual punch edits
    supabase.from('time_sheet_requests')
      .select(`*, user:users (full_name, avatar_url)`)
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),

    // Time Off Queue: Case-insensitive search to ensure Shana's requests appear
    supabase.from('time_off_requests')
      .select(`*, user:users (full_name, avatar_url)`)
      .ilike('status', 'pending') 
      .order('start_date', { ascending: true }),

    entriesQuery
  ]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-start">
         <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter">
              Payroll <span className="text-orange-500">& Time</span> Review
            </h1>
            <p className="text-muted-foreground text-sm">Audit time cards and manage employee requests.</p>
         </div>
      </div>

      <PayrollFilters users={allEmployeesRes.data || []} />

      {/* FIX: Maintain 'requests' prop for Punch Corrections to prevent 
        'undefined length' crash in PayrollManager.
      */}
      <PayrollManager 
         requests={punchRequestsRes.data as any || []} 
         timeOffRequests={timeOffRequestsRes.data as any || []} 
         entries={entriesRes.data as any || []} 
      />
    </div>
  );
}