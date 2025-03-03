import React from 'react';
import {
  fetchVehicleInfo,
  fetchVehicleInventoryLocation,
  fetchVehicleLocations,
  getUser
} from '@/utils/supabase/queries';
import { VehiclePics } from '../admin/tables/components/row-actions';
import { VehicleGifs } from '../admin/tables/components/row-actions-gif';
import { createClient } from '@/utils/supabase/server';
import { fetchObjects } from '@/utils/biz/pics/get';
import { VehicleTagType, VehicleType } from '../admin/page';
import VehicleClientComponent from './components/vehicle-client';
import { InventoryLocation, VehicleLocation } from '../types';
import { VehicleReg } from '../admin/tables/components/row-action-reg';

const bucket = 'sb-fleet';
async function getVehicleData(id: string) {
  const supabase = createClient();
  const vehicleInfo = await fetchVehicleInfo(supabase, id);

  const fetchVehicleTagInfo = async () => {
    const { data, error } = await supabase
      .from('vehicle_tag')
      .select('*')
      .eq('vehicle_id', id);
    if (error) {
      console.error('Error fetching vehicle tags', error);
      return [];
    }
    return (data as VehicleTagType[]) || [];
  };

  const vehicleTags = await fetchVehicleTagInfo();

  try {
    const normalPicsResponse = await fetchObjects(
      bucket,
      false,
      `vehicles/${id}`
    );

    const normalImages = normalPicsResponse?.objects as VehiclePics[];

    const normalGifsResponse = await fetchObjects(
      bucket,
      false,
      `badges/${id}`
    );
    const normalBadges = normalGifsResponse?.objects as VehicleGifs[];

    const normalRegResponse = await fetchObjects(
      bucket,
      false,
      `registrations/${id}`
    );
    const normalReg = normalRegResponse?.objects as VehicleReg[];
    
    return {
      vehicleInfo: vehicleInfo[0] as VehicleType,
      normalImages: normalImages || [],
      normalBadges: normalBadges || [],
      vehicleTags,
      registrationPdf: normalReg || []
    };
  } catch (error) {
    console.error(`Error fetching objects for ${id} `, error);
    return {
      vehicleInfo: vehicleInfo[0] as VehicleType,
      normalImages: [],
      normalBadges: [],
      vehicleTags: [],
      registrationPdf: [] 
    };
  }
}



export default async function VehiclePage({
  params
}: {
  params: { id: string };
}) {
  // debug id going undefined
  const supabase = createClient();
  const user = await getUser(supabase);

  const profilePicResponse = await fetchObjects(
    bucket,
    true,
    `profile_pic/${params.id}`
  );
  const profilePic = String(profilePicResponse?.url);
  const { vehicleInfo, normalImages, normalBadges,vehicleTags, registrationPdf } = await getVehicleData(
    params.id
  );

  const vehicleLocations = (await fetchVehicleLocations(
    supabase,
    params.id
  )) as VehicleLocation[];
  const inventoryLocations = (await fetchVehicleInventoryLocation(
    supabase,
    params.id
  )) as InventoryLocation[];
  return (
    <>
      {user ? (
        <VehicleClientComponent
          id={params.id}
          initialVehicleInfo={vehicleInfo}
          profilePic={profilePic}
          images={normalImages}
          gif={normalBadges}
          vehicleTags={vehicleTags}
          user={user}
          vehicleLocations={vehicleLocations}
          inventoryLocations={inventoryLocations}
          registrationPdf={registrationPdf} 
        />
      ) : (
        <div>No User</div>
      )}
    </>
  );
}
