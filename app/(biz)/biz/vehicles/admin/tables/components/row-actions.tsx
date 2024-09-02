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
import { removeVehicle } from '@/utils/supabase/queries';
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
import Image from 'next/image';

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({
  row
}: DataTableRowActionsProps<TData>) {
  interface VehiclePics {
    key: string;
    url: string;
  }
  const vehicle = row.original as VehicleType;
  const supabase = createClient();
  const [deleteVehicle, setDeleteVehicle] = React.useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
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
            description: 'User has been deleted',
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
    const subDir = vehicle.name;
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
      console.log(objects);
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
        <DropdownMenuContent
          align="end"
          className="w-[160px] flex flex-col gap-1 items-center"
        >
          <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
            <Button variant={'ghost'}>Edit</Button>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)}>
            <Button variant={'ghost'}>Delete</Button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog
        open={isEditDialogOpen || isDeleteDialogOpen}
        onOpenChange={
          isEditDialogOpen ? setIsEditDialogOpen : setIsDeleteDialogOpen
        }
      >
        {isEditDialogOpen ? (
          <DialogContent>
            <DialogTitle>Editing {vehicle.name}</DialogTitle>
            <Button
              onClick={() => {
                handleButtonClick();
              }}
            >
              {!showPics ? 'View Pics' : 'Hide Pics'}
            </Button>
            {showPics && (
              <div className="flex flex-col gap-2">
                {pictures.map((pic) => (
                  <img
                    width={80}
                    height={80}
                    key={pic.key}
                    src={pic.url}
                    alt={pic.key}
                    className="h-20 w-20"
                  />
                ))}
              </div>
            )}

            <DialogClose>Close</DialogClose>
          </DialogContent>
        ) : (
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
        )}
      </Dialog>
    </>
  );
}
