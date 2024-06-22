import { createClient } from '@/utils/supabase/server';
import { fetchHotels, getUser } from '@/utils/supabase/queries';
import ChooseAdventure from './(booking)/choose-adventure/page';

export default async function MainPage() {
  const supabase = createClient();
  const [user] = await Promise.all([getUser(supabase), fetchHotels(supabase)]);
  console.log(user);

  return (
    <div>
      <ChooseAdventure />
    </div>
  );
}
