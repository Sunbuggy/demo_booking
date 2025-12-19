// app/signin/[id]/page.tsx

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import {
  getAuthTypes,
  getViewTypes,
  getDefaultSignInView,
  getRedirectMethod
} from '@/utils/auth-helpers/settings';
import Card from '@/components/ui/Card';
import PasswordSignIn from '@/components/ui/AuthForms/PasswordSignIn';
import EmailSignIn from '@/components/ui/AuthForms/EmailSignIn';
import Separator from '@/components/ui/AuthForms/Separator';
import OauthSignIn from '@/components/ui/AuthForms/OauthSignIn';
import ForgotPassword from '@/components/ui/AuthForms/ForgotPassword';
import UpdatePassword from '@/components/ui/AuthForms/UpdatePassword';
import SignUp from '@/components/ui/AuthForms/Signup';
import Image from 'next/image';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ disable_button?: boolean }>;
}

export default async function SignIn({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;

  const { allowOauth, allowEmail, allowPassword } = getAuthTypes();
  const viewTypes = getViewTypes();
  const redirectMethod = getRedirectMethod();

  let viewProp: string;

  // Determine the current view from the URL or fall back to default
  if (typeof id === 'string' && viewTypes.includes(id)) {
    viewProp = id;
  } else {
    const preferredSignInView = (await cookies()).get('preferredSignInView')?.value || null;
    viewProp = getDefaultSignInView(preferredSignInView);
    return redirect(`/signin/${viewProp}`);
  }

  // Properly await the async createClient() from server.ts
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error('Supabase getUser error:', error);
  }

  const user = data?.user ?? null;

  // Optional: redirect already-logged-in users (uncomment if desired)
  // if (user && viewProp !== 'update_password') {
  //   return redirect('/');
  // } else if (!user && viewProp === 'update_password') {
  //   return redirect('/signin');
  // }

  return (
    <div className="flex justify-center h-screen">
      <div className="flex flex-col justify-between max-w-lg p-3 m-auto w-80">
        <div className="flex justify-center pb-12">
          <div className="hidden dark:block">
            <Image
              src="/sb-logo-circle-yellow.svg"
              width={64}
              height={64}
              alt="sunbuggy's logo"
            />
          </div>
          <div className="dark:hidden">
            <Image
              src="/sb-logo-circle-black.svg"
              width={64}
              height={64}
              alt="sunbuggy's logo"
            />
          </div>
        </div>

        <Card
          title={
            viewProp === 'forgot_password'
              ? 'Reset Password'
              : viewProp === 'update_password'
                ? 'Update Password'
                : viewProp === 'signup'
                  ? 'Sign Up'
                  : 'Sign In'
          }
        >
          {/* OAuth section (shown on most views) */}
          {viewProp !== 'update_password' &&
            viewProp !== 'signup' &&
            allowOauth && (
              <>
                <Separator text="Sign in with" />
                <OauthSignIn />
                <Separator text="Or Use Email sign-in" />
              </>
            )}

          {/* Individual view forms */}
          {viewProp === 'password_signin' && (
            <PasswordSignIn
              allowEmail={allowEmail}
              redirectMethod={redirectMethod}
            />
          )}

          {viewProp === 'email_signin' && (
            <EmailSignIn
              allowPassword={allowPassword}
              redirectMethod={redirectMethod}
              disableButton={query.disable_button}
            />
          )}

          {viewProp === 'forgot_password' && (
            <ForgotPassword
              allowEmail={allowEmail}
              redirectMethod={redirectMethod}
              disableButton={query.disable_button}
            />
          )}

          {viewProp === 'update_password' && (
            <UpdatePassword redirectMethod={redirectMethod} />
          )}

          {viewProp === 'signup' && (
            <SignUp allowEmail={allowEmail} redirectMethod={redirectMethod} />
          )}
        </Card>
      </div>
    </div>
  );
}