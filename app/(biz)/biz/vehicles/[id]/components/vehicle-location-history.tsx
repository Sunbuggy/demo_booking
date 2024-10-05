'use client';
import React from 'react';
import { createClient } from '@/utils/supabase/client';
import {
  fetchVehicleNameFromId,
  getUserDetailsById
} from '@/utils/supabase/queries';
import { VehicleLocation } from '../../types';

const LocationHistory = ({
  vehicleLocation
}: {
  vehicleLocation: VehicleLocation[];
}) => {
  const supabase = createClient();
  const [userDetails, setUserDetails] = React.useState<
    { id: string; name: string }[]
  >([]);
  const [vehicleDetails, setVehicleDetails] = React.useState<
    { id: string; name: string }[]
  >([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const rowsPerPage = 10;

  // Function to fetch user details and update state
  const fetchUserDetails = async (location: VehicleLocation) => {
    if (!location.created_by) {
      return;
    }
    if (location.created_by && location.created_by?.length < 2) {
      return;
    }

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
    if (vehicleLocation.length > 0) {
      vehicleLocation.forEach((location) => {
        fetchUserDetails(location);
        // if (location.vehicle_id) {
        //   fetchVehicleNameFromId(supabase, location.vehicle_id).then((data) => {
        //     setVehicleDetails((prev) => [
        //       ...prev,
        //       {
        //         id: location.vehicle_id as string,
        //         name: data[0].name ?? 'Unknown'
        //       }
        //     ]);
        //   });
        // }
      });
    }
  }, [vehicleLocation]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Calculate the rows to display
  const sortedLocations = vehicleLocation.sort((a, b) =>
    (a?.created_by ?? '') > (b?.created_by ?? '') ? 1 : -1
  );
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = sortedLocations.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(sortedLocations.length / rowsPerPage);

  return (
    <div>
      {/* Create Table to display this data, use tailwind css for styling */}
      <table className="table-auto w-full bg-white bg-opacity-10 backdrop-blur-lg rounded-lg shadow-lg">
        <thead>
          <tr className="bg-gray-800 bg-opacity-50 text-white">
            <th className="px-4 py-2">Vehicle</th>
            <th className="px-4 py-2">Created At</th>
            <th className="px-4 py-2">User</th>
            <th className="px-4 py-2">City</th>
            <th className="px-4 py-2">Map</th>
          </tr>
        </thead>
        <tbody>
          {currentRows.map((location, index) => {
            const user = userDetails.find(
              (user) => user.id === location.created_by
            );
            const vehicle = vehicleDetails.find(
              (vehicle) => vehicle.id === location.vehicle_id
            );

            return (
              <tr
                key={index}
                className="bg-gray-700 bg-opacity-50 text-white hover:bg-gray-600 hover:bg-opacity-50 text-xs"
              >
                <td className="border px-4 py-2">
                  {/* {vehicle?.name} */}
                  Coming Soon
                </td>
                <td className="border px-4 py-2">
                  {new Date(location.created_at).toLocaleString('en-US', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </td>
                <td className="border px-4 py-2">{user?.name || 'unknown'}</td>
                <td className="border px-4 py-2">{location.city}</td>
                <td className="border px-4 py-2">
                  <a
                    href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    View on Map
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {/* Pagination Controls */}
      <div className="flex justify-center mt-4">
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index}
            onClick={() => handlePageChange(index + 1)}
            className={`mx-1 px-3 py-1 rounded ${
              currentPage === index + 1
                ? 'bg-blue-500 text-white'
                : 'bg-gray-300 text-gray-700'
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LocationHistory;
