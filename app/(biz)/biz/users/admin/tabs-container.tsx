import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmployeeTab from './tables/employee/employee-tab';
import CustomerTab from './tables/user/customer-tab';
import { UserType } from '../types';
import { User } from '@supabase/supabase-js';
import { UserNav } from './tables/components/user-nav';

const UsersTabsContainer = ({
  users,
  loggedInUser
}: {
  users: UserType[];
  loggedInUser: User | null | undefined;
}) => {
  const userEmail = loggedInUser?.email;
  const userFullName = String(loggedInUser?.user_metadata.full_name);
  const userInitials =
    userFullName &&
    String(userFullName)
      .split(' ')
      .map((n) => n[0])
      .join('');
  const userImage =
    loggedInUser && String(loggedInUser?.user_metadata.avatar_url);
  return (
    <Tabs defaultValue="employees" className="w-[400px] md:w-full">
      <TabsList>
        <TabsTrigger value="employees">Employees</TabsTrigger>
        <TabsTrigger value="customers">Customers</TabsTrigger>
      </TabsList>
      <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Welcome back {userFullName.split(' ')[0]}!{' '}
            </h2>
            <p className="text-muted-foreground">
              {/* Here&apos;s a list of your users for this month! */}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {/* <UserNav
              email={userEmail}
              userInitials={userInitials}
              userImage={String(userImage)}
              userName={String(userFullName)}

            /> */}
          </div>
        </div>
        <TabsContent value="employees">
          <EmployeeTab users={users} />
        </TabsContent>
        <TabsContent value="customers">
          <CustomerTab users={users} />
        </TabsContent>
      </div>
    </Tabs>
  );
};

export default UsersTabsContainer;
