import { createClient } from '@/utils/supabase/server';
import { fetchHotels, getUser } from '@/utils/supabase/queries';

import BookPage from './(booking)/book/page';

export default async function MainPage() {
  const supabase = createClient();
  const [user, hotels] = await Promise.all([
    getUser(supabase),
    fetchHotels(supabase)
  ]);
  // console.log(hotels);
  console.log(user);

  return (
    <div>
      <BookPage hotels={hotels} />
    </div>
  );
}
