import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VehiclesTab from './tables/fleet/vehicles-tab';
import { User } from '@supabase/supabase-js';
import { VehicleType } from './page';

const VehiclesTabContainer = ({
  vehicles,
  loggedInUser
}: {
  vehicles: VehicleType[];
  loggedInUser: User | null | undefined;
}) => {
  const userFullName = String(loggedInUser?.user_metadata.full_name);
  return (
    <Tabs defaultValue="vehicles" className="w-[400px] md:w-full">
      <TabsList>
        <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
      </TabsList>
      <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Welcome back {userFullName.split(' ')[0]}!{' '}
            </h2>
            <p className="text-muted-foreground"></p>
          </div>
        </div>
        <TabsContent value="vehicles">
          <VehiclesTab vehicles={vehicles} />
        </TabsContent>
      </div>
    </Tabs>
  );
};

export default VehiclesTabContainer;
