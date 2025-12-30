import { createClient } from '@/utils/supabase/server';
import Navlinks from './Navlinks';
import { getUser, getUserDetails } from '@/utils/supabase/queries';

export async function getServerSideProps() {
  const supabase =  await createClient();
  const user = await getUserDetails(supabase);

  return {
    props: { user }
  };
}

export default async function Navbar() {
  const supabase =  await createClient();
  
  // We still fetch basic user details to decide if we should show the "Log In" button
  const user = await getUserDetails(supabase); 
  const usr = await getUser(supabase);

  // NOTE: Removed heavy time_entry fetching. 
  // The <CurrentUserAvatar /> client component now handles real-time status fetching directly.

  return (
    // Reduced height: Changed p-2 to p-1. Explicit h-12 caps height.
    <nav className="z-50 w-[99.7%] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 h-12 p-1">
      <Navlinks
        user={user ? user[0] : null}
        usr={usr}
        // No longer passing status/timestamps—they are handled internally by the avatar
      />
    </nav>
  );
}