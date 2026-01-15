/**
 * @file /app/(biz)/biz/users/admin/page.tsx
 * @description Unified User Management with Semantic Theming.
 */
import React from 'react';
import UsersTabsContainer from './tabs-container';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import AddStaffDialog from './components/add-staff-dialog';

const UserManagementPage = async () => {
  const supabase = await createClient();
  const loggedInUser = await getUser(supabase);

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

  const users = (usersData || []).map(u => ({
    ...u,
    employee_details: Array.isArray(u.employee_details) 
      ? u.employee_details[0] 
      : u.employee_details
  }));

  return (
    // FIX: Added bg-background and text-foreground to the wrapper
    // This ensures that even if there is no parent layout background, this page sets one.
    <div className="min-h-screen space-y-6 bg-background text-foreground p-6">
      
      <div className="flex justify-between items-center px-4 md:px-0">
        <div>
          {/* Replaced 'text-white' with 'text-foreground' */}
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-foreground">
            User <span className="text-primary">Management</span>
          </h1>
          {/* Replaced 'text-zinc-500' with 'text-muted-foreground' */}
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em]">
            Identity & Fleet Access Control
          </p>
        </div>
        <div className="flex gap-2">
           <AddStaffDialog />
        </div>
      </div>
      
      <UsersTabsContainer users={users as any[]} loggedInUser={loggedInUser} />
    </div>
  );
};

export default UserManagementPage;