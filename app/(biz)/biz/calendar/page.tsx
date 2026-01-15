import ClientCalendar from './client-calendar';
import { getUserDetails } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/server';
import Loading from './loading';

/**
 * @file /app/(biz)/biz/schedule/page.tsx
 * @description Server Component: Fetches user role and renders the calendar.
 * Updated: Semantic Theming Applied (v1.0)
 */

const CalendarPage = async () => {
  // FIX: Removed accidental double 'await'
  const supabase = await createClient();
  
  const user = await getUserDetails(supabase);
  
  // SEMANTIC: Loading component should already use semantic colors (muted/primary)
  if (!user) return <Loading />;
  
  const role = user[0]?.user_level;
  
  if (role) {
    return (
      // SEMANTIC: Wrapper ensures background consistency during hydration
      <div className="w-full h-full min-h-screen bg-background text-foreground">
        <ClientCalendar role={role} />
      </div>
    );
  }

  return null;
};

export default CalendarPage;