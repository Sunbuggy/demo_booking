import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getErrorRedirect, getStatusRedirect } from '@/utils/helpers';
import { getPostLoginRedirect } from '@/lib/utils/auth-routing'; // <--- NEW IMPORT

// Preserved your environment variable logic
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    // Fixed the double "await await" typo from your original file
    const supabase = await createClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        getErrorRedirect(
          `${BASE_URL}/signin`,
          error.name,
          "Sorry, we weren't able to log you in. Please try again."
        )
      );
    }
  }

  // --- SMART ROUTING LOGIC START ---
  // Instead of blindly sending to /account, we calculate the destination.
  
  let targetPath = '/'; // Fallback just in case

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // 1. Fetch Profile & Preferences
    const { data: profile } = await supabase
      .from('users')
      .select(`
        user_level, 
        homepage,
        employee_details ( primary_work_location )
      `)
      .eq('id', user.id)
      .single();

    if (profile) {
       // 2. Handle Supabase Join (Array vs Object)
       const empData = Array.isArray(profile.employee_details) 
         ? profile.employee_details[0] 
         : profile.employee_details;

       // 3. Calculate the correct URL (e.g., /biz/vegas)
       targetPath = getPostLoginRedirect({
         user_level: profile.user_level ?? 0,
         primary_work_location: empData?.primary_work_location,
         homepage: profile.homepage
       });
    }
  }
  // --- SMART ROUTING LOGIC END ---

  // Redirect to the calculated targetPath instead of hardcoded /account
  return NextResponse.redirect(
    getStatusRedirect(
      `${BASE_URL}${targetPath}`, 
      'Success!',
      'You are now signed in.'
    )
  );
}