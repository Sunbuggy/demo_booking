'use client';

import React from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '../components/column-header';
import VehicleStatusAvatar from '@/components/fleet/vehicle-status-avatar';
import { DashboardVehicle } from '@/app/actions/fleet'; 
import { LocationCell } from '@/components/fleet/LocationCell'; // The Pill
import { FleetIcon } from '@/components/fleet/FleetIconProvider';

export const columns: ColumnDef<DashboardVehicle, any>[] = [
  // 1. IDENTITY
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Identity" />
    ),
    cell: ({ row }) => {
      const vehicle = row.original;
      return (
        <div className="flex items-center gap-3 py-1">
          <VehicleStatusAvatar vehicle={vehicle} size="md" showStatusDot={true} />
          <div className="flex flex-col">
            <Link
              href={`/biz/vehicles/${vehicle.id}`}
              className="font-bold text-sm hover:underline hover:text-blue-600 transition-colors"
            >
              {vehicle.name}
            </Link>
            {vehicle.pet_name && (
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                {vehicle.pet_name}
              </span>
            )}
          </div>
        </div>
      );
    },
    enableSorting: true,
  },

  // 2. LOCATION (Uses LocationCell Pill)
  {
    id: 'location',
    accessorFn: (row) => row.location_name,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Location" />
    ),
    cell: ({ row }) => {
      return (
        <div className="w-[160px]"> 
          <LocationCell 
            name={row.original.location_name || 'Unknown'}
            lat={row.original.latitude}
            lng={row.original.longitude}
          />
        </div>
      );
    },
    enableSorting: true,
  },

  // 3. TYPE
  {
    accessorKey: 'type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => {
      const type = row.getValue('type') as string;
      return (
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded w-fit border border-slate-200 dark:border-slate-700">
          <FleetIcon type={type} className="w-3.5 h-3.5 text-slate-500" />
          <span className="capitalize text-xs font-medium text-slate-700 dark:text-slate-300">
            {type}
          </span>
        </div>
      );
    },
    enableSorting: true,
    filterFn: (row, id, value) => value.includes(row.getValue(id))
  },

  // 4. MODEL
  {
    accessorKey: 'model',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Model" />
    ),
    cell: ({ row }) => {
      const model = row.getValue('model') as string;
      return <div className="w-[140px] text-xs truncate text-muted-foreground" title={model}>{model}</div>;
    },
    enableSorting: true
  },

  // 5. YEAR
  {
    accessorKey: 'year',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Year" />
    ),
    cell: ({ row }) => {
      const year = row.getValue('year') as string;
      return <div className="w-[60px] text-xs text-muted-foreground">{year}</div>;
    },
    enableSorting: true
  },

  // 6. PLATE
  {
    accessorKey: 'licenseplate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Plate" />
    ),
    cell: ({ row }) => {
      const licensePlate = row.getValue('licenseplate') as string;
      if (!licensePlate) return <span className="text-xs text-slate-300">-</span>;
      return <div className="w-[80px] text-xs font-mono bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-500 px-1 rounded border border-yellow-100 dark:border-yellow-900 text-center">{licensePlate}</div>;
    },
    enableSorting: true
  }
];