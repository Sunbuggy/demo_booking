import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getErrorRedirect, getStatusRedirect } from '@/utils/helpers';
import { getPostLoginRedirect } from '@/lib/utils/auth-routing';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  // DYNAMIC ORIGIN: This detects if we are on localhost:3000 or book.sunbuggy.com
  const origin = requestUrl.origin; 

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        getErrorRedirect(
          `${origin}/signin`, // <--- Uses dynamic origin
          error.name,
          "Sorry, we weren't able to log you in. Please try again."
        )
      );
    }
  }

  // --- SMART ROUTING LOGIC ---
  let targetPath = '/biz'; // Default safety fallback

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

       // 3. Calculate the correct URL
       const calculatedPath = getPostLoginRedirect({
         user_level: profile.user_level ?? 0,
         primary_work_location: empData?.primary_work_location,
         homepage: profile.homepage
       });
       
       if (calculatedPath) targetPath = calculatedPath;
    }
  }

  // FINAL REDIRECT
  // We attach the calculated path to the Dynamic Origin.
  // This ensures Localhost stays on Localhost, and Prod stays on Prod.
  return NextResponse.redirect(
    getStatusRedirect(
      `${origin}${targetPath}`, 
      'Success!',
      'You are now signed in.'
    )
  );
}