'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';

// UI Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';

// Custom Components
import { DataTableColumnHeader } from '../components/column-header';
import ClockIn from './time-clock/clock-in';
import AdjustTime from './time-clock/adjust-time';
import HistoryTimeClockEvents from './time-clock/time-history';

// Utilities & Types
import { createClient } from '@/utils/supabase/client';
import {
  calculateTimeSinceClockIn,
  changeUserRole,
  checkIfUserHasLevel
} from '@/utils/supabase/queries';
import { UserType } from '../../../types';

// ---------------------------------------------------------
// Types
// ---------------------------------------------------------

export interface TimeSinceClockIn {
  data: number;
}

// ---------------------------------------------------------
// Column Definitions
// ---------------------------------------------------------

export const columns: ColumnDef<UserType, any>[] = [
  // 1. AVATAR COLUMN
  {
    accessorKey: 'avatar_url',
    header: ({ column }) => <DataTableColumnHeader column={column} title="" />,
    cell: ({ row }) => {
      const name = row.getValue('full_name') as string;
      const initials = name
        ? name
            .split(' ')
            .map((n) => n[0])
            .join('')
        : 'SB'; // Default fallback
        
      return (
        <div className="w-[50px]">
          <Avatar className="h-9 w-9">
            <AvatarImage
              loading="lazy"
              src={row.getValue('avatar_url')}
              alt={name || 'User Avatar'}
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </div>
      );
    },
    enableSorting: false
  },

  // 2. FULL NAME COLUMN
  {
    accessorKey: 'full_name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      const name = row.getValue('full_name') as string;
      const supabase = createClient();
      const [signedInUserId, setSignedInUserId] = useState<string | undefined>(
        undefined
      );
      const [adminAuthorized, setAdminAuthorized] = useState<boolean>(false);

      // Fetch current user ID
      useEffect(() => {
        supabase.auth.getUser().then((user) => {
          const user_id = user.data.user?.id;
          setSignedInUserId(user_id);
        });
      }, [supabase]);

      // Check admin authorization
      useEffect(() => {
        if (signedInUserId) {
          checkIfUserHasLevel(supabase, signedInUserId, 900)
            .then((res) => {
              // FIX: Changed assignment (=) to comparison (===)
              if (res === true) {
                setAdminAuthorized(true);
              }
            })
            .catch((err) => {
              console.error('Error checking admin level:', err);
            });
        }
      }, [signedInUserId, supabase]);

      return (
        <div className="w-[180px]">
          {adminAuthorized ? (
            <Link
              href={`/biz/users/${row.original.id}`}
              className="underline text-blue-500 hover:text-blue-700 transition-colors"
            >
              {name}
            </Link>
          ) : (
            <h2 className="font-medium">{name}</h2>
          )}
        </div>
      );
    },
    enableSorting: true,
    enableHiding: false
  },

  // 3. ROLE COLUMN
  {
    accessorKey: 'user_level',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Role" />
    ),
    cell: ({ row }) => {
      // State for triggering role changes
      const [makeEmployee, setMakeEmployee] = useState(false);
      const [makeDriver, setMakeDriver] = useState(false);
      const [makeManager, setMakeManager] = useState(false);
      const [makeAdmin, setMakeAdmin] = useState(false);
      const [makeCustomer, setMakeCustomer] = useState(false);
      
      const supabase = createClient();
      const { toast } = useToast();

      useEffect(() => {
        const handleRoleChange = async (roleLevel: number, roleName: string) => {
            try {
                await changeUserRole(supabase, row.original.id, roleLevel);
                toast({
                    title: 'Success',
                    description: `User has been made a ${roleName}`,
                    duration: 2000,
                    variant: 'success' // Ensure this variant exists in your theme
                });
            } catch (err) {
                console.error(err);
                toast({
                    title: 'Error',
                    description: `Error making user a ${roleName}`,
                    variant: 'destructive'
                });
            }
        };

        if (makeCustomer) handleRoleChange(100, 'customer');
        if (makeEmployee) handleRoleChange(300, 'employee');
        if (makeDriver) handleRoleChange(350, 'driver');
        if (makeManager) handleRoleChange(651, 'manager');
        if (makeAdmin) handleRoleChange(900, 'admin');

        // Reset triggers
        setMakeEmployee(false);
        setMakeDriver(false);
        setMakeManager(false);
        setMakeAdmin(false);
        setMakeCustomer(false);

      }, [makeEmployee, makeDriver, makeManager, makeAdmin, makeCustomer, row.original.id, supabase, toast]);

      const userLevel = Number(row.getValue('user_level'));
      
      return (
        <div className="w-[40px]">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant={
                  userLevel === 900
                    ? 'positive'
                    : userLevel > 650
                      ? 'secondary'
                      : 'default'
                }
                className="w-full"
              >
                {userLevel}
              </Button>
            </DialogTrigger>
            <DialogContent className='w-fit'>
              <DialogHeader>
                <DialogTitle>Change User Level</DialogTitle>
                <DialogDescription>
                  <span className="text-3xl font-extrabold text-foreground block my-2">
                    Current Level: {row.original.user_level}
                  </span>
                  <div className="text-sm space-y-1">
                    <p>Customers &gt; 100</p>
                    <p>Employees &gt; 299</p>
                    <p>Drivers = 350</p>
                    <p>Managers &gt; 650</p>
                    <p>Admins = 900</p>
                  </div>
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-wrap gap-2 items-center justify-center pt-4">
                <DialogClose asChild>
                  <Button onClick={() => setMakeCustomer(true)}>Customer</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button onClick={() => setMakeEmployee(true)}>Employee</Button>
                </DialogClose>
                 <DialogClose asChild>
                  <Button onClick={() => setMakeDriver(true)}>Driver</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button variant={'secondary'} onClick={() => setMakeManager(true)}>
                    Manager
                  </Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button variant={'positive'} onClick={() => setMakeAdmin(true)}>
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

  // 4. EMAIL COLUMN
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => <div className="w-[250px] truncate" title={row.getValue('email')}>{row.getValue('email')}</div>
  },

  // 5. TIME CLOCK COLUMN
  {
    accessorKey: 'time_entry_status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Time Clock" />
    ),
    cell: ({ row }) => {
      const id = row.original.id as string;
      const status = row.getValue('time_entry_status') as string; // 'clocked_in' | 'clocked_out' | 'on_break'
      
      const [timeSinceClockIn, setTimeSinceClockIn] = useState(
        status === 'clocked_in' ? 'loading...' : ''
      );
      
      const supabase = createClient();
      const router = useRouter();

      // Realtime Subscription
      useEffect(() => {
        const channel = supabase
          .channel(`track_time_${id}`) // Unique channel name per row prevents collisions
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'users',
              filter: `id=eq.${id}` // Filter specifically for this user to reduce noise
            },
            () => {
              router.refresh();
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }, [supabase, router, id]);

      // Timer Logic
      useEffect(() => {
        let isMounted = true;
        let interval: NodeJS.Timeout;

        // Only fetch if currently clocked in to save resources
        if (status === 'clocked_in' || status === 'on_break') {
            calculateTimeSinceClockIn(supabase, id).then((res) => {
            if (!isMounted) return;
            
            const diff = res as TimeSinceClockIn;
            // Initial calculation
            const hour = Math.floor(diff.data / 3600000) || 0;
            const minute = Math.floor((diff.data % 3600000) / 60000) || 0;
            const second = Math.floor((diff.data % 60000) / 1000) || 0;
            setTimeSinceClockIn(`${hour}h ${minute}m ${second}s`);
            });

            // Start client-side ticker
            interval = setInterval(() => {
            setTimeSinceClockIn((prevTime) => {
                if (!prevTime || prevTime === 'loading...') return '0h 0m 0s';
                
                const parts = prevTime.split(' ');
                let hour = parseInt(parts[0]);
                let minute = parseInt(parts[1]);
                let second = parseInt(parts[2]);

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
        }

        return () => {
          isMounted = false;
          if (interval) clearInterval(interval);
        };
      }, [status, id, supabase]); // Added status dependency

      return (
        <div className="w-[80px] text-xs">
          <Dialog>
            <DialogTrigger asChild>
              <Badge
                className="cursor-pointer hover:opacity-80 transition-opacity"
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
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Time Clock Management</DialogTitle>
                <DialogDescription>
                  {(status === 'clocked_in' || status === 'on_break') 
                    ? `Current Shift Duration: ${timeSinceClockIn}`
                    : 'User is currently off the clock.'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex flex-col gap-6 py-4">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={row.original.avatar_url} />
                        <AvatarFallback>SB</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-sm font-medium leading-none">Employee</p>
                        <p className="text-lg font-bold">{row.original.full_name}</p>
                    </div>
                </div>

                {/* ACTION BUTTONS */}
                {(status === 'clocked_in' || status === 'on_break') && (
                  <div className="flex flex-col gap-2">
                     <p className="text-sm text-muted-foreground mb-1">Actions</p>
                     <div className="flex justify-between items-center bg-card p-2 rounded border">
                        <span className="text-sm font-semibold">Adjust Time Sheet</span>
                        {/* AdjustTime is now the primary action here */}
                        <AdjustTime /> 
                     </div>
                  </div>
                )}

                {status === 'clocked_out' && (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-muted-foreground mb-1">Start Shift</p>
                    <ClockIn employeeId={row.original.id} />
                  </div>
                )}
                
                <div className="border-t pt-4">
                    <HistoryTimeClockEvents user={row.original} />
                </div>
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