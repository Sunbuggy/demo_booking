import React from 'react';
import ChooseAdventure from '@/app/(com)/choose-adventure/page';
import BizPage from '@/app/(biz)/biz/[date]/page';
import VehiclesManagementPage from '@/app/(biz)/biz/vehicles/admin/page';
import { getUserDetails } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/server';
import dayjs from 'dayjs';

const HomepageSelector = async () => {
  const supabase = createClient();
  const userDetails = await getUserDetails(supabase);
  const userLevel = userDetails?.[0]?.user_level ?? 0;

  const currentDate = dayjs().format('YYYY-MM-DD');

  if (userLevel > 650) {
    // Default page for admin level users
    return <BizPage params={{ date: currentDate }} searchParams={{ dcos: false, torchc: false, admc: false }} />;
  }

  if (userLevel >= 400) {
    return <BizPage params={{ date: currentDate }} searchParams={{ dcos: false, torchc: false, admc: false }} />;
  }

  if (userLevel > 200) {
    return <VehiclesManagementPage />;
  }

  return <ChooseAdventure />;
};

export default HomepageSelector;
