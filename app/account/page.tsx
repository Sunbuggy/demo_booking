import NameForm from '@/components/ui/AccountForms/NameForm';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getUserDetails } from '@/utils/supabase/queries';
import RoleForm from '@/components/ui/AccountForms/RoleForm';

export default async function Account() {
  const supabase = createClient();
  const user = await getUserDetails(supabase);
  if (!user) {
    return redirect('/signin');
  } else {
    const role = user[0]?.user_level;
    const userName = user[0]?.full_name;
    return (
      <section className="mb-32">
        <div className="max-w-6xl px-4 py-8 mx-auto sm:px-6 sm:pt-24 lg:px-8">
          <div className="sm:align-center sm:flex sm:flex-col">
            <h1 className="text-4xl font-extrabold dark:text-white sm:text-center sm:text-6xl">
              Account
            </h1>
            <p className="max-w-2xl m-auto mt-5 text-xl dark:text-zinc-200 sm:text-center sm:text-2xl">
              We partnered with Authorize.net for a simplified billing.
            </p>
          </div>
        </div>
        <div className="p-4">
          <NameForm userName={userName ?? ''} user_role={role || 100} />
          {/* {Number(role) > 900 ? <RoleForm role={String(role) ?? ''} /> : ''} */}
        </div>
      </section>
    );
  }
}
