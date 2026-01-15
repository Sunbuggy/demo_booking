'use client';
import React from 'react';

// --- TYPES ---
type VehicleWithLocation = {
  type: string;
  location: string;
  vehicle_status: string;
  seats: number;
};

// --- TABLE 1: GENERAL OVERVIEW ---
export const GeneralTable = ({ vehicles }: { vehicles: VehicleWithLocation[] }) => {
  const groupedData = vehicles.reduce((acc, v) => {
    // Safety check for missing types
    const type = v.type || 'Unknown';
    if (!acc[type]) acc[type] = { total: 0, running: 0, broken: 0 };
    
    acc[type].total += 1;
    if (v.vehicle_status === 'broken') acc[type].broken += 1;
    else acc[type].running += 1;
    
    return acc;
  }, {} as Record<string, { total: number; running: number; broken: number }>);

  return (
    <div className="flex flex-col gap-5">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Running / Broken</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {Object.entries(groupedData).map(([type, stats], idx) => (
            // FIX: Use Index `idx` to guarantee uniqueness
            <tr key={`gen-row-${idx}`}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                {type} (Total: {stats.total})
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm flex items-center gap-2">
                <span className="text-green-500 font-bold">{stats.running}</span>
                <span className="text-gray-400">/</span>
                <span className="text-red-500 font-bold">{stats.broken}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// --- TABLE 2: BUGGY BREAKDOWN ---
export const BuggyBreakdownTable = ({ vehicles }: { vehicles: VehicleWithLocation[] }) => {
  const groupedData = vehicles
    .filter(v => v.type === 'buggy')
    .reduce((acc, v) => {
      const seatKey = String(v.seats || '?');
      if (!acc[seatKey]) acc[seatKey] = { total: 0, running: 0, broken: 0 };
      
      acc[seatKey].total += 1;
      if (v.vehicle_status === 'broken') acc[seatKey].broken += 1;
      else acc[seatKey].running += 1;
      
      return acc;
    }, {} as Record<string, { total: number; running: number; broken: number }>);

  return (
    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
      <thead className="bg-gray-50 dark:bg-gray-800">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Seats</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
        </tr>
      </thead>
      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
        {Object.entries(groupedData).map(([seats, stats], idx) => (
          // FIX: Use Index `idx` to guarantee uniqueness
          <tr key={`buggy-row-${idx}`}>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
              {seats} Seater (Total: {stats.total})
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm flex items-center gap-2">
              <span className="text-green-500 font-bold">{stats.running}</span>
              <span className="text-gray-400">/</span>
              <span className="text-red-500 font-bold">{stats.broken}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// --- TABLE 3: LOCATION BY TYPE ---
export const VehicleLocationByType = ({ vehicles }: { vehicles: VehicleWithLocation[] }) => {
  const groupedData: Record<string, Record<string, number>> = {};
  
  vehicles.forEach(v => {
    const type = v.type || 'Unknown';
    const loc = v.location || 'Unknown';
    if (!groupedData[type]) groupedData[type] = {};
    if (!groupedData[type][loc]) groupedData[type][loc] = 0;
    groupedData[type][loc]++;
  });

  const flatRows: Array<{ type: string, location: string, count: number, rowSpan: number, first: boolean }> = [];

  Object.entries(groupedData).forEach(([type, locations]) => {
    const entries = Object.entries(locations);
    entries.forEach(([loc, count], idx) => {
      flatRows.push({
        type,
        location: loc,
        count,
        rowSpan: entries.length,
        first: idx === 0
      });
    });
  });

  return (
    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
      <thead className="bg-gray-50 dark:bg-gray-800">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Location</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Count</th>
        </tr>
      </thead>
      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
        {flatRows.map((row, idx) => (
          // FIX: Use Index `idx` to guarantee uniqueness
          <tr key={`loc-type-row-${idx}`}>
            {row.first && (
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 bg-gray-50/50" rowSpan={row.rowSpan}>
                {row.type}
              </td>
            )}
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{row.location}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{row.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// --- TABLE 4: LOCATION OVERVIEW ---
export const VehicleLocationOverview = ({ vehicles }: { vehicles: VehicleWithLocation[] }) => {
  const counts = vehicles.reduce((acc, v) => {
    const loc = v.location || 'Unknown';
    if (!acc[loc]) acc[loc] = 0;
    acc[loc]++;
    return acc;
  }, {} as Record<string, number>);

  return (
    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
      <thead className="bg-gray-50 dark:bg-gray-800">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Location</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Count</th>
        </tr>
      </thead>
      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
        {Object.entries(counts).map(([loc, count], idx) => (
          // FIX: Use Index `idx` to guarantee uniqueness
          <tr key={`overview-row-${idx}`}>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{loc}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};