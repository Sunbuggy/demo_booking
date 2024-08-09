import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmployeeTab from './employee-tab';
import CustomerTab from './customer-tab';

const UsersTabsContainer = () => {
  return (
    <Tabs defaultValue="employees" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="employees">Employees</TabsTrigger>
        <TabsTrigger value="customers">Customers</TabsTrigger>
      </TabsList>
      <TabsContent value="employees">
        <EmployeeTab />
      </TabsContent>
      <TabsContent value="customers">
        <CustomerTab />
      </TabsContent>
    </Tabs>
  );
};

export default UsersTabsContainer;
