'use client';

import { useEffect, useState } from 'react';
import { DataTable } from '../DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { fetchAuditQueue, updateAuditQueue } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/client';

type AuditQueue = {
  id: string;
  created_at: string;
  table: string;
};

export default function QueueTab() {
  const [auditQueues, setAuditQueues] = useState<AuditQueue[]>([]);
  const [newTableName, setNewTableName] = useState<string>('');
  const supabase = createClient();

  useEffect(() => {
    const loadAuditQueues = async () => {
      const Queues = await fetchAuditQueue(supabase);
      setAuditQueues(Queues || []);
    };

    loadAuditQueues();
  }, [supabase]);

  const handleAddQueue = async () => {
    if (!newTableName.trim()) {
      alert('Table name cannot be empty.');
      return;
    }

    const newQueueItem = {
      table: newTableName,
      created_at: new Date().toISOString(),
    };

    const result = await updateAuditQueue(supabase, newQueueItem);
    if (result) {
      // Add the new item to the state
      setAuditQueues((prev) => [...prev, result[0]]);
      setNewTableName(''); // Clear the input field
      alert('New item added successfully.');
    } else {
      alert('Failed to add the new item.');
    }
  };

  const columns: ColumnDef<AuditQueue>[] = [
    {
      accessorKey: 'created_at',
      header: 'Created At',
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleString(),
    },
    {
      accessorKey: 'table',
      header: 'Table Name',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Audit Queues</h1>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Enter table name"
          value={newTableName}
          onChange={(e) => setNewTableName(e.target.value)}
          className="border border-gray-300 rounded p-2 mr-2"
        />
        <button
          onClick={handleAddQueue}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Add to Queue
        </button>
      </div>
      <DataTable columns={columns} data={auditQueues} tableName="Audit Queue" />
    </div>
  );
}
