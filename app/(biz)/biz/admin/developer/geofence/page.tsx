/**
 * @file page.tsx
 * @description Geofence Manager Entry Point.
 * Checks permissions and loads initial data.
 */
import React from 'react';
import { getGeofences } from '@/lib/fleet/geofencing';
import { createClient } from '@/utils/supabase/server';
import { getUserDetails } from '@/utils/supabase/queries';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert } from 'lucide-react';
import GeofenceClientView from './client-view'; // Import our new Client Component

export default async function GeofenceManagerPage() {
  const supabase = await createClient();

  // 1. SECURITY CHECK (Level 950+)
  const userDetails = await getUserDetails(supabase);
  const userLevel = userDetails?.[0]?.user_level ?? 0;

  if (userLevel < 950) {
    return (
      <div className="h-[calc(100vh-65px)] flex flex-col items-center justify-center text-center p-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Restricted Area</h1>
        <p className="text-slate-500 max-w-md mt-2">
          This tool modifies global fleet tracking logic. Developer access (Level 950+) is required.
        </p>
      </div>
    );
  }

  // 2. Load Data (Server Side)
  // This uses the safe parser we added to lib/fleet/geofencing
  const geofences = await getGeofences();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 h-[calc(100vh-65px)] overflow-y-auto">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
             <h1 className="text-2xl font-bold tracking-tight">Geofence Manager</h1>
             <Badge variant="destructive" className="font-mono">DEV ONLY</Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Manage <code>location_geofences</code> table. Updates reflect immediately in Fleet Tracking.
          </p>
        </div>
      </div>

      {/* Render the Client View
         We pass the server-fetched data as a prop ("Hydration").
      */}
      <GeofenceClientView initialGeofences={geofences} />

    </div>
  );
}