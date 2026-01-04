'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';

// UI Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import UserStatusAvatar from '@/components/UserStatusAvatar';
import ClockIn from './time-clock/clock-in';
import AdjustTime from './time-clock/adjust-time';
import HistoryTimeClockEvents from './time-clock/time-history';

// Utilities & Types
import { createClient } from '@/utils/supabase/client';
import {
  calculateTimeSinceClockIn,
  changeUserRole,
} from '@/utils/supabase/queries';
import { UserType } from '../../../types';

// --- NEW IMPORT: Single Source of Truth ---
import { USER_LEVELS, ROLE_LABELS } from '@/lib/constants/user-levels';

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
  // 1. CONSOLIDATED USER COLUMN (Avatar + Name + Metadata)
  {
    accessorKey: 'full_name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="User" />
    ),
    cell: ({ row }) => {
      const user = row.original;
      
      return (
        <div className="flex items-center gap-3 py-1">
          {/* REPLACEMENT: The interactive UserStatusAvatar now sits on the left.
             The 'pencil' icon inside it redirects to /account?userId=... 
          */}
          <UserStatusAvatar 
            user={user} 
            currentUserLevel={USER_LEVELS.ADMIN} // Updated: Uses Constant
            size="sm" 
          />
          
          <div className="flex flex-col min-w-0">
            {/* Displaying name as a bold label; navigation is handled by the Avatar */}
            <span className="font-bold text-white truncate">
              {user.stage_name || user.full_name}
            </span>
            
            {/* METADATA: Pulling hierarchical info from employee_details */}
            <div className="flex items-center gap-1.5">
               <span className="text-[10px] text-orange-500 uppercase font-black tracking-widest">
                 {user.employee_details?.department || 'STAFF'}
               </span>
               <span className="text-[10px] text-zinc-500 uppercase font-medium">
                 • {user.employee_details?.primary_position || 'UNASSIGNED'}
               </span>
            </div>
          </div>
        </div>
      );
    },
    enableSorting: true,
    enableHiding: false
  },

  // 2. ROLE COLUMN (The Heavy Refactor)
  {
    accessorKey: 'user_level',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Role" />
    ),
    cell: ({ row }) => {
      // Local state triggers for the useEffect below
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
                    description: `User updated to ${roleName} (Level ${roleLevel})`,
                    duration: 2000,
                    variant: 'default' // 'success' isn't standard in all Shadcn versions, using default
                });
            } catch (err) {
                console.error(err);
                toast({
                    title: 'Error',
                    description: `Error updating role to ${roleName}`,
                    variant: 'destructive'
                });
            }
        };

        // --- UPDATED LOGIC: Using Constants instead of Magic Numbers ---
        
        if (makeCustomer) handleRoleChange(USER_LEVELS.CUSTOMER, 'Customer');
        if (makeEmployee) handleRoleChange(USER_LEVELS.STAFF, 'Staff');
        
        // Note: Drivers are now functionally "Staff" (300), but we keep the specific button for UI preference.
        // This ensures they get the correct permissions without needing a unique '350' level.
        if (makeDriver) handleRoleChange(USER_LEVELS.STAFF, 'Driver');
        
        if (makeManager) handleRoleChange(USER_LEVELS.MANAGER, 'Manager');
        if (makeAdmin) handleRoleChange(USER_LEVELS.ADMIN, 'Admin');

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
                  userLevel >= USER_LEVELS.ADMIN
                    ? 'positive'
                    : userLevel >= USER_LEVELS.MANAGER
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
                  {/* Dynamic Legend from Constants - Never gets out of sync */}
                  <div className="text-sm space-y-1 text-muted-foreground">
                    <p>Customer = {USER_LEVELS.CUSTOMER}</p>
                    <p>Staff / Driver = {USER_LEVELS.STAFF}</p>
                    <p>Manager = {USER_LEVELS.MANAGER}</p>
                    <p>Admin = {USER_LEVELS.ADMIN}</p>
                  </div>
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-wrap gap-2 items-center justify-center pt-4">
                <DialogClose asChild>
                  <Button variant="outline" onClick={() => setMakeCustomer(true)}>Customer</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button onClick={() => setMakeEmployee(true)}>Staff</Button>
                </DialogClose>
                 <DialogClose asChild>
                  {/* Keeps the specific 'Driver' button for ease of use, but applies Level 300 */}
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

  // 3. EMAIL COLUMN
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => <div className="w-[200px] truncate font-mono text-xs text-zinc-400" title={row.getValue('email')}>{row.getValue('email')}</div>
  },

  // 4. TIME CLOCK COLUMN
  {
    accessorKey: 'time_entry_status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Time Clock" />
    ),
    cell: ({ row }) => {
      const id = row.original.id as string;
      const status = row.getValue('time_entry_status') as string; 
      
      const [timeSinceClockIn, setTimeSinceClockIn] = useState(
        status === 'clocked_in' ? 'loading...' : ''
      );
      
      const supabase = createClient();
      const router = useRouter();

      useEffect(() => {
        const channel = supabase
          .channel(`track_time_${id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'users',
              filter: `id=eq.${id}`
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

      useEffect(() => {
        let isMounted = true;
        let interval: NodeJS.Timeout;

        if (status === 'clocked_in' || status === 'on_break') {
            calculateTimeSinceClockIn(supabase, id).then((res) => {
              if (!isMounted) return;
              const diff = res as TimeSinceClockIn;
              const hour = Math.floor(diff.data / 3600000) || 0;
              const minute = Math.floor((diff.data % 3600000) / 60000) || 0;
              const second = Math.floor((diff.data % 60000) / 1000) || 0;
              setTimeSinceClockIn(`${hour}h ${minute}m ${second}s`);
            });

            interval = setInterval(() => {
            setTimeSinceClockIn((prevTime) => {
                if (!prevTime || prevTime === 'loading...') return '0h 0m 0s';
                const parts = prevTime.split(' ');
                let hour = parseInt(parts[0]);
                let minute = parseInt(parts[1]);
                let second = parseInt(parts[2]);
                second++;
                if (second === 60) { second = 0; minute++; }
                if (minute === 60) { minute = 0; hour++; }
                return `${hour}h ${minute}m ${second}s`;
            });
            }, 1000);
        }

        return () => {
          isMounted = false;
          if (interval) clearInterval(interval);
        };
      }, [status, id, supabase]);

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
                    <UserStatusAvatar user={row.original} size="md" />
                    <div>
                        <p className="text-sm font-medium leading-none">Employee</p>
                        <p className="text-lg font-bold">{row.original.full_name}</p>
                    </div>
                </div>

                {(status === 'clocked_in' || status === 'on_break') && (
                  <div className="flex flex-col gap-2">
                     <p className="text-sm text-muted-foreground mb-1">Actions</p>
                     <div className="flex justify-between items-center bg-card p-2 rounded border">
                        <span className="text-sm font-semibold">Adjust Time Sheet</span>
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