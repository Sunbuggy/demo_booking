import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { headers } from 'next/headers';
import SmartLoginForm from './login-form'; // We will create this below

export default async function SignInPage({
  searchParams,
}: {
  searchParams: { message?: string };
}) {
  const supabase = await createClient();

  // 1. SESSION CHECK (Server-Side)
  // If they are already logged in, don't let them see the sign-in page.
  // Bounce them straight to work.
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    return redirect('/biz');
  }

  // 2. Render the "Smart" Login UI
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Branding Area */}
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-white tracking-tight">
            SunBuggy Staff
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to access schedules and fleet controls
          </p>
        </div>

        {/* The Actual Form Logic */}
        <SmartLoginForm initialMessage={searchParams.message} />
      </div>
    </div>
  );
}