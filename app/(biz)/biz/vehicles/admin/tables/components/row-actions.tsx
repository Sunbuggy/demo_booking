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

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({
  row
}: DataTableRowActionsProps<TData>) {
  const vehicle = row.original as VehicleType;
  const supabase = createClient();
  const [deleteVehicle, setDeleteVehicle] = React.useState<boolean>(false);
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

  return (
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
        className="w-[160px] flex flex-col gap-3 items-center"
      >
        <DropdownMenuItem asChild>
          <Button className="rounded-md mt-3">Edit Vehicle</Button>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Button
            variant={'destructive'}
            className="rounded-md"
            onClick={() => setDeleteVehicle(true)}
          >
            Delete Vehicle
          </Button>
        </DropdownMenuItem>
        {/* <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Timeclock</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup>
              {timeClocklabels.map((label) => (
                <DropdownMenuRadioItem key={label.value} value={label.value}>
                  {label.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub> */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
