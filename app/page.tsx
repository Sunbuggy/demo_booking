import { createClient } from '@/utils/supabase/server';
import { getUser, getUserDetails } from '@/utils/supabase/queries';
import ChooseAdventure from './(booking)/choose-adventure/page';

export default async function MainPage() {
  const supabase = createClient();
  const [user, usrDetails] = await Promise.all([
    getUser(supabase),
    getUserDetails(supabase)
  ]);
  // console.log(user);
  if (user) console.log(usrDetails);
  return (
    <div>
      <ChooseAdventure />
    </div>
  );
}
