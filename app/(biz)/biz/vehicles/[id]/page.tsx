import React from 'react';
import { fetchVehicleInfo } from '@/utils/supabase/queries';
import { VehiclePics } from '../admin/tables/components/row-actions';
import { createClient } from '@/utils/supabase/server';
import VehicleClientComponent from './components/vehicle-client';
import { fetchObjects } from '@/utils/biz/pics/get';

async function getVehicleData(id: string) {
  const supabase = createClient();
  const vehicleInfo = await fetchVehicleInfo(supabase, id);

  const bucket = 'sb-fleet';
  try {
    const normalPicsResponse = await fetchObjects(
      bucket,
      false,
      `vehicles/${id}`
    );
    const damagePicsResponse = await fetchObjects(
      bucket,
      false,
      `vehicle_damage/${id}`
    );
    const profilePicResponse = await fetchObjects(
      bucket,
      true,
      `profile_pic/${id}`
    );

    if (profilePicResponse?.url) {
      vehicleInfo[0].profile_pic = profilePicResponse.url;
    }

    if (normalPicsResponse?.success === false) {
      return {
        vehicleInfo: vehicleInfo[0],
        normalImages: [],
        damageImages: []
      };
    }
    console.log(damagePicsResponse);

    const normalImages = normalPicsResponse?.objects;
    const damageImages = damagePicsResponse?.objects;

    return {
      vehicleInfo: vehicleInfo[0],
      normalImages: (normalImages as VehiclePics[]) || [],
      damageImages: (damageImages as VehiclePics[]) || []
    };
  } catch (error) {
    console.error(`Error fetching objects for ${id} `, error);
    return {
      vehicleInfo: null,
      normalImages: [],
      damageImages: []
    };
  }
}

export default async function VehiclePage({
  params
}: {
  params: { id: string };
}) {
  const { vehicleInfo, normalImages, damageImages } = await getVehicleData(
    params.id
  );

  console.log('damageImages', damageImages);
  return (
    <VehicleClientComponent
      id={params.id}
      initialVehicleInfo={vehicleInfo}
      profilePic={vehicleInfo?.profile_pic}
      images={normalImages}
      damageImages={damageImages}
    />
  );
}
