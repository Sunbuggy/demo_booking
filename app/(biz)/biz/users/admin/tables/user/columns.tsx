'use client';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Database } from '@/types_db';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '../components/column-header';
import { DataTableRowActions } from '../components/row-actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserType } from '../../../types';

export const columns: ColumnDef<UserType, any>[] = [
  // {
  //   id: 'select',
  //   header: ({ table }) => (
  //     <Checkbox
  //       checked={
  //         table.getIsAllPageRowsSelected() ||
  //         (table.getIsSomePageRowsSelected() && 'indeterminate')
  //       }
  //       onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
  //       aria-label="Select all"
  //       className="translate-y-[2px]"
  //     />
  //   ),
  //   cell: ({ row }) => (
  //     <Checkbox
  //       checked={row.getIsSelected()}
  //       onCheckedChange={(value) => row.toggleSelected(!!value)}
  //       aria-label="Select row"
  //       className="translate-y-[2px]"
  //     />
  //   ),
  //   enableSorting: false,
  //   enableHiding: false
  // },
  {
    accessorKey: 'avatar_url',
    header: ({ column }) => <DataTableColumnHeader column={column} title="" />,
    cell: ({ row }) => {
      const name = row.getValue('full_name') as string | null;
      const email = row.original.email;
      const avatarUrl = row.getValue('avatar_url') as string | null;

      // Safely handle name/email for alt text
      const altText = name || email || 'User Avatar';
      
      // Generate initials safely
      let initials = '?';
      if (name && name.trim()) {
        initials = name
          .trim()
          .split(/\s+/)
          .filter(w => w.length > 0)
          .slice(0, 2)
          .map(w => w[0])
          .join('')
          .toUpperCase();
      } else if (email) {
        // Handle email-only case
        const emailPrefix = email.split('@')[0] || '';
        const validChars = emailPrefix.match(/[a-zA-Z0-9]/g) || [];
        initials = validChars.slice(0, 2).join('').toUpperCase();
      }

      return (
        <div className="w-[50px]">
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={avatarUrl || undefined}
              alt={altText}
              className="object-cover"
            />
            <AvatarFallback className="bg-muted/50">
              {initials || '?'}
            </AvatarFallback>
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
    cell: ({ row }) => (
      <div className="min-w-[120px] max-w-[180px] truncate">
        {row.getValue('full_name') || '-'}
      </div>
    ),
    enableHiding: false
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => (
      <div className="min-w-[150px] max-w-[180px] truncate">
        {row.getValue('email') || '-'}
      </div>
    )
  },
  // {
  //   accessorKey: 'user_level',
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Role" />
  //   ),
  //   cell: ({ row }) => (
  //     <div className="w-[80px]">{row.getValue('user_level')}</div>
  //   )
  // },
  // {
  //   accessorKey: 'title',
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Title" />
  //   ),
  //   cell: ({ row }) => {
  //     const label = labels.find((label) => label.value === row.original.label);

  //     return (
  //       <div className="flex space-x-2">
  //         {label && <Badge variant="outline">{label.label}</Badge>}
  //         <span className="max-w-[500px] truncate font-medium">
  //           {row.getValue('title')}
  //         </span>
  //       </div>
  //     );
  //   }
  // },
  // {
  //   accessorKey: 'status',
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Status" />
  //   ),
  //   cell: ({ row }) => {
  //     const status = statuses.find(
  //       (status) => status.value === row.getValue('status')
  //     );

  //     if (!status) {
  //       return null;
  //     }

  //     return (
  //       <div className="flex w-[100px] items-center">
  //         {status.icon && (
  //           <status.icon className="mr-2 h-4 w-4 text-muted-foreground" />
  //         )}
  //         <span>{status.label}</span>
  //       </div>
  //     );
  //   },
  //   filterFn: (row, id, value) => {
  //     return value.includes(row.getValue(id));
  //   }
  // },
  // {
  //   accessorKey: 'priority',
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Priority" />
  //   ),
  //   cell: ({ row }) => {
  //     const priority = priorities.find(
  //       (priority) => priority.value === row.getValue('priority')
  //     );

  //     if (!priority) {
  //       return null;
  //     }

  //     return (
  //       <div className="flex items-center">
  //         {priority.icon && (
  //           <priority.icon className="mr-2 h-4 w-4 text-muted-foreground" />
  //         )}
  //         <span>{priority.label}</span>
  //       </div>
  //     );
  //   },
  //   filterFn: (row, id, value) => {
  //     return value.includes(row.getValue(id));
  //   }
  // },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />
  }
];
