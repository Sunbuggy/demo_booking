import { createClient } from '@/utils/supabase/server';
import { getPostLoginRedirect } from '@/lib/utils/auth-routing';
import { redirect } from 'next/navigation';
import LandingPage from '@/components/LandingPage'; // The new component

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await createClient();
  
  // 1. CHECK SESSION
  const { data: { user } } = await supabase.auth.getUser();

  // 2. LOGGED IN USER -> CHECK REDIRECT
  if (user) {
    const { data: userRecord, error } = await supabase
      .from('users')
      .select(`
        user_level,
        homepage,
        employee_details (
          primary_work_location
        )
      `)
      .eq('id', user.id)
      .single();

    if (!error && userRecord) {
      const empData = userRecord.employee_details as any;
      const locationVal = Array.isArray(empData) 
        ? empData[0]?.primary_work_location 
        : empData?.primary_work_location;

      const nextPath = getPostLoginRedirect({
        user_level: userRecord.user_level ?? 0,
        primary_work_location: locationVal,
        homepage: userRecord.homepage
      });

      // Redirect if destination is NOT root
      if (nextPath !== '/') {
        redirect(nextPath);
      }
    }
  }

  // 3. RENDER LANDING PAGE (If no redirect happened)
  return <LandingPage />;
}