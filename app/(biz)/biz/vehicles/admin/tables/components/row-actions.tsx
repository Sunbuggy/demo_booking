'use client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/utils/supabase/client';
import {
  changeVehicleProfilePic,
  removeVehicle
} from '@/utils/supabase/queries';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { Row } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import React from 'react';
import { VehicleType } from '../../page';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { DialogClose } from '@radix-ui/react-dialog';
import ImageGallery from 'react-image-gallery';
import 'react-image-gallery/styles/css/image-gallery.css';
import EditVehicle from './edit-vehicle';
import Link from 'next/link';
interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}
export interface VehiclePics {
  key: string;
  url: string;
}

export function DataTableRowActions<TData>({
  row
}: DataTableRowActionsProps<TData>) {
  const vehicle = row.original as VehicleType;
  const supabase = createClient();
  const [deleteVehicle, setDeleteVehicle] = React.useState<boolean>(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [pictures, setPictures] = React.useState<VehiclePics[]>([]);
  const [showPics, setShowPics] = React.useState<boolean>(false);
  const { toast } = useToast();
  const router = useRouter();
  React.useEffect(() => {
    const channel = supabase
      .channel('fetch vehicles')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicles'
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router]);

  React.useEffect(() => {
    if (deleteVehicle) {
      removeVehicle(supabase, vehicle.id)
        .then((res) => {
          toast({
            title: 'Success',
            description: 'Vehicle has been deleted',
            duration: 2000,
            variant: 'success'
          });
        })
        .catch((err) => {
          toast({
            title: 'Error',
            description: 'Error deleting user',
            duration: 2000,
            variant: 'destructive'
          });
          console.error(err);
        });
    }
    setDeleteVehicle(false);
  }, [deleteVehicle]);

  const fetchPics = async () => {
    const bucket = 'sb-fleet';
    const mainDir = 'vehicles';
    const subDir = vehicle.id;
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/s3/upload/?bucket=${bucket}&mainDir=${mainDir}&subDir=${subDir}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const { objects } = (await response.json()) as { objects: VehiclePics[] };
    if (response.ok) {
      setPictures(objects);
    } else {
      console.error(objects);
    }
  };
  const handleButtonClick = async () => {
    setShowPics(!showPics);
    if (showPics) setPictures([]);
    await fetchPics();
  };

  const handleMakeProfilePic = async (
    bucket: string,
    key: string,
    url: string
  ) => {
    await changeVehicleProfilePic(supabase, vehicle.id, bucket, key)
      .then((res) => {
        toast({
          title: 'Success',
          description: 'Profile picture changed successfully',
          duration: 2000,
          variant: 'success'
        });
      })
      .catch((err) => {
        console.error(err);
        toast({
          title: 'Error',
          description: 'Error changing profile picture',
          duration: 2000,
          variant: 'destructive'
        });
      });
  };

  const handleDeleteImage = async (bucket: string, key: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/s3/upload?bucket=${bucket}&key=${key}`,
        {
          method: 'DELETE'
        }
      );

      const data = await response.json();

      if (response.ok) {
        // update pictures
        setPictures(pictures.filter((pic) => pic.key !== key));
        // show toast
        toast({
          title: 'Success',
          description: 'File deleted successfully',
          duration: 2000,
          variant: 'success'
        });
      } else {
        // show toast
        toast({
          title: 'Error',
          description: 'Error deleting file',
          duration: 2000,
          variant: 'destructive'
        });
        throw new Error(data.message || 'Failed to delete file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      // Handle error (e.g., show error message to user)
    }
  };
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <DotsHorizontalIcon className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsViewDialogOpen(true)}>
            View
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)}>
            Delete
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
            Edit
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogTitle>Viewing {vehicle.name}</DialogTitle>
          <Button onClick={handleButtonClick}>
            {!showPics ? 'View Pics' : 'Hide Pics'}
          </Button>
          {showPics &&
            (pictures.length > 0 ? (
              <div className="flex flex-col gap-2">
                <ImageGallery
                  items={pictures.map((pic, index) => ({
                    original: pic.url,
                    thumbnail: pic.url,
                    renderItem: () => {
                      // name of pic is found between the 5th and 6th slashes
                      const picName = pic.url.split('/').slice(5, 6).join('');
                      // bucket name is found between the 3rd and 4th slashes
                      const bucket = pic.url.split('/').slice(3, 4).join('');
                      return (
                        <div>
                          <img src={pic.url} alt={picName} />
                          <div className="flex gap-8 mt-5">
                            <Button
                              onClick={() =>
                                handleMakeProfilePic(bucket, pic.key, pic.url)
                              }
                            >
                              Make Profile Pic
                            </Button>
                            <Button
                              onClick={() => handleDeleteImage(bucket, pic.key)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      );
                    }
                  }))}
                  showFullscreenButton={true}
                  showPlayButton={false}
                />
              </div>
            ) : (
              <>no pictures for this vehicle</>
            ))}
          <DialogClose>Close</DialogClose>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogTitle>
            Are you sure you want to delete {vehicle.name}?
          </DialogTitle>
          <div className="flex gap-3">
            <Button
              onClick={() => {
                setDeleteVehicle(true);
                setIsDeleteDialogOpen(false);
              }}
            >
              Yes
            </Button>
            <Button onClick={() => setIsDeleteDialogOpen(false)}>No</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent
          className={'lg:max-w-screen-lg overflow-y-scroll max-h-screen'}
        >
          <DialogTitle>Editing {vehicle.name}</DialogTitle>
          {/* Add your edit vehicle form or content here */}
          <EditVehicle id={vehicle.id} />
          <DialogClose className="text-red-500">Close</DialogClose>
        </DialogContent>
      </Dialog>
    </>
  );
}
