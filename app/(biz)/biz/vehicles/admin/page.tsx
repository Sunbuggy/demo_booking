/**
 * @file app/(biz)/biz/vehicles/admin/page.tsx
 * @description Fleet Command Page (v2.0).
 * Fetches vehicle data server-side (with Geofencing) and passes it to the client.
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
import { getFleetDashboardData } from '@/app/actions/fleet'; // V2 Action

export type VehicleType = Database['public']['Tables']['vehicles']['Row'];

const VehiclesManagementPage = async () => {
  const supabase = await createClient();
  
  // 1. Auth & Permissions
  const [rawUser, userDetails] = await Promise.all([
    getUser(supabase),
    getUserDetails(supabase)
  ]);
  const userLevel = userDetails?.[0]?.user_level ?? 0;

  if (userLevel < 300) {
    return <div><ChooseAdventure/></div>;
  }

  // 2. Sanitize User Object (Prevents Serialization Error)
  const loggedInUser = rawUser ? {
    id: rawUser.id,
    email: rawUser.email,
    user_metadata: rawUser.user_metadata
  } : null;

  // 3. Maintenance Logic (Server Side)
  try {
    await checkVehicleFutureLocation(supabase);
  } catch (err) {
    console.error('Maintenance error:', err);
  }

  // 4. Fetch V2 Data (Includes Geofencing & Status)
  const vehicles = await getFleetDashboardData();

  // 5. Render Command Center
  return (
    <div>
      <VehiclesTabContainer 
        vehicles={vehicles} 
        loggedInUser={loggedInUser} 
      />
    </div>
  );
};

export default VehiclesManagementPage;