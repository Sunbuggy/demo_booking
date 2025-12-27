import React from 'react';
import UsersTabsContainer from './tabs-container';
import { createClient } from '@/utils/supabase/server';
import { getAllUsers, getUser } from '@/utils/supabase/queries';
import { UserType } from '../types';
import InviteUserDialog from './components/invite-user-dialog'; // Import the new component

const UserManagementPage = async () => {
  const supabase = await createClient(); // Fixed: removed double await
  const users = (await getAllUsers(supabase)) as UserType[];
  const loggedInUser = await getUser(supabase);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        {/* Add the Invite Button here */}
        <InviteUserDialog />
      </div>
      
      <UsersTabsContainer users={users} loggedInUser={loggedInUser} />
    </div>
  );
};

export default UserManagementPage;