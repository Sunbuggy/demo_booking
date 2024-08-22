'use client';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Database } from '@/types_db';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '../components/column-header';
import { DataTableRowActions } from '../components/row-actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserType } from '../../../types';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { statuses } from '../components/table-toolbar';
import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import {
  calculateTimeSinceClockIn,
  insertIntoClockIn,
  insertIntoClockOut
} from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/client';

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
    cell: ({ row }) => (
      <div className="w-[40px]">{row.getValue('user_level')}</div>
    )
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
      const id = row.getValue('id') as string;
      const status = row.getValue('time_entry_status') as string; // 'clocked_in' | 'clocked_out' | 'on_break' | ;
      const [selectedStatus, setSelectedStatus] = useState(status);
      const [clockIn, setClockIn] = useState(false);
      const [clockOut, setClockOut] = useState(false);
      const [onBreak, setOnBreak] = useState(false);
      const changeClockinStatus = (
        e: React.FormEvent<HTMLFormElement>,
        selectedStatus: string
      ) => {
        e.preventDefault();
        console.log('Selected status:', selectedStatus);
        if (selectedStatus === 'clocked_in') {
          setClockIn(true);
        }
        if (selectedStatus === 'clocked_out') {
          setClockOut(true);
        }
        if (selectedStatus === 'on_break') {
          setOnBreak(true);
        }
      };
      React.useEffect(() => {
        const supabase = createClient();
        if (clockIn) {
          insertIntoClockIn(supabase, id, 0, 0);
        }
        if (clockOut) {
          calculateTimeSinceClockIn(supabase, id).then((res) => {
            console.log('Time since clock in:', res);
          });

          // insertIntoClockOut(supabase,id,0,0, timeSinceClockIn)
        }
        if (onBreak) {
          console.log('On break');
        }
      }, [clockIn, clockOut, onBreak]);

      return (
        <div className="w-[80px] text-xs">
          <Popover>
            <PopoverTrigger>
              {' '}
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
            </PopoverTrigger>
            <PopoverContent>
              <div>
                <form onSubmit={(e) => changeClockinStatus(e, selectedStatus)}>
                  <RadioGroup
                    value={selectedStatus}
                    onValueChange={setSelectedStatus} // Use onValueChange to update the state
                  >
                    {statuses.map((status) => (
                      <div
                        className="flex items-center space-x-2"
                        key={status.value}
                      >
                        <RadioGroupItem
                          value={status.value}
                          id={status.value}
                        />
                        <Label htmlFor={status.value}>{status.label}</Label>
                      </div>
                    ))}

                    <Button type="submit">Change</Button>
                  </RadioGroup>
                </form>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    enableSorting: false
  }
];
