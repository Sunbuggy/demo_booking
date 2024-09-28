'use client';
import React from 'react';
import { VehicleLocation } from '../page';
import { ItemText } from '@radix-ui/react-select';

const LocationHistory = ({
  vehicleLocation
}: {
  vehicleLocation: VehicleLocation[];
}) => {
  return (
    <div>
      {/* Create Table to display this data, use tailwind css for styling */}
      <table className="table-auto w-full bg-white bg-opacity-10 backdrop-blur-lg rounded-lg shadow-lg">
        <thead>
          <tr className="bg-gray-800 bg-opacity-50 text-white">
            <th className="px-4 py-2">Created At</th>
            <th className="px-4 py-2">City</th>
            <th className="px-4 py-2">Map</th>
          </tr>
        </thead>
        <tbody>
          {vehicleLocation.map((location, index) => (
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
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LocationHistory;
