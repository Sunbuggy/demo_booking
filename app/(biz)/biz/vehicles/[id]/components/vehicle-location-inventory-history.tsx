'use client';
import React from 'react';
import { createClient } from '@/utils/supabase/client';
import { getUserDetailsById } from '@/utils/supabase/queries';
import { InventoryLocation } from '../page';
// (property) Insert: {
//     bay?: string | null;
//     created_at?: string;
//     created_by?: string | null;
//     id?: string;
//     level?: string | null;
//     vehicle_id?: string | null;
// }
const InventoryHistory = ({
  inventoryLocations
}: {
  inventoryLocations: InventoryLocation[];
}) => {
  const supabase = createClient();
  const [userDetails, setUserDetails] = React.useState<
    { id: string; name: string }[]
  >([]);

  // Function to fetch user details and update state
  const fetchUserDetails = async (location: InventoryLocation) => {
    const data = await getUserDetailsById(
      supabase,
      location.created_by as string
    );
    if (data && data.length > 0) {
      setUserDetails((prev) => [
        ...prev,
        {
          id: location.created_by as string,
          name: data[0].full_name ?? 'Unknown'
        }
      ]);
    }
  };

  // Get all users from the database
  React.useEffect(() => {
    if (inventoryLocations.length > 0) {
      inventoryLocations.forEach((location) => {
        fetchUserDetails(location);
      });
    }
  }, [inventoryLocations]);
  return (
    <div>
      {/* Create Table to display this data, use tailwind css for styling */}
      <table className="table-auto w-full bg-white bg-opacity-10 backdrop-blur-lg rounded-lg shadow-lg">
        <thead>
          <tr className="bg-gray-800 bg-opacity-50 text-white">
            <th className="px-4 py-2">Created At</th>
            <th className="px-4 py-2">User</th>
            <th className="px-4 py-2">Bay</th>
            <th className="px-4 py-2">Level</th>
          </tr>
        </thead>
        <tbody>
          {inventoryLocations.map((location, index) => {
            const user = userDetails.find(
              (user) => user.id === location.created_by
            );

            return (
              <tr
                key={index}
                className="bg-gray-700 bg-opacity-50 text-white hover:bg-gray-600 hover:bg-opacity-50 text-xs"
              >
                <td className="border px-4 py-2">
                  {new Date(location.created_at).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </td>
                <td className="border px-4 py-2">{user?.name}</td>
                <td className="border px-4 py-2">{location.bay}</td>
                <td className="border px-4 py-2">{location.level}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryHistory;
