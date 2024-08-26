import React from 'react';
import VehiclesTabContainer from './tabs-container';
import { createClient } from '@/utils/supabase/server';
import { fetchVehicles, getUser } from '@/utils/supabase/queries';
import { Database } from '@/types_db';

export type VehicleType = Database['public']['Tables']['vehicles']['Row'];
const VehiclesManagementPage = async () => {
  const supabase = createClient();
  const vehicles = (await fetchVehicles(supabase)) as unknown as VehicleType[];
  const loggedInUser = await getUser(supabase);

  return (
    <div>
      <VehiclesTabContainer vehicles={vehicles} loggedInUser={loggedInUser} />
    </div>
  );
};

export default VehiclesManagementPage;
