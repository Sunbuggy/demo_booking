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
    const channel = supabase
      .channel('table-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tableName },
        (payload: { eventType: any; new: any; old: any; }) => {
          console.log('Change received:', payload);
          const { eventType, new: newData, old: oldData } = payload;
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
