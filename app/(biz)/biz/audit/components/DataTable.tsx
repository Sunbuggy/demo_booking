'use client';
import React, { useEffect, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { createClient } from '@/utils/supabase/client';

interface AuditLog {
  id: number;
  action: string | null;
  user_id: string | null;
  created_at: string;
}

const supabase = createClient();

const columns: ColumnDef<AuditLog>[] = [
  // { accessorKey: 'id', header: 'ID' },
  {
    accessorKey: 'created_at',
    header: 'Created At',
    cell: ({ getValue }) => new Date(getValue<string>()).toLocaleString(),
  },
  { accessorKey: 'action', header: 'Action' },
  { accessorKey: 'user_id', header: 'User' },

  { accessorKey: 'table_name', header: 'Table' },

];

export function DataTable() {
  const [data, setData] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: audit_logs, error } = await supabase.from('audit_logs').select('*');
      if (error) {
        console.error(error);
        setIsLoading(false);
        return;
      }

      // Transform data to match the `AuditLog` interface
      const transformedData: AuditLog[] = (audit_logs || []).map((log) => ({
        id: Number(log.id), // Convert id to a number
        action: log.action,
        user_id: log.user_id,
        created_at: log.created_at,
      }));

      setData(transformedData);
      setIsLoading(false);
    })();
  }, []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  No items in this data table.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
