'use client';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '../components/column-header';
import { VehicleType } from '../../page';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CarIcon } from 'lucide-react';
import { DataTableRowActions } from '../components/row-actions';
import React from 'react';
import { useToast } from '@/components/ui/use-toast';
import UploadForm from '../components/upload-form';
import DialogFactory from '../components/dialog-factory';
import ImageView from '../../../[id]/components/image-view';
import Link from 'next/link';

export interface TimeSinceClockIn {
  data: number;
}
export const columns: ColumnDef<VehicleType, any>[] = [
  // Pic Column
  {
    accessorKey: 'profile_pic',
    header: ({ column }) => <DataTableColumnHeader column={column} title="" />,
    cell: ({ row }) => {
      const [profilePic, setProfilePic] = React.useState<string | null>(null);
      const [isDialogOpen, setIsDialogOpen] = React.useState(false);
      const [file, setFile] = React.useState<File | null>(null);
      const [uploading, setUploading] = React.useState(false);
      const inputFile = React.useRef<HTMLInputElement>(null);
      const { toast } = useToast();
      const id = row.original.id;

      React.useEffect(() => {
        const bucket = 'sb-fleet';
        const mainDir = 'vehicles';
        const subDir = 'profile_pic';

        async function getProfilePic() {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_SITE_URL}/api/s3/upload?bucket=${bucket}&mainDir=${mainDir}&subDir=${subDir}&key=${id}&fetchOne=true`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
          const { url } = await response.json();
          if (response.ok) {
            setProfilePic(url);
          } else {
            console.error('Error fetching profile picture:', url);
          }
        }

        getProfilePic();
      }, [id]);

      const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!file) {
          toast({
            title: 'Error',
            description: 'Please select a file to upload.',
            variant: 'destructive'
          });
          return;
        }

        setUploading(true);

        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('mainDir', 'vehicles');
          formData.append('subDir', 'profile_pic');
          formData.append('bucket', 'sb-fleet');
          formData.append('pic_key', id);
          formData.append('mode', 'profile_pic');
          formData.append('contentType', file.type);

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_SITE_URL}/api/s3/upload`,
            {
              method: 'POST',
              body: formData
            }
          );

          const data = await response.json();

          if (response.ok) {
            toast({
              title: 'Success',
              description: 'File uploaded successfully'
            });
          } else {
            throw new Error(data.message || 'Failed to upload file');
          }
        } catch (error) {
          console.error('Error uploading file:', error);
          toast({
            title: 'Error',
            description: 'Failed to upload file. Please try again.',
            variant: 'destructive'
          });
        } finally {
          setUploading(false);
        }
      };
      return (
        <div className="w-[50px]">
          <Avatar className="h-9 w-9">
            {profilePic !== '' && profilePic !== undefined && profilePic ? (
              <>
                <ImageView src={profilePic} />
              </>
            ) : (
              <AvatarFallback
                className="hover: cursor-pointer"
                onClick={() => setIsDialogOpen(true)}
              >
                <CarIcon />
              </AvatarFallback>
            )}
          </Avatar>
          <DialogFactory
            title="Add Profile Pic"
            setIsDialogOpen={setIsDialogOpen}
            isDialogOpen={isDialogOpen}
            children={
              <div>
                <UploadForm
                  handleSubmit={handleSubmit}
                  inputFile={inputFile}
                  setFile={setFile}
                  uploading={uploading}
                />
              </div>
            }
          />
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
  },
  //  PIC UPLOAD COLUMN
  {
    accessorKey: 'pic_upload',
    header: ({ column }) => <div>Add Pics</div>,
    cell: ({ row }) => {
      const [file, setFile] = React.useState<File | null>(null);
      const [uploading, setUploading] = React.useState(false);
      const inputFile = React.useRef<HTMLInputElement>(null);
      const { toast } = useToast();
      const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!file) {
          toast({
            title: 'Error',
            description: 'Please select a file to upload.',
            variant: 'destructive'
          });
          return;
        }

        setUploading(true);

        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('mainDir', 'vehicles');
          formData.append('subDir', row.original.id);
          formData.append('bucket', 'sb-fleet');
          formData.append('contentType', file.type);

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_SITE_URL}/api/s3/upload`,
            {
              method: 'POST',
              body: formData
            }
          );

          const data = await response.json();

          if (response.ok) {
            toast({
              title: 'Success',
              description: 'File uploaded successfully'
            });
          } else {
            throw new Error(data.message || 'Failed to upload file');
          }
        } catch (error) {
          console.error('Error uploading file:', error);
          toast({
            title: 'Error',
            description: 'Failed to upload file. Please try again.',
            variant: 'destructive'
          });
        } finally {
          setUploading(false);
        }
      };
      return (
        <div>
          {uploading ? (
            <div>Uploading...</div>
          ) : (
            <UploadForm
              handleSubmit={handleSubmit}
              inputFile={inputFile}
              setFile={setFile}
              uploading={uploading}
            />
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
];
