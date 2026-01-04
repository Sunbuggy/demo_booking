/**
 * @file app/(biz)/biz/admin/developer/layout.tsx
 * @description Security Guardrail for the Developer Section.
 * Enforces USER_LEVELS.DEV (950+) for all routes in this folder.
 */
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { USER_LEVELS } from '@/lib/constants/user-levels';

export default async function DeveloperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // 1. Check Auth Session
  const { data: { user } } = await supabase.auth.getUser();
  
  // If not logged in, kick to login
  if (!user) {
    redirect('/login');
  }

  // 2. Verify Access Level
  // We must fetch the level from the DB because the session user object 
  // might not have the latest role updates.
  const { data: profile } = await supabase
    .from('users')
    .select('user_level')
    .eq('id', user.id)
    .single();

  // 3. Kick out non-developers
  // If profile missing OR level is below 950 (DEV)
  if (!profile || profile.user_level < USER_LEVELS.DEV) {
    // Redirect them back to the Admin dashboard (safe zone)
    redirect('/biz/admin');
  }

  // 4. Render the developer content if they pass
  return <>{children}</>;
}