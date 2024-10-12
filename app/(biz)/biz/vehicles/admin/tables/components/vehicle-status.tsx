import React from 'react';
import { VehicleType } from '../../page';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { fetchAllVehicleLocations } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/server';
import { VehicleLocation } from '../../../types';
import {
  BuggyBreakdownTable,
  GeneralTable,
  VehicleLocationByType,
  VehicleLocationOverview
} from './status-tables';

export type VehicleWithLocation = VehicleType & { location?: string };

const VehicleStatus = async ({
  vehicles
}: {
  vehicles: VehicleWithLocation[];
}) => {
  //   Look at vehicle_status of each vehicle then inside my groupsAndCounts object add another key value pair where the key is the vehicle_status and the value is the count of vehicles with that status
  const supabase = createClient();
  const vehicleLocations = (await fetchAllVehicleLocations(supabase)
    .then((data) => data)
    .catch((error) => {
      console.error('Error fetching vehicle locations:', error);
      return [];
    })) as VehicleLocation[];
  // remove all values where longitude or latitude or city are null or zero or undefined,
  const filteredVehicleLocations = vehicleLocations.filter(
    (location) =>
      location.longitude &&
      location.latitude &&
      location.city &&
      location.city !== '0' &&
      location.city !== null
  );

  // sort the filteredVehicleLocations by created_at in descending order and get only unique values by vehicle_id
  const latestVehicleLocations = filteredVehicleLocations
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .filter(
      (location, index, self) =>
        index === self.findIndex((t) => t.vehicle_id === location.vehicle_id)
    );
  // in the vehicles array add a new key called location and assign the value of the location object from latestVehicleLocations where vehicle_id matches the vehicle_id of the vehicle but if no match assign unknown
  vehicles.forEach((vehicle) => {
    const location = latestVehicleLocations.find(
      (location) => location.vehicle_id === vehicle.id
    );
    vehicle.location = location?.city || 'Unknown';
  });

  return (
    <div className="overflow-x-auto">
      <GeneralTable vehicles={vehicles} />
      {/* Buggy Breakdown accordion*/}
      <Accordion type="single" collapsible>
        <AccordionItem value="Buggy_breakdown">
          <AccordionTrigger>
            {/* Get total, count and broken and running just like above */}
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 gap-3 w-full">
              <h2 className="text-lg font-semibold">Buggy Breakdown</h2>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <BuggyBreakdownTable vehicles={vehicles} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Same accordion but broken down with vehicle.type */}
      <Accordion type="single" collapsible>
        <AccordionItem value="Vehicle_Location_Type">
          <AccordionTrigger>
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 gap-3 w-full">
              <h2 className="text-lg font-semibold">
                Vehicle Location by Type
              </h2>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <VehicleLocationByType vehicles={vehicles} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      {/* Accordion that shows VehicleType Location, Count. */}
      <Accordion type="single" collapsible>
        <AccordionItem value="Vehicle_Location">
          <AccordionTrigger>
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 gap-3 w-full">
              <h2 className="text-lg font-semibold">
                Vehicle Location Overview
              </h2>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <VehicleLocationOverview vehicles={vehicles} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default VehicleStatus;
