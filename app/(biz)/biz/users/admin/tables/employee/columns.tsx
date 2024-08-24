'use client';
import { Badge } from '@/components/ui/badge';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '../components/column-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserType } from '../../../types';
import React, { useState } from 'react';
import {
  calculateTimeSinceClockIn,
  changeUserRole
} from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import ClockOut from './time-clock/clock-out';
import ClockIn from './time-clock/clock-in';
import AdjustTime from './time-clock/adjust-time';
import TimeSheetAdjustment from './time-clock/time-sheet';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { DialogTrigger } from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export interface TimeSinceClockIn {
  data: number;
}
export const columns: ColumnDef<UserType, any>[] = [
  // AVATAR COLUMN
  {
    accessorKey: 'avatar_url',
    header: ({ column }) => <DataTableColumnHeader column={column} title="" />,
    cell: ({ row }) => {
      const name = row.getValue('full_name') as string;
      const initials = name
        .split(' ')
        .map((n) => n[0])
        .join('');
      return (
        <div className="w-[50px]">
          <Avatar className="h-9 w-9">
            <AvatarImage
              loading="lazy"
              src={row.getValue('avatar_url')}
              alt={name || 'no name'}
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </div>
      );
    },
    enableSorting: false
  },
  // FULL NAME COLUMN
  {
    accessorKey: 'full_name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      const name = row.getValue('full_name') as string;
      return <div className="w-[180px] ">{name}</div>;
    },
    enableSorting: true,
    enableHiding: false
  },
  // ROLE COLUMN
  {
    accessorKey: 'user_level',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Role" />
    ),
    cell: ({ row }) => {
      const [makeEmployee, setMakeEmployee] = useState(false);
      const [makeManager, setMakeManager] = useState(false);
      const [makeAdmin, setMakeAdmin] = useState(false);
      const supabase = createClient();
      const { toast } = useToast();
      const router = useRouter();

      React.useEffect(() => {
        // Make Employee
        if (makeEmployee) {
          changeUserRole(supabase, row.original.id, 300)
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
        // Make Manager
        if (makeManager) {
          changeUserRole(supabase, row.original.id, 651)
            .then((res) => {
              toast({
                title: 'Success',
                description: 'User has been made a manager',
                duration: 2000,
                variant: 'success'
              });
            })
            .catch((err) => {
              toast({
                title: 'Error',
                description: 'Error making user a manager',
                variant: 'destructive'
              });
            });
        }
        // Make Admin
        if (makeAdmin) {
          changeUserRole(supabase, row.original.id, 900)
            .then((res) => {
              toast({
                title: 'Success',
                description: 'User has been made an admin',
                duration: 2000,
                variant: 'success'
              });
            })
            .catch((err) => {
              toast({
                title: 'Error',
                description: 'Error making user an admin',
                variant: 'destructive'
              });
            });
        }
        // Clean up
        setMakeEmployee(false);
        setMakeManager(false);
        setMakeAdmin(false);
      }, [makeEmployee, makeManager, makeAdmin]);

      return (
        <div className="w-[40px]">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant={
                  Number(row.getValue('user_level')) === 900
                    ? 'positive'
                    : Number(row.getValue('user_level')) > 650
                      ? 'secondary'
                      : 'default'
                }
              >
                {row.getValue('user_level')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change User Level</DialogTitle>
                <DialogDescription>
                  <span className="text-3xl font-extrabold">
                    Current Level: {row.original.user_level}
                  </span>
                  <br />
                  Employees &gt; 299,
                  <br /> Managers &gt; 650,
                  <br /> admins = 900
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-4 items-center">
                <DialogClose asChild>
                  <Button
                    onClick={() => {
                      setMakeEmployee(true);
                    }}
                  >
                    Employee
                  </Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button
                    variant={'secondary'}
                    onClick={() => {
                      setMakeManager(true);
                    }}
                  >
                    Manager
                  </Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button
                    variant={'positive'}
                    onClick={() => {
                      setMakeAdmin(true);
                    }}
                  >
                    Admin
                  </Button>
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      );
    }
  },
  // EMAIL COLUMN
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => <div className="w-[250px]">{row.getValue('email')}</div>
  },
  // TIME CLOCK COLUMN
  {
    accessorKey: 'time_entry_status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Time Clock" />
    ),
    cell: ({ row }) => {
      const id = row.original.id as string;
      const status = row.getValue('time_entry_status') as string; // 'clocked_in' | 'clocked_out' | 'on_break' | ;
      const [timeSinceClockIn, setTimeSinceClockIn] = useState(
        status === 'clocked_in' ? 'loading' : ''
      );
      const supabase = createClient();
      const router = useRouter();

      // Subscribe to changes in the users table
      React.useEffect(() => {
        const channel = supabase
          .channel('track time entry status')
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
        calculateTimeSinceClockIn(supabase, id).then((res) => {
          const diff = res as TimeSinceClockIn;
          const hour = Math.floor(diff.data / 3600000) || 0;
          const minute = Math.floor((diff.data % 3600000) / 60000) || 0;
          const second = Math.floor((diff.data % 60000) / 1000) || 0;
          setTimeSinceClockIn(`${hour}h ${minute}m ${second}s`);
        });

        const interval = setInterval(() => {
          setTimeSinceClockIn((prevTime) => {
            const [prevHour, prevMinute, prevSecond] = prevTime.split(' ');
            let hour = parseInt(prevHour);
            let minute = parseInt(prevMinute);
            let second = parseInt(prevSecond);

            second++;

            if (second === 60) {
              second = 0;
              minute++;
            }

            if (minute === 60) {
              minute = 0;
              hour++;
            }

            return `${hour}h ${minute}m ${second}s`;
          });
        }, 1000);

        return () => {
          clearInterval(interval);
        };
      }, []);

      return (
        <div className="w-[80px] text-xs">
          <Dialog>
            <DialogTrigger>
              <Badge
                variant={
                  status === 'clocked_in'
                    ? 'positive'
                    : status === 'on_break'
                      ? 'cautious'
                      : 'default'
                }
              >
                {status}
              </Badge>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Time Clock</DialogTitle>
                <DialogDescription>
                  {(status === 'clocked_in' || status === 'on_break') &&
                    `Clocked in For: ${timeSinceClockIn}`}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                {(status === 'clocked_in' || status === 'on_break') && (
                  <div className="flex justify-between">
                    <ClockOut user={row.original} />

                    <AdjustTime />
                  </div>
                )}
                {status === 'clocked_out' && (
                  <div>
                    <ClockIn user={row.original} />
                  </div>
                )}
                <TimeSheetAdjustment />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    enableSorting: false
  }
];
