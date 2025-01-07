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

export default function AuditLogPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const loadAuditLogs = async () => {
      const data = await fetchAuditLog(supabase);
      setAuditLogs(data);
    };

    loadAuditLogs();
  }, [supabase]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Audit Logs</h1>
      <DataTable columns={columns} data={auditLogs} tableName="Audit Log" />
    </div>
  );
}
