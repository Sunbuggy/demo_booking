/**
 * @file app/(biz)/biz/admin/migration/components/SingleBookingMigrator.tsx
 * @description A troubleshooting tool to force-migrate a specific reservation ID.
 */
'use client';

import { useState } from 'react';
import { Search, ArrowRight, Bug, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { testMigration } from '../actions';
import { Card } from '@/components/ui/card';

export default function SingleBookingMigrator() {
  const [legacyId, setLegacyId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleMigrate = async () => {
    if (!legacyId) return;
    setIsLoading(true);
    setResult(null);

    try {
      const response = await testMigration(parseInt(legacyId));
      
      if (response.success) {
        toast.success(`Success: Booking #${legacyId} migrated.`);
        setResult(response);
      } else {
        toast.error('Migration Failed', { description: response.error });
      }
    } catch (err) {
      toast.error('System Error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 items-start p-4 border rounded-lg bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center gap-2 mb-1">
        <div className="p-1.5 rounded-md bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
          <Bug size={16} />
        </div>
        <div>
          <h4 className="text-sm font-bold">Single Record Fix</h4>
          <p className="text-[10px] text-muted-foreground font-medium">DEBUGGER</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground max-w-[280px]">
        Missing a specific booking? Enter the Legacy ID (e.g., 12345) to force a pull.
      </p>

      <div className="flex w-full items-center space-x-2">
        <Input 
          type="number" 
          placeholder="Legacy ID" 
          value={legacyId}
          onChange={(e) => setLegacyId(e.target.value)}
          className="h-8 text-xs font-mono"
        />
        <Button 
          onClick={handleMigrate} 
          disabled={isLoading || !legacyId}
          size="sm"
          className="h-8"
        >
          {isLoading ? '...' : <ArrowRight size={14} />}
        </Button>
      </div>

      {/* Result Preview Area */}
      {result && result.success && (
        <Card className="w-full p-3 mt-2 bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-800/30">
            <div className="flex items-start gap-2">
                <CheckCircle2 className="text-green-600 w-4 h-4 mt-0.5" />
                <div className="space-y-1">
                    <p className="text-xs font-bold text-green-800 dark:text-green-400">Migration Successful</p>
                    <div className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 space-y-1">
                        <p>UUID: {result.migratedData.id.substring(0,8)}...</p>
                        <p>Pax: {result.migratedData.booking_participants?.length || 0}</p>
                        <p>Resources: {result.migratedData.booking_resources?.length || 0}</p>
                    </div>
                </div>
            </div>
        </Card>
      )}
    </div>
  );
}