'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

/**
 * AUTHORITATIVE SIGN OUT
 * This action runs on the server to ensure the HttpOnly cookie is destroyed
 * before the user is redirected. This prevents "Ghost Sessions."
 */
export async function signOutAction() {
  const supabase = await createClient();
  
  // 1. Tell Supabase to kill the session
  await supabase.auth.signOut();
  
  // 2. Force Redirect
  // Since this is a Server Action, this redirect carries the "Set-Cookie: Max-Age=0" header
  // which forces the browser to delete the cookie immediately.
  redirect('/signin');
}