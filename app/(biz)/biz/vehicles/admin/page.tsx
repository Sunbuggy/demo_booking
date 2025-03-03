import React from 'react';
import VehiclesTabContainer from './tabs-container';
import { createClient } from '@/utils/supabase/server';
import {
  checkVehicleFutureLocation,
  fetchVehicles,
  getUser,
  getUserDetails
} from '@/utils/supabase/queries';
import { Database } from '@/types_db';
import ChooseAdventure from '@/app/(com)/choose-adventure/page';

export type VehicleType = Database['public']['Tables']['vehicles']['Row'];
export type VehicleTagType = Database['public']['Tables']['vehicle_tag']['Row'];
const VehiclesManagementPage = async () => {
  const supabase = createClient();
  const vehicles = (await fetchVehicles(supabase)) as unknown as VehicleType[];
  const loggedInUser = await getUser(supabase);
  const userDetails = await getUserDetails(supabase);
  const userLevel= userDetails?.[0]?.user_level ?? 0;
  checkVehicleFutureLocation(supabase)
    .then((data) => {
      console.info('Future locations checked');
    })
    .catch((error) => {
      console.error('Error checking future locations:', error);
    });


  return (
    <div>
      {userLevel >= 300 &&(
      <VehiclesTabContainer vehicles={vehicles} loggedInUser={loggedInUser} />
      )}
      {userLevel <300 && (
        <div><ChooseAdventure/></div>
      )}
    </div>
  );
};

export default VehiclesManagementPage;
