'use client';
import { createClient } from '@/utils/supabase/server';
import { useEffect, useState } from 'react';
import { DataTable } from './components/DataTable';
import { ColumnDef } from '@tanstack/react-table';

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
    header: 'Timestamp',
    cell: ({ getValue }) => new Date(getValue() as string).toLocaleString()
  },
  {
    accessorKey: 'action',
    header: 'Action'
  },
  {
    accessorKey: 'user_id',
    header: 'User ID'
  },
  {
    accessorKey: 'table_name',
    header: 'Table Name'
  },
  {
    accessorKey: 'row',
    header: 'Row Data'
  }
];
  const supabase = createClient();

export default function AuditLogPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching audit logs:', error);
        return;
      }

      setAuditLogs(data || []);
    };

    fetchAuditLogs();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold">Audit Logs</h1>
      <DataTable columns={columns} data={auditLogs} tableName="Audit Log" />
    </div>
  );
}
