/**
 * @file /app/(biz)/biz/users/admin/page.tsx
 * @description Unified User Management. Now includes full operational metadata
 * for seamless integration with UserStatusAvatar and the centralized /account hub.
 */
import React from 'react';
import UsersTabsContainer from './tabs-container';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import AddStaffDialog from './components/add-staff-dialog';

const UserManagementPage = async () => {
  const supabase = await createClient();
  const loggedInUser = await getUser(supabase);

  /**
   * THE JOINED FETCH: Identity + Operations
   * We pull 'department' and 'hire_date' to ensure the Roster and Account 
   * logic stays perfectly synced even when editing from this admin panel.
   */
  const { data: usersData, error } = await supabase
    .from('users')
    .select(`
      *,
      employee_details (
        primary_work_location,
        department,
        primary_position,
        emp_id,
        dialpad_number,
        hire_date,
        timeclock_blocked
      )
    `)
    .order('full_name', { ascending: true });

  if (error) console.error("Fetch error:", error);

  /**
   * DATA NORMALIZATION:
   * We flatten the employee_details array into a single object property
   * to make it easier for the Table/Avatar components to consume.
   */
  const users = (usersData || []).map(u => ({
    ...u,
    // Ensure nested details are easily accessible as an object, not an array
    employee_details: Array.isArray(u.employee_details) 
      ? u.employee_details[0] 
      : u.employee_details
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-4 md:px-0">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">
            User <span className="text-orange-500">Management</span>
          </h1>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">
            Identity & Fleet Access Control
          </p>
        </div>
        <div className="flex gap-2">
           <AddStaffDialog />
        </div>
      </div>
      
      {/* UsersTabsContainer now receives users with their 'employee_details' nested.
          In your columns.tsx for these tables, you should now use:
          <UserStatusAvatar user={row.original} currentUserLevel={loggedInUserLevel} />
      */}
      <UsersTabsContainer users={users as any[]} loggedInUser={loggedInUser} />
    </div>
  );
};

export default UserManagementPage;