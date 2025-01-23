import React from 'react';
import ChooseAdventure from '@/app/(com)/choose-adventure/page';
import BizPage from '@/app/(biz)/biz/[date]/page';
import VehiclesManagementPage from '@/app/(biz)/biz/vehicles/admin/page';
import { getUserDetails } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/server';
import dayjs from 'dayjs';

export const dynamic = 'force-dynamic'; // Ensures the page fetches fresh data on every request

const HomepageSelector = async () => {
  const supabase = createClient();
  const userDetails = await getUserDetails(supabase);

  // Extract necessary user details
  const userLevel = userDetails?.[0]?.user_level ?? 0;
  const userHomepage = userDetails?.[0]?.homepage ?? 'ChooseAdventure';
  const currentDate = dayjs().format('YYYY-MM-DD');

if (userLevel >= 300){
  if (userHomepage === 'VehiclesManagementPage') {
    return <VehiclesManagementPage />;
  }

  if (userHomepage === 'BizPage') {
    return (
      <BizPage
        params={{ date: currentDate }}
        searchParams={{ dcos: false, torchc: false, admc: false }}
      />
    );
  }
} 

  return <ChooseAdventure />;

}


export default HomepageSelector;
