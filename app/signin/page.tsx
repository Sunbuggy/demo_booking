import { redirect } from 'next/navigation';
import { getDefaultSignInView } from '@/utils/auth-helpers/settings';
import { cookies } from 'next/headers';

export default function SignIn() {
  const preferredSignInView =
    cookies().get('preferredSignInView')?.value || null;
  const defaultView = getDefaultSignInView(preferredSignInView);
  if (!defaultView) {
    return (
      <div className="h-screen flex justify-center items-center gap-2">
        Loading...
      </div>
    );
  }
  return redirect(`/signin/${defaultView}`);
}
