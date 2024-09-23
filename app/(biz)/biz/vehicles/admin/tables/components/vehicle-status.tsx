import React from 'react';
import { VehicleType } from '../../page';

const VehicleStatus = ({ vehicles }: { vehicles: VehicleType[] }) => {
  // from the vehicles array first group by type then count how many are in each group and return group name and count using typescript

  //   Look at vehicle_status of each vehicle then inside my groupsAndCounts object add another key value pair where the key is the vehicle_status and the value is the count of vehicles with that status

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
    </div>
  );
};

export default VehicleStatus;
