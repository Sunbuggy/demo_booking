import { redirect } from 'next/navigation';
import { getDefaultSignInView } from '@/utils/auth-helpers/settings';

export default function SignIn() {
  const defaultView = getDefaultSignInView(null);
  if (!defaultView) {
    return (
      <div className="h-screen flex justify-center items-center gap-2">
        Loading...
      </div>
    );
  }
  return redirect(`/signin/${defaultView}`);
}
