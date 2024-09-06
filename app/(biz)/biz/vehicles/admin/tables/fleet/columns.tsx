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
import { createClient } from '@/utils/supabase/client';
import { getVehicleProfilePic } from '@/utils/supabase/queries';
import ImageGalleryComponent from '@/components/ui/image-gallery';

export interface TimeSinceClockIn {
  data: number;
}
interface ProfilePic {
  profile_pic_bucket: any;
  profile_pic_key: any;
}
interface PicUrl {
  url: string;
  key: string;
}
export const columns: ColumnDef<VehicleType, any>[] = [
  // Pic Column
  {
    accessorKey: 'profile_pic',
    header: ({ column }) => <DataTableColumnHeader column={column} title="" />,
    cell: ({ row }) => {
      const [profilePicData, setProfilePicData] =
        React.useState<ProfilePic | null>(null);
      const [profilePic, setProfilePic] = React.useState<string>('');
      const supabase = createClient();
      React.useEffect(() => {
        const fetchProfilePic = async () => {
          const pic = (await getVehicleProfilePic(
            supabase,
            row.original.id
          )) as ProfilePic[];
          setProfilePicData(pic[0]);
        };
        fetchProfilePic();
      }, []);
      React.useEffect(() => {
        async function fetchProfilePic() {
          if (
            profilePicData?.profile_pic_key !== undefined &&
            profilePicData?.profile_pic_bucket !== undefined
          ) {
            try {
              const response = await fetch(
                `${process.env.NEXT_PUBLIC_SITE_URL}/api/s3/upload?bucket=${profilePicData?.profile_pic_bucket}&key=${profilePicData?.profile_pic_key}&fetchOne=true`
              );
              if (response.ok) {
                const result = await response.json();
                setProfilePic(result.url);
              } else {
                throw new Error('Network response was not ok.');
              }
            } catch (error) {
              console.error(
                'There has been a problem with your fetch operation:',
                error
              );
            }
          }
        }
        fetchProfilePic() as unknown as PicUrl;
      }, [profilePicData]);
      const name = row.getValue('name') as string;
      return (
        <div className="w-[50px]">
          <Avatar className="h-9 w-9">
            <ImageGalleryComponent
              items={
                profilePic
                  ? [
                      {
                        original: profilePic
                      }
                    ]
                  : []
              }
              alt={name}
            />
            {profilePic === '' && (
              <AvatarFallback>
                <CarIcon />
              </AvatarFallback>
            )}
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
          formData.append('subDir', row.original.name); // Replace with actual subdirectory
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
