'use client';
import React from 'react';
import { VehicleWithLocation } from './vehicle-status';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
export const GeneralTable = ({
  vehicles
}: {
  vehicles: VehicleWithLocation[];
}) => {
  const [selectedLocations, setSelectedLocations] = React.useState<string[]>(
    []
  );

  const distinctLocations = Array.from(
    new Set(vehicles.map((vehicle) => vehicle.location))
  );

  const handleLocationChange = (location: string) => {
    setSelectedLocations((prev) =>
      prev.includes(location)
        ? prev.filter((l) => l !== location)
        : [...prev, location]
    );
  };

  const filteredVehicles = vehicles.filter(
    (vehicle) =>
      selectedLocations.length === 0 ||
      selectedLocations.includes(vehicle.location || '')
  );

  const modifiedGroupsAndCounts = filteredVehicles.reduce(
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

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Accordion type="single" collapsible>
          <AccordionItem value="select_location_general">
            <AccordionTrigger>
              {/* Get total, count and broken and running just like above */}
              <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 gap-3 w-full">
                <h2 className="text-lg font-semibold"> Select Locations</h2>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div>
                <div className=" mt-1 w-full rounded-md bg-white dark:bg-gray-800 shadow-lg z-10">
                  <ul className="max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                    {distinctLocations.map((location) => (
                      <li
                        key={location}
                        className="text-gray-900 dark:text-gray-100 cursor-default select-none relative py-2 pl-3 pr-9"
                      >
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedLocations.includes(location || '')}
                            onChange={() =>
                              handleLocationChange(location || '')
                            }
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span className="ml-3 block truncate">
                            {location}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
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
            const statusEntries = Object.entries(statuses)
              .filter(([status]) => status !== 'total')
              .sort(([statusA], [statusB]) => {
                if (statusA === 'running') return -1;
                if (statusA === 'broken') return 1;
                return 0;
              });
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
    </div>
  );
};

export const BuggyBreakdownTable = ({
  vehicles
}: {
  vehicles: VehicleWithLocation[];
}) => {
  const [selectedLocations, setSelectedLocations] = React.useState<string[]>(
    []
  );

  const distinctLocations = Array.from(
    new Set(vehicles.map((vehicle) => vehicle.location))
  );

  const handleLocationChange = (location: string) => {
    setSelectedLocations((prev) =>
      prev.includes(location)
        ? prev.filter((l) => l !== location)
        : [...prev, location]
    );
  };

  const filteredVehicles = vehicles.filter(
    (vehicle) =>
      selectedLocations.length === 0 ||
      selectedLocations.includes(vehicle.location || '')
  );

  const buggyGroupsAndCounts = filteredVehicles
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
    <div>
      <div>
        <Accordion type="single" collapsible>
          <AccordionItem value="select_location_general">
            <AccordionTrigger>
              {/* Get total, count and broken and running just like above */}
              <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 gap-3 w-full">
                <h2 className="text-lg font-semibold"> Select Locations</h2>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div>
                <div className=" mt-1 w-full rounded-md bg-white dark:bg-gray-800 shadow-lg z-10">
                  <ul className="max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                    {distinctLocations.map((location) => (
                      <li
                        key={location}
                        className="text-gray-900 dark:text-gray-100 cursor-default select-none relative py-2 pl-3 pr-9"
                      >
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedLocations.includes(location || '')}
                            onChange={() =>
                              handleLocationChange(location || '')
                            }
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span className="ml-3 block truncate">
                            {location}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
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
          {Object.entries(buggyGroupsAndCounts).map(([seats, statuses]) => {
            const statusEntries = Object.entries(statuses)
              .filter(([status]) => status !== 'total')
              .sort(([statusA], [statusB]) => {
                if (statusA === 'running') return -1;
                if (statusA === 'broken') return 1;
                return 0;
              });
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
    </div>
  );
};

export const VehicleLocationByType = ({
  vehicles
}: {
  vehicles: VehicleWithLocation[];
}) => {
  const [selectedStatuses, setSelectedStatuses] = React.useState<string[]>([]);

  const distinctStatuses = Array.from(
    new Set(
      vehicles.map((vehicle) => {
        return vehicle.vehicle_status === 'maintenance' ||
          vehicle.vehicle_status === 'fine'
          ? 'running'
          : vehicle.vehicle_status;
      })
    )
  );

  const handleStatusChange = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const filteredVehicles = vehicles.filter((vehicle) => {
    const status =
      vehicle.vehicle_status === 'maintenance' ||
      vehicle.vehicle_status === 'fine'
        ? 'running'
        : vehicle.vehicle_status;
    return selectedStatuses.length === 0 || selectedStatuses.includes(status);
  });

  return (
    <div>
      <div>
        <Accordion type="single" collapsible>
          <AccordionItem value="select_status_general">
            <AccordionTrigger>
              <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 gap-3 w-full">
                <h2 className="text-lg font-semibold"> Select Statuses</h2>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div>
                <div className="mt-1 w-full rounded-md bg-white dark:bg-gray-800 shadow-lg z-10">
                  <ul className="max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                    {distinctStatuses.map((status) => (
                      <li
                        key={status}
                        className="text-gray-900 dark:text-gray-100 cursor-default select-none relative py-2 pl-3 pr-9"
                      >
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedStatuses.includes(status)}
                            onChange={() => handleStatusChange(status)}
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span className="ml-3 block truncate">{status}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
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
            filteredVehicles.reduce(
              (acc, vehicle) => {
                if (!acc[vehicle.type]) {
                  acc[vehicle.type] = {};
                }
                if (!acc[vehicle.type][vehicle.location || '']) {
                  acc[vehicle.type][vehicle.location || ''] = 1;
                } else {
                  acc[vehicle.type][vehicle.location || ''] += 1;
                }
                return acc;
              },
              {} as Record<string, Record<string, number>>
            )
          ).map(([type, locations]) => (
            <React.Fragment key={type}>
              {Object.entries(locations).map(([location, count], index) => (
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
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};
export const VehicleLocationOverview = ({
  vehicles
}: {
  vehicles: VehicleWithLocation[];
}) => {
  return (
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
              if (!acc[vehicle.location || '']) {
                acc[vehicle.location || ''] = 1;
              } else {
                acc[vehicle.location || ''] += 1;
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
  );
};
