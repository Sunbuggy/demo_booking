import React from 'react';
import ClientCalendar from './client-calendar';
import { getUserDetails } from '@/utils/supabase/queries';

const CalendarPage = async () => {
  const user = await getUserDetails();
  const role = user?.user_level;
  const full_name = user?.full_name;
  return <>{role && <ClientCalendar role={role} />}</>;
};

export default CalendarPage;
