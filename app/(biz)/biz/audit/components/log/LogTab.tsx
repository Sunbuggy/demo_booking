'use client';

import { useEffect, useState } from 'react';
import { DataTable } from '../DataTable';
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

export default function LogTab() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<{ id: string; full_name: string }[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const loadAuditLogs = async () => {
      const logs = await fetchAuditLog(supabase);
      setAuditLogs(logs || []);
    };

    const loadUsers = async () => {
      const { data } = await supabase.from('users').select('id, full_name');
      setUsers(
        data?.map(user => ({
          id: user.id,
          full_name: user.full_name || '',
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
      accessorKey: 'user_id',
      header: 'User ID',
      cell: ({ getValue }) => {
        const user = users.find(u => u.id === getValue());
        return user ? user.full_name : 'Unknown';
      },
    },
    {
      accessorKey: 'action',
      header: 'Action',
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
