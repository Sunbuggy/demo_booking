import { createClient } from '@/utils/supabase/server';
import Navlinks from './Navlinks';
import { getUser, getUserDetails } from '@/utils/supabase/queries';
import { UserType } from '@/app/(biz)/biz/users/types';

export async function getServerSideProps() {
  const supabase = createClient();
  const user = await getUserDetails(supabase);

  return {
    props: { user }
  };
}

export default async function Navbar() {
  const supabase = createClient();
  const user = await getUserDetails(supabase); // Expecting user to be of type UserType | null
  const usr = await getUser(supabase);

  return (
    <nav className="z-50 w-[99.7%]  bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 h-fit p-2 ">
      <Navlinks user={user ? user[0] : null} usr={usr} />
    </nav>
  );
}
