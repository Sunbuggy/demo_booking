import { createClient } from '@/utils/supabase/server';
import Navlinks from './Navlinks';
import { getUserDetails } from '@/utils/supabase/queries';

export async function getServerSideProps() {
  const supabase = createClient();
  const user = await getUserDetails(supabase);
  const role = user && user[0] ? user[0].user_level : null;

  return {
    props: { role },
  };
}

export default async function Navbar({ role }: { role: number | null })  {
  const supabase = createClient();
  const user = await getUserDetails(supabase);

  return (
    <nav className="z-50 w-screen border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 h-fit p-2 ">
      <div className="">
      <Navlinks role={role} />
      </div>
    </nav>
  );
}
