import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VehiclesTab from './tables/fleet/vehicles-tab';
import { User } from '@supabase/supabase-js';
import { VehicleType } from './page';
import VehicleStatus from './tables/components/vehicle-status';

import { createClient } from '@/utils/supabase/server';
import LocationHistory from '../[id]/components/vehicle-location-history';
import { fetchAllVehicleLocations } from '@/utils/supabase/queries';
import { VehicleLocation } from '../types';
import VehiclesOverview from './tables/components/overview/vehicles-overview';
import { FilteredVehicles } from './tables/components/filter-vehicles';

const VehiclesTabContainer = async ({
  vehicles,
  loggedInUser
}: {
  vehicles: VehicleType[];
  loggedInUser: User | null | undefined;
}) => {
  const supabase = createClient();
  const userFullName = String(loggedInUser?.user_metadata.full_name);
  const allVehicleLocations = (await fetchAllVehicleLocations(
    supabase
  )) as VehicleLocation[];

  return (
    <Tabs defaultValue="vehicles" className="w-[375px] md:w-full">
      <TabsList>
        <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
        <TabsTrigger value="vehicle_status">Vehicles Status</TabsTrigger>
        <TabsTrigger value="location_stream">Location Stream</TabsTrigger>
      </TabsList>
      <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex ">
        <div className="flex items-center justify-between space-y-2"></div>
        <TabsContent value="vehicles">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Welcome back {userFullName.split(' ')[0]}!{' '}
            </h2>
            <p className="text-muted-foreground"></p>
          </div>
          <FilteredVehicles vehicles={vehicles} />
        </TabsContent>
        <TabsContent value="vehicle_status">
          {/* <VehicleStatus vehicles={vehicles} /> */}
          <VehiclesOverview />
        </TabsContent>
        <TabsContent value="location_stream">
          <LocationHistory vehicleLocations={allVehicleLocations} />
        </TabsContent>
      </div>
    </Tabs>
  );
};

export default VehiclesTabContainer;
