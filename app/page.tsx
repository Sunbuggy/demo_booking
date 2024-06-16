import { createClient } from '@/utils/supabase/server';
import {
  getProducts,
  getSubscription,
  getUser
} from '@/utils/supabase/queries';
import { BookingTabs } from './(booking)/book/booking-tabs';
import { CalendarForm } from './(booking)/book/booking-calendar';

export default async function MainPage() {
  const supabase = createClient();
  const [user, products, subscription] = await Promise.all([
    getUser(supabase),
    getProducts(supabase),
    getSubscription(supabase)
  ]);

  return (
    <div className="text-4xl font-extrabold text-white sm:text-center sm:text-6xl flex flex-col justify-center items-center h-screen">
      <CalendarForm />
      <BookingTabs />
    </div>
  );
}
