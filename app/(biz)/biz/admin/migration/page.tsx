/**
 * @file app/(biz)/biz/admin/migration/page.tsx
 * @description The "Workbench" for monitoring the Strangler Fig migration pattern.
 */

import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { 
  ArrowRightLeft, 
  CheckCircle2, 
  Clock, 
  ServerCrash,
  FileJson,
  AlertTriangle 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Components
import ManualSyncButton from './components/ManualSyncButton';
import SingleBookingMigrator from './components/SingleBookingMigrator'; // NEW COMPONENT
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { USER_LEVELS } from '@/lib/constants/user-levels';

export const dynamic = 'force-dynamic';

export default async function MigrationWorkbenchPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/signin');

  const { data: userProfile } = await supabase
    .from('users')
    .select('user_level')
    .eq('id', user.id)
    .single();

  if (!userProfile || userProfile.user_level < USER_LEVELS.DEV) {
    return (
      <div className="p-8 text-center text-red-500">
        <ServerCrash className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <h1 className="text-xl font-bold">Restricted Area</h1>
        <p>This workbench requires Level {USER_LEVELS.DEV} (Developer) access.</p>
      </div>
    );
  }

  // A. Count Legacy Records
  const { count: legacyCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .not('legacy_id', 'is', null);

  // B. Count Native Records
  const { count: nativeCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .is('legacy_id', null);

  // C. Recent Syncs
  const { data: recentSyncs } = await supabase
    .from('bookings')
    .select('id, legacy_id, created_at, status, operational_metadata')
    .not('legacy_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(25);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      
      {/* HEADER */}
      <header className="flex-none p-6 border-b bg-white dark:bg-zinc-900/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <ArrowRightLeft className="text-yellow-600" />
              LEGACY MIGRATION WORKBENCH
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Monitoring the "Strangler Fig" migration from MySQL to Supabase.
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <Badge variant="outline" className="text-xs font-mono mb-1">v1.1 DUAL-WRITE</Badge>
          </div>
        </div>
      </header>

      {/* SCROLLABLE CONTENT */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          
          {/* COLUMN 1: CONTROLS & STATS */}
          <div className="space-y-6">
            
            {/* TOOL 1: Bulk Sync */}
            <ManualSyncButton />

            {/* TOOL 2: Single Fix (NEW) */}
            <SingleBookingMigrator />

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Synced (Legacy)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{legacyCount?.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Native (Supabase)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{nativeCount?.toLocaleString()}</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* COLUMN 2: THE DIFF TABLE */}
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Recent Sync Activity</CardTitle>
                  <Badge variant="secondary" className="font-mono text-xs">Live View</Badge>
                </div>
              </CardHeader>
              
              <div className="flex-1 overflow-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-zinc-50 dark:bg-zinc-900 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 font-medium">Synced</th>
                      <th className="px-4 py-3 font-medium">Legacy ID</th>
                      <th className="px-4 py-3 font-medium">Supabase UUID</th>
                      <th className="px-4 py-3 font-medium text-right">Raw Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {recentSyncs?.map((row) => (
                      <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                        <td className="px-4 py-3 whitespace-nowrap text-zinc-500">
                          <div className="flex items-center gap-2">
                            <Clock size={12} />
                            {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-orange-600 dark:text-orange-400 font-bold">
                          #{row.legacy_id}
                        </td>
                        <td className="px-4 py-3 font-mono text-[10px] text-zinc-400 truncate max-w-[120px]" title={row.id}>
                          {row.id}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {row.operational_metadata ? (
                            <CheckCircle2 size={16} className="text-green-600 dark:text-green-500 ml-auto" />
                          ) : (
                            <AlertTriangle size={16} className="text-red-400 ml-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
}