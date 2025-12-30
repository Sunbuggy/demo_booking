/**
 * @file /app/(biz)/biz/users/admin/page.tsx
 */
import React from 'react';
import UsersTabsContainer from './tabs-container';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
// import { getAllUsers } from '@/utils/supabase/queries'; // Replacing this for a joined fetch
import AddStaffDialog from './components/add-staff-dialog';

const UserManagementPage = async () => {
  const supabase = await createClient();
  const loggedInUser = await getUser(supabase);

  /**
   * CRITICAL FIX: The Joined Fetch
   * We pull identity from 'users' and operational info from 'employee_details'.
   * This ensures that when passed to the TabsContainer (and eventually the Edit Dialog),
   * the location and department aren't empty.
   */
  const { data: usersData, error } = await supabase
    .from('users')
    .select(`
      *,
      employee_details (
        primary_work_location,
        primary_position,
        emp_id,
        dialpad_number
      )
    `)
    .order('full_name', { ascending: true });

  if (error) console.error("Fetch error:", error);

  // Cast to your UserType (ensure UserType supports the employee_details key)
  const users = (usersData || []) as any[]; 

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">
            User <span className="text-orange-500">Management</span>
          </h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
            Identity & Fleet Access Control
          </p>
        </div>
        <div className="flex gap-2">
           <AddStaffDialog />
        </div>
      </div>
      
      {/* This container now receives users with their 'employee_details' attached.
          Inside the tabs, when you click "Edit", pass this 'user' object 
          to the EditUserDialog we built.
      */}
      <UsersTabsContainer users={users} loggedInUser={loggedInUser} />
    </div>
  );
};

export default UserManagementPage;