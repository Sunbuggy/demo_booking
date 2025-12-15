import React from 'react';
import ChooseAdventure from '@/app/(com)/choose-adventure/page';
import BizPage from '@/app/(biz)/biz/[date]/page';
import VehiclesManagementPage from '@/app/(biz)/biz/vehicles/admin/page';
import Page from '@/app/(biz)/biz/reports/authorizenet/unsettled/page';
import { getUserDetails } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/server';
import dayjs from 'dayjs';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

const HomepageSelector = async () => {
  const supabase = createClient();
  const userDetails = await getUserDetails(supabase);

  // Extract necessary user details
  const userLevel = userDetails?.[0]?.user_level ?? 0; 
  const userHomepage = userDetails?.[0]?.homepage ?? 'ChooseAdventure';
  const currentDate = dayjs().format('YYYY-MM-DD');

  // If user level is 300 or above, handle their homepage preference
  if (userLevel >= 300) {
    // Use redirect for pages that expect params - cleaner solution
    if (userHomepage === 'VehiclesManagementPage') {
      return <VehiclesManagementPage />;
    }

    if (userHomepage === 'BizPage') {
      // Redirect to the biz page instead of rendering it directly
      redirect(`/biz/${currentDate}`);
    }

    if (userLevel >= 800 && userHomepage === 'UnsettledPage') {
      return <Page />;
    }
  } 
  
  return <ChooseAdventure />;
}

export default HomepageSelector;