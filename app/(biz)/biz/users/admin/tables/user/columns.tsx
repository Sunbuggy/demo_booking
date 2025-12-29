'use client';

import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Database } from '@/types_db';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '../components/column-header';
import { DataTableRowActions } from '../components/row-actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserType } from '../../../types';
import Link from 'next/link'; //

export const columns: ColumnDef<UserType, any>[] = [
  {
    accessorKey: 'avatar_url',
    header: ({ column }) => <DataTableColumnHeader column={column} title="" />,
    cell: ({ row }) => {
      const name = row.getValue('full_name') as string | null;
      const email = row.original.email;
      const avatarUrl = row.getValue('avatar_url') as string | null;
      const altText = name || email || 'User Avatar';
      
      let initials = '?';
      if (name && name.trim()) {
        initials = name.trim().split(/\s+/).filter(w => w.length > 0).slice(0, 2).map(w => w[0]).join('').toUpperCase();
      } else if (email) {
        const emailPrefix = email.split('@')[0] || '';
        const validChars = emailPrefix.match(/[a-zA-Z0-9]/g) || [];
        initials = validChars.slice(0, 2).join('').toUpperCase();
      }

      return (
        <div className="w-[50px]">
          <Avatar className="h-9 w-9 border border-zinc-800">
            <AvatarImage src={avatarUrl || undefined} alt={altText} className="object-cover" />
            <AvatarFallback className="bg-muted/50">{initials || '?'}</AvatarFallback>
          </Avatar>
        </div>
      );
    },
    enableSorting: false
  },
  {
    accessorKey: 'full_name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      const user = row.original;
      const isStaff = (user.user_level || 0) >= 300; //

      return (
        <div className="min-w-[120px] max-w-[180px] truncate">
          {/* FIX: Wrapping in Link. 
            Customers (Blue) and Staff (Orange) both get links now.
          */}
          <Link 
            href={`/biz/users/${user.id}`} 
            className={`font-bold hover:underline transition-colors ${
              isStaff ? 'text-orange-500 hover:text-orange-400' : 'text-blue-500 hover:text-blue-400'
            }`}
          >
            {user.full_name || 'No Name'}
          </Link>
          <div className="text-[10px] text-zinc-500 font-mono uppercase">
             Level: {user.user_level}
          </div>
        </div>
      );
    },
    enableHiding: false
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => (
      <div className="min-w-[150px] max-w-[180px] truncate text-zinc-400">
        {row.getValue('email') || '-'}
      </div>
    )
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />
  }
];