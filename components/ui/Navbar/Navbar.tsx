import { createClient } from '@/utils/supabase/server';
import Navlinks from './Navlinks';

export default async function Navbar() {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();
  // console.log(user);
  return (
    <nav className="z-50 w-screen border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 h-fit p-2 ">
      <div className="max-w-6xl mx-auto">
        <Navlinks user={user} />
      </div>
    </nav>
  );
}
