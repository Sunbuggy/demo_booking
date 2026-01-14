import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import SmartLoginForm from './login-form';

// FIX: Type definition now requires Promise wrapping
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();

  // 1. SESSION CHECK (Server-Side)
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    return redirect('/biz');
  }

  // 2. AWAIT THE SEARCH PARAMS (The Fix)
  // In Next.js 15, we must await this object before reading properties.
  const resolvedParams = await searchParams;
  const message = typeof resolvedParams.message === 'string' 
    ? resolvedParams.message 
    : undefined;

  // 3. Render
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-white tracking-tight">
            SunBuggy Staff
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to access schedules and fleet controls
          </p>
        </div>

        {/* Pass the unwrapped message string */}
        <SmartLoginForm initialMessage={message} />
      </div>
    </div>
  );
}