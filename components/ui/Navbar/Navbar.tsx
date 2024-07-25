import Navlinks from './Navlinks';
import { getUserDetails } from '@/utils/supabase/queries';

export default async function Navbar() {
  const user = await getUserDetails();
  return (
    <nav className="z-50 w-screen border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 h-fit p-2 ">
      <div className="max-w-6xl mx-auto">
        <Navlinks user={user} />
      </div>
    </nav>
  );
}
