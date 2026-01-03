'use client';

import React from 'react';
import { ColumnDef } from '@tanstack/react-table';

// UI Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Custom Components
import { DataTableColumnHeader } from '../components/column-header';
import UserStatusAvatar from '@/components/UserStatusAvatar'; // NEW IMPORT

// ---------------------------------------------------------
// Column Definitions
// ---------------------------------------------------------

export const columns: ColumnDef<any, any>[] = [
  // 1. CONSOLIDATED USER COLUMN (Avatar + Name)
  {
    accessorKey: 'full_name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Customer" />
    ),
    cell: ({ row }) => {
      const user = row.original;
      
      return (
        <div className="flex items-center gap-3 py-1">
          {/* REPLACEMENT: Standardized UserStatusAvatar sits on the left.
             The 'pencil' icon inside it redirects to /account?userId=...
          */}
          <UserStatusAvatar 
            user={user} 
            currentUserLevel={900} // Admin view context
            size="sm" 
          />
          
          <div className="flex flex-col min-w-0">
            {/* Displaying name as a bold label; navigation is handled by the Avatar hub */}
            <span className="font-bold text-white truncate">
              {user.full_name}
            </span>
            <span className="text-[10px] text-blue-500 uppercase font-black tracking-widest">
              Verified Customer
            </span>
          </div>
        </div>
      );
    },
    enableSorting: true,
    enableHiding: false
  },

  // 2. ROLE COLUMN (Simplified for Customers)
  {
    accessorKey: 'user_level',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Level" />
    ),
    cell: ({ row }) => {
      const userLevel = Number(row.getValue('user_level'));
      return (
        <div className="w-[40px]">
          <Badge variant="outline" className="font-mono bg-zinc-900 border-zinc-800">
            {userLevel}
          </Badge>
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
      <div className="w-[200px] truncate font-mono text-xs text-zinc-400" title={row.getValue('email')}>
        {row.getValue('email')}
      </div>
    )
  },

  // 4. PHONE COLUMN
  {
    accessorKey: 'phone',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Phone" />
    ),
    cell: ({ row }) => (
      <div className="w-[120px] font-mono text-xs text-zinc-400">
        {row.getValue('phone') || 'NO_PHONE'}
      </div>
    )
  }
];