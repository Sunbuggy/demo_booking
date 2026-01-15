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
import { USER_LEVELS } from '@/lib/constants/user-levels';

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
          {/* Avatar sits on the left */}
          <UserStatusAvatar 
            user={user} 
            currentUserLevel={USER_LEVELS.ADMIN} 
            size="sm" 
          />
          
          <div className="flex flex-col min-w-0">
            {/* FIX: Replaced 'text-white' with 'text-foreground' 
               This ensures visibility in both Light (Black text) and Dark (White text) modes.
            */}
            <span className="font-bold text-foreground truncate">
              {user.stage_name || user.full_name}
            </span>
            
            {/* METADATA */}
            <div className="flex items-center gap-1.5">
               {/* Semantic: Primary color for emphasis */}
               <span className="text-[10px] text-primary uppercase font-black tracking-widest">
                 {user.employee_details?.department || 'STAFF'}
               </span>
               {/* Semantic: Muted color for secondary info */}
               <span className="text-[10px] text-muted-foreground uppercase font-medium">
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

  // 2. ROLE COLUMN
  {
    accessorKey: 'user_level',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Role" />
    ),
    cell: ({ row }) => {
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
                    variant: 'default' 
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

        if (makeCustomer) handleRoleChange(USER_LEVELS.CUSTOMER, 'Customer');
        if (makeEmployee) handleRoleChange(USER_LEVELS.STAFF, 'Staff');
        if (makeDriver) handleRoleChange(USER_LEVELS.STAFF, 'Driver');
        if (makeManager) handleRoleChange(USER_LEVELS.MANAGER, 'Manager');
        if (makeAdmin) handleRoleChange(USER_LEVELS.ADMIN, 'Admin');

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
                    ? 'default' // Primary
                    : userLevel >= USER_LEVELS.MANAGER
                      ? 'secondary'
                      : 'outline'
                }
                className="w-full font-mono font-bold"
              >
                {userLevel}
              </Button>
            </DialogTrigger>
            <DialogContent className='w-fit bg-card text-card-foreground border-border'>
              <DialogHeader>
                <DialogTitle className="text-foreground">Change User Level</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  <span className="text-3xl font-extrabold text-foreground block my-2">
                    Current Level: {row.original.user_level}
                  </span>
                  <div className="text-sm space-y-1">
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
                  <Button onClick={() => setMakeDriver(true)}>Driver</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button variant={'secondary'} onClick={() => setMakeManager(true)}>
                    Manager
                  </Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setMakeAdmin(true)}>
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
    cell: ({ row }) => (
        // Semantic: muted-foreground instead of zinc-400
        <div className="w-[200px] truncate font-mono text-xs text-muted-foreground" title={row.getValue('email')}>
            {row.getValue('email')}
        </div>
    )
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
            { event: '*', schema: 'public', table: 'users', filter: `id=eq.${id}` },
            () => router.refresh()
          )
          .subscribe();

        return () => { supabase.removeChannel(channel); };
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
                    ? 'default' // Primary (Green usually)
                    : status === 'on_break'
                      ? 'secondary' // Yellow/Orange
                      : 'outline' // Grey
                }
              >
                {status}
              </Badge>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Time Clock Management</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  {(status === 'clocked_in' || status === 'on_break') 
                    ? `Current Shift Duration: ${timeSinceClockIn}`
                    : 'User is currently off the clock.'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex flex-col gap-6 py-4">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-md border border-border">
                    <UserStatusAvatar user={row.original} size="md" />
                    <div>
                        <p className="text-sm font-medium leading-none text-muted-foreground">Employee</p>
                        <p className="text-lg font-bold text-foreground">{row.original.full_name}</p>
                    </div>
                </div>

                {(status === 'clocked_in' || status === 'on_break') && (
                  <div className="flex flex-col gap-2">
                     <p className="text-sm text-muted-foreground mb-1">Actions</p>
                     <div className="flex justify-between items-center bg-background p-2 rounded border border-border">
                        <span className="text-sm font-semibold text-foreground">Adjust Time Sheet</span>
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
                
                <div className="border-t border-border pt-4">
                    <HistoryTimeClockEvents user={row.original} />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      );
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
    enableSorting: false
  }
];