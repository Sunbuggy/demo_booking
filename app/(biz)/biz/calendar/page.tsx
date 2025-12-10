import ClientCalendar from './client-calendar';
import { getUserDetails } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/server';
import Loading from './loading';

const CalendarPage = async () => {
  const supabase = await createClient();
  const user = await getUserDetails(supabase);
  if (!user) return <Loading />;
  const role = user[0]?.user_level;
  if (role) {
    return <ClientCalendar role={role} />;
  }
};

export default CalendarPage;
