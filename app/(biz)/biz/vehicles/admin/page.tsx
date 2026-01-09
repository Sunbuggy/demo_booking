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
  // We only pass the plain data the client needs, stripping internal Supabase methods.
  const loggedInUser = rawUser ? {
    id: rawUser.id,
    email: rawUser.email,
    user_metadata: rawUser.user_metadata
  } : null;

  // 3. Maintenance Logic
  try {
    await checkVehicleFutureLocation(supabase);
  } catch (err) {
    console.error('Maintenance error:', err);
  }

  // 4. Fetch Data (Already Sanitized in the Action)
  const vehicles = await getFleetDashboardData();

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