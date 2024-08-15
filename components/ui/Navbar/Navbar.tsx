import { createClient } from '@/utils/supabase/server';
import Navlinks from './Navlinks';
import { getUserDetails } from '@/utils/supabase/queries';

export default async function Navbar() {
  const supabase = createClient();
  const user = await getUserDetails(supabase);

  return (
    <nav className="z-50 w-screen border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 h-fit p-2 ">
      <div className="">
        <Navlinks user={user} />
      </div>
    </nav>
  );
}
