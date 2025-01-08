'use client';

import { useEffect, useState } from 'react';
import { DataTable } from './components/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { fetchAuditLog } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/client';

type AuditLog = {
  id: string;
  created_at: string;
  action: string;
  user_id: string | null;
  table_name: string;
  row: string;
};

export default function AuditLogPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<{ id: string; full_name: string }[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const loadAuditLogs = async () => {
      const logs = await fetchAuditLog(supabase); // Assuming fetchAuditLog directly returns an array
      setAuditLogs(logs || []); // Set the logs directly
    };

    const loadUsers = async () => {
      const { data } = await supabase.from('users').select('id, full_name');
      setUsers(
        data?.map(user => ({
          id: user.id,
          full_name: user.full_name || '', // Ensure full_name is a string
        })) || []
      );
    };

    loadAuditLogs();
    loadUsers();
  }, [supabase]);

  const columns: ColumnDef<AuditLog>[] = [
    {
      accessorKey: 'created_at',
      header: 'Created At',
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleString(),
    },
    {
      accessorKey: 'action',
      header: 'Action',
    },
    {
      accessorKey: 'user_id',
      header: 'User ID',
      cell: ({ getValue }) => {
        const user = users.find(u => u.id === getValue());
        return user ? user.full_name : 'Unknown';
      },
    },
    {
      accessorKey: 'table_name',
      header: 'Table Name',
    },
    {
      accessorKey: 'row',
      header: 'Row Data',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Audit Logs</h1>
      <DataTable columns={columns} data={auditLogs} tableName="Audit Log" />
    </div>
  );
}
