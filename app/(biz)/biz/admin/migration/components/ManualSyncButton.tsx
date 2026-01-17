/**
 * @file app/(biz)/biz/admin/migration/components/ManualSyncButton.tsx
 * @description Manual Trigger for Legacy Migration.
 * FIX: Uses Server Action (triggerManualSync) to avoid 401 Client-Side errors.
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// CRITICAL IMPORT: Must import the Server Action, not use fetch() directly
import { triggerManualSync } from '../actions';

export default function ManualSyncButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleManualTrigger = async () => {
    setIsLoading(true);
    
    const toastId = toast.loading('Initiating Legacy Sync...', {
      description: 'Requesting secure handshake...'
    });

    try {
      // CRITICAL CHANGE: Call the Server Action
      const result = await triggerManualSync();

      toast.success('Sync Completed', {
        id: toastId,
        description: `Processed ${result.count} records successfully.`,
        duration: 4000,
      });

      router.refresh();

    } catch (error: any) {
      console.error('Manual Sync Error:', error);
      
      // If the Server Action fails, it throws an Error with a message
      // We display that message here (e.g., "Check CRON_SECRET")
      toast.error('Sync Failed', {
        id: toastId,
        description: error.message || 'Check server logs.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 items-start p-4 border rounded-lg 
      bg-yellow-50/50 border-yellow-200 
      dark:bg-yellow-900/10 dark:border-yellow-800/30">
        
        <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400">
              <Database size={16} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-yellow-900 dark:text-yellow-400">Manual Override</h4>
              <p className="text-[10px] text-yellow-700/80 dark:text-yellow-500/80 font-medium">
                FORCE SYNC (MYSQL → SUPABASE)
              </p>
            </div>
        </div>

        <p className="text-xs text-muted-foreground max-w-[280px] leading-relaxed">
            Trigger an immediate synchronization. Use this if a customer is standing at the counter but their booking is missing.
        </p>

        <Button 
            onClick={handleManualTrigger} 
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="w-full border-yellow-500 text-yellow-700 hover:bg-yellow-100 hover:text-yellow-900 
            dark:border-yellow-700 dark:text-yellow-400 dark:hover:bg-yellow-900/40 transition-all"
        >
            {isLoading ? (
                <>
                    <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Syncing...
                </>
            ) : (
                <>
                    <RefreshCw className="mr-2 h-3.5 w-3.5" />
                    Run Sync Now
                </>
            )}
        </Button>
    </div>
  );
}