'use client';

import { useEffect, useRef, useMemo } from 'react'; // <--- Added useMemo
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function RealtimeGroupsListener() {
  const router = useRouter();
  
  // FIX: Use useMemo so 'supabase' remains the SAME object across renders.
  // This stops the infinite disconnect/reconnect loop.
  const supabase = useMemo(() => createClient(), []);

  // Ref to hold the timer ID
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log('🔌 Connecting to Global Groups Listener...');

    const debouncedRefresh = (source: string) => {
      // 1. Cancel existing timer
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      console.log(`⏳ Change in [${source}]. Debouncing...`);

      // 2. Set new timer for 2 seconds
      timeoutRef.current = setTimeout(() => {
        console.log('♻️ Refreshing Server Data...');
        router.refresh();
        timeoutRef.current = null;
      }, 2000);
    };

    const channel = supabase.channel('global_groups_tracker')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, () => debouncedRefresh('groups'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_vehicles' }, () => debouncedRefresh('group_vehicles'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_timings' }, () => debouncedRefresh('group_timings'))
      .subscribe((status) => {
         if (status === 'SUBSCRIBED') console.log('✅ Listener Active');
      });

    return () => {
      supabase.removeChannel(channel);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [supabase, router]); // <--- Now safe because 'supabase' is stable

  return null;
}