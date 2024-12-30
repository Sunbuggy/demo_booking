'use client'
import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

interface Change {
  event: 'INSERT' | 'UPDATE' | 'DELETE';
  data: Record<string, any>;
}

const RealtimeTableListener: React.FC<{ tableName: string }> = ({ tableName }) => {
  const [changes, setChanges] = useState<Change[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const logToAuditTable = async (
      event: 'INSERT' | 'UPDATE' | 'DELETE',
      tableName: string,
      userId: string | null,
      data: Record<string, any>
    ) => {
      const { error } = await supabase.from('audit_logs').insert([
        {
          action: `${event} on ${tableName}`,
          user_id: userId,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.error('Failed to log to audit table:', error);
      }
    };

    const fetchUserId = async () => {
      const user = await supabase.auth.getUser();
      return user?.data?.user?.id || null;
    };

    const channel = supabase
      .channel('table-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tableName },
        async (payload: { eventType: any; new: any; old: any }) => {
          const { eventType, new: newData, old: oldData } = payload;

          console.log('Change received:', payload);

          const userId = await fetchUserId();

          // Log the event in the audit_logs table
          await logToAuditTable(eventType, tableName, userId, eventType === 'DELETE' ? oldData : newData);

          // Update local state
          setChanges((prev) => [
            ...prev,
            { event: eventType, data: eventType === 'DELETE' ? oldData : newData },
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName]);

  return (
    <div>
      <h3>Real-time Changes for Table: {tableName}</h3>
      <ul>
        {changes.map((change, index) => (
          <li key={index}>
            <strong>{change.event}:</strong> {JSON.stringify(change.data)}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RealtimeTableListener;
