/**
 * @file app/(biz)/biz/vehicles/admin/page.tsx
 * @description Main Fleet Command Center.
 * * REFACTOR UPDATE (Phase 2):
 * - Replaced raw `fetchVehicles` with `getFleetDashboardData` Server Action.
 * - Now pre-calculates Geofencing (Vegas/Pismo/Nellis) on the server.
 * - Blocks rendering until `checkVehicleFutureLocation` maintenance completes to ensure data freshness.
 * - Enforces Level 300+ Security.
 */

import React from 'react';
import VehiclesTabContainer from './tabs-container';
import { createClient } from '@/utils/supabase/server';
import {
  checkVehicleFutureLocation,
  getUser,
  getUserDetails
} from '@/utils/supabase/queries';
import { Database } from '@/types_db';
import ChooseAdventure from '@/app/(com)/choose-adventure/page';
import { getFleetDashboardData } from '@/app/actions/fleet';

// TYPE DEFINITIONS
// We export the raw DB type for legacy components, but prefer the new DashboardVehicle
export type VehicleType = Database['public']['Tables']['vehicles']['Row'];
export type VehicleTagType = Database['public']['Tables']['vehicle_tag']['Row'];

const VehiclesManagementPage = async () => {
  // 1. Initialize Supabase Client
  const supabase = await createClient();

  // 2. Auth & Permissions Check
  // We fetch user details immediately to determine if we should even load the heavy fleet data.
  const [loggedInUser, userDetails] = await Promise.all([
    getUser(supabase),
    getUserDetails(supabase)
  ]);

  const userLevel = userDetails?.[0]?.user_level ?? 0;

  // SECURITY GATE: Redirect non-staff immediately
  if (userLevel < 300) {
    return (
      <div>
        <ChooseAdventure />
      </div>
    );
  }

  // 3. Maintenance Logic (The "Side Effect")
  // We await this to ensure the database is updated (e.g., vehicle moved from "Future" to "Current" location)
  // before we fetch the dashboard data.
  // TODO (Phase 3): Move this to a Supabase Cron Trigger to speed up page load.
  try {
    await checkVehicleFutureLocation(supabase);
    // console.info('Maintenance: Future locations processed.');
  } catch (error) {
    console.error('Maintenance Error (Non-Blocking):', error);
  }

  // 4. Fetch Smart Fleet Data
  // This replaces the old client-side fetch. It returns vehicles Hydrated with:
  // - location_name (calculated from Lat/Lon via Geofencing Lib)
  // - last_active timestamp
  const vehicles = await getFleetDashboardData();

  // 5. Render Command Center
  return (
    <div className="w-full">
      <VehiclesTabContainer 
        vehicles={vehicles} 
        loggedInUser={loggedInUser} 
      />
    </div>
  );
};

export default VehiclesManagementPage;