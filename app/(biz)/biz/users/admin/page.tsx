import React from 'react';
import UsersTabsContainer from './tabs-container';
import { createClient } from '@/utils/supabase/server';
import { getAllUsers, getUser } from '@/utils/supabase/queries';
import { UserType } from '../types';

const UserManagementPage = async () => {
  const supabase = createClient();
  const users = (await getAllUsers(supabase)) as UserType[];
  const loggedInUser = await getUser(supabase);
  return (
    <div>
      <UsersTabsContainer users={users} loggedInUser={loggedInUser} />
    </div>
  );
};

export default UserManagementPage;
