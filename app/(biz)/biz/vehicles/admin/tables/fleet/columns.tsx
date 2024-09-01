'use client';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '../components/column-header';
import { VehicleType } from '../../page';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CarIcon } from 'lucide-react';
import { DataTableRowActions } from '../components/row-actions';
import { Input } from '@/components/ui/input';
import React from 'react';
import { Button } from '@/components/ui/button';
export interface TimeSinceClockIn {
  data: number;
}
export const columns: ColumnDef<VehicleType, any>[] = [
  // Pic Column
  {
    accessorKey: 'profile_pic',
    header: ({ column }) => <DataTableColumnHeader column={column} title="" />,
    cell: ({ row }) => {
      const name = row.getValue('name') as string;
      const profile_pic = row.getValue('profile_pic') as string;

      return (
        <div className="w-[50px]">
          <Avatar className="h-9 w-9">
            <AvatarImage
              loading="lazy"
              src={row.getValue('profile_pic')}
              alt={name || 'no name'}
            />
            <AvatarFallback>
              <CarIcon />
            </AvatarFallback>
          </Avatar>
        </div>
      );
    },
    enableSorting: false
  },

  // FULL NAME COLUMN
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      const name = row.getValue('name') as string;
      return <div className="w-[80px] ">{name}</div>;
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

  {
    accessorKey: 'profile_pic_upload',
    header: ({ column }) => <div>Add Pics</div>,
    cell: ({ row }) => {
      const [file, setFile] = React.useState<File | null>(null);
      const [uploading, setUploading] = React.useState(false);

      const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!file) {
          alert('Please select a file to upload.');
          return;
        }

        setUploading(true);

        // Convert file to base64
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
          const base64data = reader.result;

          const response = await fetch(
            process.env.NEXT_PUBLIC_SITE_URL + '/api/s3/upload-pic',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                file: {
                  name: file.name,
                  type: file.type,
                  data: base64data
                },
                mainDir: 'vehicles',
                subDir: 'profile',
                bucket: 'sb-fleet'
              })
            }
          );

          if (response.ok) {
            const result = await response.json();
            console.log(result);
          } else {
            alert('Failed to get pre-signed URL.');
          }

          setUploading(false);
        };
      };

      return (
        <form onSubmit={handleSubmit}>
          <input
            id="file"
            type="file"
            onChange={(e) => {
              const files = e.target.files;
              if (files) {
                setFile(files[0]);
              }
            }}
            accept="image/png, image/jpeg"
          />
          <button type="submit" disabled={uploading}>
            Upload
          </button>
        </form>
      );
    }
  },
  // Actions COLUMN
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />
  }
  // profile pic COLUMN

  // EMAIL COLUMN
  // {
  //   accessorKey: 'email',
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Email" />
  //   ),
  //   cell: ({ row }) => <div className="w-[250px]">{row.getValue('email')}</div>
  // }
];
