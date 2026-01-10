'use client';

import React from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '../components/column-header';
import VehicleStatusAvatar from '@/components/fleet/vehicle-status-avatar';
import { DashboardVehicle } from '@/app/actions/fleet'; 

export const columns: ColumnDef<DashboardVehicle, any>[] = [
  // 1. IDENTITY COLUMN (Avatar + Name)
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Identity" />
    ),
    cell: ({ row }) => {
      const vehicle = row.original;
      return (
        <div className="flex items-center gap-3 py-1">
          {/* The Status Avatar */}
          <VehicleStatusAvatar 
            vehicle={vehicle} 
            size="md" 
            showStatusDot={true} 
          />
          
          {/* Text Details (Clickable) */}
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
    enableHiding: false
  },

  // 2. LOCATION COLUMN (New! Uses Server-Side Geofencing)
  {
    id: 'location',
    accessorFn: (row) => row.location_name,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Location" />
    ),
    cell: ({ row }) => {
      const loc = row.original.location_name || 'Unknown';
      return (
        <div className="w-[100px] text-xs font-medium text-slate-600 dark:text-slate-400 truncate">
          {loc}
        </div>
      );
    },
    enableSorting: true,
  },

  // 3. TYPE COLUMN
  {
    accessorKey: 'type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => {
      const type = row.getValue('type') as string;
      return (
        <div className="capitalize w-[80px] text-xs font-medium bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-center">
          {type}
        </div>
      );
    },
    enableSorting: true,
    enableHiding: false,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    }
  },

  // 4. MODEL COLUMN
  {
    accessorKey: 'model',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Model" />
    ),
    cell: ({ row }) => {
      const model = row.getValue('model') as string;
      return <div className="w-[140px] text-xs truncate" title={model}>{model}</div>;
    },
    enableSorting: true
  },

  // 5. YEAR COLUMN
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

  // 6. LICENSE PLATE
  {
    accessorKey: 'licenseplate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Plate" />
    ),
    cell: ({ row }) => {
      const licensePlate = row.getValue('licenseplate') as string;
      if (!licensePlate) return <span className="text-xs text-slate-300">-</span>;
      return <div className="w-[80px] text-xs font-mono bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-500 px-1 rounded border border-yellow-100 dark:border-yellow-900">{licensePlate}</div>;
    },
    enableSorting: true
  }
];