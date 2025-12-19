// app/signin/page.tsx

import { redirect } from 'next/navigation';
import { getDefaultSignInView } from '@/utils/auth-helpers/settings';
import { cookies } from 'next/headers';

export default async function SignIn() {
  const preferredSignInView = (await cookies()).get('preferredSignInView')?.value || null;
  const defaultView = getDefaultSignInView(preferredSignInView);

  if (!defaultView) {
    return (
      <div className="h-screen flex justify-center items-center">
        <p>Loading...</p>
      </div>
    );
  }

  redirect(`/signin/${defaultView}`);
}