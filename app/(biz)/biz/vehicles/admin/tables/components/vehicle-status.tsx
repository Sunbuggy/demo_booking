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

  function isNearVegasShop(lat: number, lon: number): boolean {
    const shopCoordinates = [{ lat: 36.278439, lon: -115.020068 }];

    return shopCoordinates.some((coord) => {
      const distance = getDistanceFromLatLonInMiles(
        lat,
        lon,
        coord.lat,
        coord.lon
      );
      return distance <= 2;
    });
  }

  function isNearNellis(lat: number, lon: number): boolean {
    const nellisCoordinates = [
      { lat: 36.288471, lon: -114.970005 },
      { lat: 36.316064, lon: -114.944085 }
    ];

    return nellisCoordinates.some((coord) => {
      const distance = getDistanceFromLatLonInMiles(
        lat,
        lon,
        coord.lat,
        coord.lon
      );
      return distance <= 2;
    });
  }

  function getDistanceFromLatLonInMiles(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 3958.8; // Radius of the Earth in miles
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in miles
    return distance;
  }

  function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // In vehicleLocations Change location.city to 'Vegas Shop' if isNearVegasShop is true and location.city to 'Nellis' if isNearNellis is true

  vehicleLocations.forEach((location) => {
    if (location.latitude !== null && location.longitude !== null) {
      if (isNearVegasShop(location.latitude, location.longitude)) {
        location.city = 'Vegas Shop';
      } else if (isNearNellis(location.latitude, location.longitude)) {
        location.city = 'Nellis';
      }
    }
  });

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
