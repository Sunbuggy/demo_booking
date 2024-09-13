'use client';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '../components/column-header';
import { VehicleType } from '../../page';
import { DataTableRowActions } from '../components/row-actions';
import React from 'react';
import Link from 'next/link';
export interface TimeSinceClockIn {
  data: number;
}
export const columns: ColumnDef<VehicleType, any>[] = [
  // Actions COLUMN
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />
  },

  // FULL NAME COLUMN
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      const name = row.getValue('name') as string;
      return (
        <Link
          href={`/biz/vehicles/${row.original.id}`}
          className="w-[80px] underline text-pink-500 "
        >
          {name}
        </Link>
      );
    },
    enableSorting: true,
    enableHiding: false
  },
  // Type COLUMN
  {
    accessorKey: 'type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => {
      const type = row.getValue('type') as string;
      return <div className="w-[90px] ">{type}</div>;
    },
    enableSorting: true,
    enableHiding: false,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    }
  },
  //Model COLUMN
  {
    accessorKey: 'model',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Model" />
    ),
    cell: ({ row }) => {
      const model = row.getValue('model') as string;
      return <div className="w-[140px] ">{model}</div>;
    },
    enableSorting: true
  },
  //Year COLUMN
  {
    accessorKey: 'year',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Year" />
    ),
    cell: ({ row }) => {
      const year = row.getValue('year') as string;
      return <div className="w-[80px] ">{year}</div>;
    },
    enableSorting: true
  },
  // Seats COLUMN
  {
    accessorKey: 'seats',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Seats" />
    ),
    cell: ({ row }) => {
      const seats = row.getValue('seats') as string;
      return <div className="w-[80px] ">{seats}</div>;
    },
    enableSorting: true
  },
  // COLOR COLUMN
  {
    accessorKey: 'color',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Color" />
    ),
    cell: ({ row }) => {
      const color = row.getValue('color') as string;
      return <div className="w-[80px] ">{color}</div>;
    },
    enableSorting: true
  },
  // VIN COLUMN
  {
    accessorKey: 'vin',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="VIN" />
    ),
    cell: ({ row }) => {
      const vin = row.getValue('vin') as string;
      return <div className="w-[80px] ">{vin}</div>;
    },
    enableSorting: true
  },
  //Notes COLUMN
  {
    accessorKey: 'notes',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Notes" />
    ),
    cell: ({ row }) => {
      const notes = row.getValue('notes') as string;
      return <div className="w-[80px] ">{notes}</div>;
    },
    enableSorting: true
  },
  // STATE COLUMN
  {
    accessorKey: 'state',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="State" />
    ),
    cell: ({ row }) => {
      const state = row.getValue('state') as string;
      return <div className="w-[80px] ">{state}</div>;
    },
    enableSorting: true
  },
  // LICENSE PLATE COLUMN
  {
    accessorKey: 'licenseplate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="License Plate" />
    ),
    cell: ({ row }) => {
      const licensePlate = row.getValue('licenseplate') as string;
      return <div className="w-[80px] ">{licensePlate}</div>;
    },
    enableSorting: true
  }
  //  PIC UPLOAD COLUMN
];
