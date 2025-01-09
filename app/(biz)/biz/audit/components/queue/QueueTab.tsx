'use client';

import { useEffect, useState } from 'react';
import { DataTable } from '../DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { fetchAuditQueue } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/client';

type AuditQueue = {
  id: string;
  created_at: string;
  table: string;
};

export default function QueueTab() {
  const [auditQueues, setAuditQueues] = useState<AuditQueue[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const loadAuditQueues = async () => {
      const Queues = await fetchAuditQueue(supabase);
      setAuditQueues(Queues || []);
    };


    loadAuditQueues();
  }, [supabase]);

  const columns: ColumnDef<AuditQueue>[] = [
    {
      accessorKey: 'created_at',
      header: 'Created At',
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleString(),
    },


    {
      accessorKey: 'table_name',
      header: 'Table Name',
    },

  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Audit Queues</h1>
      <DataTable columns={columns} data={auditQueues} tableName="Audit Queue" />
    </div>
  );
}
