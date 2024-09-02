'use client';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '../components/column-header';
import { VehicleType } from '../../page';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CarIcon, UploadIcon } from 'lucide-react';
import { DataTableRowActions } from '../components/row-actions';
import { Input } from '@/components/ui/input';
import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { insertIntoVehiclePics } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/client';
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
      const inputFile = React.useRef<HTMLInputElement>(null);
      const supabase = createClient();
      // get toast
      const { toast } = useToast();

      const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!file) {
          alert('Please select a file to upload.');
          return;
        }
        setUploading(true);
        const response = await fetch(
          process.env.NEXT_PUBLIC_SITE_URL + '/api/s3/upload',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              mainDir: 'vehicles',
              subDir: row.getValue('name'),
              bucket: 'sb-fleet',
              contentType: file.type
            })
          }
        );

        const result = await response.json();
        if (response.ok) {
          console.log(result);
          const formData = new FormData();
          Object.entries(result.fields).forEach(([key, value]) => {
            formData.append(key, value as string);
          });
          formData.append('file', file);
          const uploadResponse = await fetch(result.url, {
            method: 'POST',
            body: formData
          });

          const uploadResult = await uploadResponse.json();
          console.log(uploadResult);

          // if(uploadResponse.ok){
          //   toast({
          //     title: 'Success',
          //     description: uploadResult.message,
          //     duration: 2000,
          //     variant: 'success'
          //   });
          // }else{
          //   toast({
          //     title: 'Error',
          //     description: uploadResult.message,
          //     duration: 2000,
          //     variant: 'destructive'
          //   });
          // }
          //   insertIntoVehiclePics(
          //     supabase,
          //     row.original.id,
          //     result.bucket,
          //     result.endpoint,
          //     result.key
          //   )
          //     .then(() => {
          //       toast({
          //         title: 'Success',
          //         description: result.message,
          //         duration: 2000,
          //         variant: 'success'
          //       });
          //     })
          //     .catch((err) => {
          //       toast({
          //         title: 'Error',
          //         description: 'Database error',
          //         duration: 2000,
          //         variant: 'destructive'
          //       });
          //     });
          // } else {
          //   toast({
          //     title: 'Error',
          //     description: result.message,
          //     duration: 2000,
          //     variant: 'destructive'
          //   });
          // }

          setUploading(false);

          // Clear the input file
          if (inputFile.current) {
            inputFile.current.value = '';
          }
        }
      };

      return (
        <div>
          {uploading ? (
            <div>Uploading...</div>
          ) : (
            <form onSubmit={handleSubmit} className=" flex gap-3">
              <Input
                id="file"
                type="file"
                ref={inputFile}
                className="w-[120px] hover:cursor-pointer"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files) {
                    setFile(files[0]);
                  }
                }}
                accept="image/png, image/jpeg"
              />
              <Button size={'icon'} type="submit" disabled={uploading}>
                <UploadIcon />
              </Button>
            </form>
          )}
        </div>
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
