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

  // Fetch initial audit logs and users
  useEffect(() => {
    const loadAuditLogs = async () => {
      const logs = await fetchAuditLog(supabase);
      setAuditLogs(logs || []);
    };

    const loadUsers = async () => {
      const { data } = await supabase.from('users').select('id, full_name');
      setUsers(
        data?.map((user) => ({
          id: user.id,
          full_name: user.full_name || '',
        })) || []
      );
    };

    loadAuditLogs();
    loadUsers();
  }, [supabase]);

  // Set up real-time subscription for tables in audit_table_queue
  useEffect(() => {
    const setupRealtimeListeners = async () => {
      // Fetch tables to monitor from audit_table_queue
      const { data: auditTableQueue, error: queueError } = await supabase
        .from('audit_table_queue')
        .select('table');

      if (queueError) {
        console.error('Error fetching audit_table_queue:', queueError);
        return;
      }

      if (!auditTableQueue || auditTableQueue.length === 0) {
        console.log('No tables in audit_table_queue');
        return;
      }

      // Set up realtime listeners for each table in audit_table_queue
      auditTableQueue.forEach((queueItem) => {
        const tableName = queueItem.table;

        if (!tableName) return;

        // Subscribe to changes in the table
        const channel = supabase
          .channel(`public:${tableName}`)
          .on(
            'postgres_changes',
            {
              event: '*', // Listen for INSERT, UPDATE, DELETE
              schema: 'public',
              table: tableName,
            },
            (payload) => {
              console.log(`Change detected in table ${tableName}:`, payload);
              handleTableChange(tableName, payload, supabase);
            }
          )
          .subscribe();

        console.log(`Listening for changes on table: ${tableName}`);
      });
    };

    setupRealtimeListeners();
  }, [supabase]);

  // Function to handle table changes
  const handleTableChange = async (tableName: string, payload: any, supabase: any) => {
    const action = payload.eventType; // 'INSERT', 'UPDATE', 'DELETE'
    const userId = payload.new?.user_id || payload.old?.user_id; // Adjust based on your user identification logic
    const rowData = JSON.stringify(payload.new || payload.old);

    console.log(`Handling change for table ${tableName}:`, { action, userId, rowData });

    // Log the change to the audit_logs table
    const { data, error } = await supabase
      .from('audit_logs')
      .insert([
        {
          action,
          table_name: tableName,
          user_id: userId,
          row: rowData,
          created_at: new Date().toISOString(),
        },
      ])
      .select(); // Use .select() to return the inserted data

    if (error) {
      console.error('Error logging audit:', error);
    } else {
      console.log(`Logged ${action} on table ${tableName}:`, data);
    }
  };

  // Set up real-time subscription for audit_logs
  useEffect(() => {
    const channel = supabase
      .channel('audit_logs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs',
        },
        (payload) => {
          console.log('New audit log detected:', payload.new);
          setAuditLogs((prevLogs) => [payload.new as AuditLog, ...prevLogs]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
        const user = users.find((u) => u.id === getValue());
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