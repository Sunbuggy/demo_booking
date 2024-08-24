'use client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { removeUser } from '@/utils/biz/users/actions';
import { createClient } from '@/utils/supabase/client';
import { makeUserEmployee } from '@/utils/supabase/queries';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { Row } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import React from 'react';
import { z } from 'zod';

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export const timeClocklabels = [
  {
    value: 'clock_in',
    label: 'Clock in'
  },
  {
    value: 'clock_out',
    label: 'Clock out'
  },
  {
    value: 'take_break',
    label: 'Take break'
  },
  {
    value: 'end_break',
    label: 'End break'
  }
];

// Create enums for users time_entry_status

export const time_entry_status_enums = z.enum([
  'clocked_in',
  'clocked_out',
  'on_break'
]);

export const userSchema = z.object({
  avatar_url: z.string().nullable(),
  email: z.string().nullable(),
  full_name: z.string().nullable(),
  id: z.string(),
  time_entry_status: time_entry_status_enums.nullable(),
  user_level: z.number().nullable()
});

export function DataTableRowActions<TData>({
  row
}: DataTableRowActionsProps<TData>) {
  const user = userSchema.parse(row.original);
  const supabase = createClient();
  const [makeEmployee, setMakeEmployee] = React.useState<boolean>(false);
  const [deleteUser, setDeleteUser] = React.useState<boolean>(false);
  const { toast } = useToast();
  const router = useRouter();

  React.useEffect(() => {
    const channel = supabase
      .channel('user made to employee')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users'
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
    if (makeEmployee) {
      makeUserEmployee(supabase, user.id)
        .then((res) => {
          toast({
            title: 'Success',
            description: 'User has been made an employee',
            duration: 2000,
            variant: 'success'
          });
        })
        .catch((err) => {
          console.error(err);
        });
    }
    setMakeEmployee(false);
  }, [makeEmployee]);

  React.useEffect(() => {
    if (deleteUser) {
      removeUser(user.id)
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
    setDeleteUser(false);
  }, [deleteUser]);

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
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem asChild>
          <Button variant={'positive'} onClick={() => setMakeEmployee(true)}>
            {' '}
            Make Employee
          </Button>
          {/* <DropdownMenuShortcut>⌘E</DropdownMenuShortcut> */}
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Button variant={'destructive'} onClick={() => setDeleteUser(true)}>
            {' '}
            Delete User
          </Button>
          {/* <DropdownMenuShortcut>⌘E</DropdownMenuShortcut> */}
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
