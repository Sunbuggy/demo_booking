'use client';

import React from 'react';
import { ColumnDef } from '@tanstack/react-table';

// UI Components
import { Badge } from '@/components/ui/badge';

// Custom Components
import { DataTableColumnHeader } from '../components/column-header';
import UserStatusAvatar from '@/components/UserStatusAvatar'; 
import { USER_LEVELS } from '@/lib/constants/user-levels';

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
          {/* Avatar Component */}
          <UserStatusAvatar 
            user={user} 
            currentUserLevel={USER_LEVELS.ADMIN} 
            size="sm" 
          />
          
          <div className="flex flex-col min-w-0">
            {/* FIX: Replaced 'text-white' with 'text-foreground'.
               This ensures the name is Black in Light Mode and White in Dark Mode.
            */}
            <span className="font-bold text-foreground truncate">
              {user.full_name}
            </span>
            {/* Semantic: Primary color for the verification tag */}
            <span className="text-[10px] text-primary uppercase font-black tracking-widest">
              Verified Customer
            </span>
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
      <DataTableColumnHeader column={column} title="Level" />
    ),
    cell: ({ row }) => {
      const userLevel = Number(row.getValue('user_level'));
      return (
        <div className="w-[40px]">
          {/* FIX: Removed hardcoded 'bg-zinc-900' which looked like a black hole in Light Mode.
             Used variant='secondary' for a soft gray/muted look that works in both themes.
          */}
          <Badge variant="secondary" className="font-mono font-bold justify-center w-full">
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
      // Semantic: muted-foreground for secondary text
      <div className="w-[200px] truncate font-mono text-xs text-muted-foreground" title={row.getValue('email')}>
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
      <div className="w-[120px] font-mono text-xs text-muted-foreground">
        {row.getValue('phone') || 'NO_PHONE'}
      </div>
    )
  }
];