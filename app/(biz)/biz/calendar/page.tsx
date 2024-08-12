import React from 'react';
import ClientCalendar from './client-calendar';
import { getUserDetails } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/server';

const CalendarPage = async () => {
  const supabase = createClient();
  const user = await getUserDetails(supabase);
  if (!user) return null;
  const role = user[0]?.user_level;
  // const full_name = user[0]?.full_name;
  return <>{role && <ClientCalendar role={role} />}</>;
};

export default CalendarPage;
