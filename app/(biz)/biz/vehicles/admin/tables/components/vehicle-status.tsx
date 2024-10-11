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

type VehicleWithLocation = VehicleType & { location: string };

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

  const modifiedGroupsAndCounts = vehicles.reduce(
    (acc, vehicle) => {
      const status =
        vehicle.vehicle_status === 'maintenance' ||
        vehicle.vehicle_status === 'fine'
          ? 'running'
          : vehicle.vehicle_status;

      if (!acc[vehicle.type]) {
        acc[vehicle.type] = { total: 0 };
      }
      if (!acc[vehicle.type][status]) {
        acc[vehicle.type][status] = 1;
      } else {
        acc[vehicle.type][status] += 1;
      }
      acc[vehicle.type].total += 1;
      return acc;
    },
    {} as Record<string, Record<string, number>>
  );

  // Breakdown if vehicle type is buggy by vehicle.seats, create same object as above but only for buggies
  const buggyGroupsAndCounts = vehicles
    .filter((vehicle) => vehicle.type === 'buggy')
    .reduce(
      (acc, vehicle) => {
        const status =
          vehicle.vehicle_status === 'maintenance' ||
          vehicle.vehicle_status === 'fine'
            ? 'running'
            : vehicle.vehicle_status;

        if (!acc[vehicle.seats]) {
          acc[vehicle.seats] = { total: 0 };
        }
        if (!acc[vehicle.seats][status]) {
          acc[vehicle.seats][status] = 1;
        } else {
          acc[vehicle.seats][status] += 1;
        }
        acc[vehicle.seats].total += 1;
        return acc;
      },
      {} as Record<string, Record<string, number>>
    );

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              Vehicle Type
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              <span className="text-green-500">running</span>/
              <span className="text-red-500">broken</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {Object.entries(modifiedGroupsAndCounts).map(([type, statuses]) => {
            const statusEntries = Object.entries(statuses).filter(
              ([status]) => status !== 'total'
            );
            return (
              <tr key={type}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                  {type} (Total: {statuses.total})
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 flex">
                  {statusEntries.map(([status, count], index) => {
                    let colorClass = '';
                    if (status === 'broken') {
                      colorClass = 'text-red-500';
                    } else if (status === 'running') {
                      colorClass = 'text-green-500';
                    }
                    return (
                      <React.Fragment key={status}>
                        <div className={`flex items-center ${colorClass}`}>
                          <span>{count}</span>
                        </div>
                        {index < statusEntries.length - 1 && (
                          <span className="mx-1">/</span>
                        )}
                      </React.Fragment>
                    );
                  })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
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
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Seats
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    <span className="text-green-500">running</span>/
                    <span className="text-red-500">broken</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {Object.entries(buggyGroupsAndCounts).map(
                  ([seats, statuses]) => {
                    const statusEntries = Object.entries(statuses).filter(
                      ([status]) => status !== 'total'
                    );
                    return (
                      <tr key={seats}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {seats} Seater (Total: {statuses.total})
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 flex">
                          {statusEntries.map(([status, count], index) => {
                            let colorClass = '';
                            if (status === 'broken') {
                              colorClass = 'text-red-500';
                            } else if (status === 'running') {
                              colorClass = 'text-green-500';
                            }
                            return (
                              <React.Fragment key={status}>
                                <div
                                  className={`flex items-center ${colorClass}`}
                                >
                                  <span>{count}</span>
                                </div>
                                {index < statusEntries.length - 1 && (
                                  <span className="mx-1">/</span>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
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
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Vehicle Type
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Location
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Count
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {Object.entries(
                  vehicles.reduce(
                    (acc, vehicle) => {
                      if (!acc[vehicle.type]) {
                        acc[vehicle.type] = {};
                      }
                      if (!acc[vehicle.type][vehicle.location]) {
                        acc[vehicle.type][vehicle.location] = 1;
                      } else {
                        acc[vehicle.type][vehicle.location] += 1;
                      }
                      return acc;
                    },
                    {} as Record<string, Record<string, number>>
                  )
                ).map(([type, locations]) => (
                  <React.Fragment key={type}>
                    {Object.entries(locations).map(
                      ([location, count], index) => (
                        <tr key={location}>
                          {index === 0 && (
                            <td
                              className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100"
                              rowSpan={Object.keys(locations).length}
                            >
                              {type}
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                            {location}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {count}
                          </td>
                        </tr>
                      )
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
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
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Location
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Count
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {Object.entries(
                  vehicles.reduce(
                    (acc, vehicle) => {
                      if (!acc[vehicle.location]) {
                        acc[vehicle.location] = 1;
                      } else {
                        acc[vehicle.location] += 1;
                      }
                      return acc;
                    },
                    {} as Record<string, number>
                  )
                ).map(([location, count]) => (
                  <tr key={location}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default VehicleStatus;
