import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { getUserDetails } from '@/utils/supabase/queries';
import PageSelector from '@/components/Homepage/PageSelector';

const HomepageSettings = async () => {
  const supabase = createClient();
  const userDetails = await getUserDetails(supabase);
  const userLevel = userDetails?.[0]?.user_level ?? 0;

  if (userLevel < 300) {
    return <div>Choose Your Adventure</div>
  }

  // Define available pages
  const availablePages = ['BizPage', 'VehiclesManagementPage', 'ChooseAdventure'];

  // Get the user's current homepage
  const currentPage = userDetails?.[0]?.homepage || 'ChooseAdventure';

  return <PageSelector availablePages={availablePages} currentPage={currentPage} />;
};

export default HomepageSettings;
