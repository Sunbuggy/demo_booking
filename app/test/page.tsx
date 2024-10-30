import React from 'react';
import { UserType } from '@/app/(biz)/biz/users/types';
import { createClient } from '@/utils/supabase/server';
import { getUserDetails } from '@/utils/supabase/queries';
import UserLevel from '@/components/userLevel';

const AnotherPage = async () => {
  const supabase = createClient();
  const user = await getUserDetails(supabase);

  return (
    <div>
      <h1>Welcome to Another Page</h1>
      {/* <UserLevel user={user && user.length > 0 ? user[0] : null} children={undefined} /> */}
    </div>
  );
};

export default AnotherPage;
