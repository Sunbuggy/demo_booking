import React from 'react';
import { fetchVehicleInfo } from '@/utils/supabase/queries';
import { VehiclePics } from '../admin/tables/components/row-actions';
import { createClient } from '@/utils/supabase/server';
import VehicleClientComponent from './components/vehicle-client';
import { fetchObjects } from '@/utils/biz/pics/get';
interface GroupImagesType {
  [date: string]: string[];
}
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

    const normalImages = normalPicsResponse?.objects as VehiclePics[];
    const damageImages = damagePicsResponse?.objects as VehiclePics[];

    const groupedImages: GroupImagesType = {};

    damageImages.forEach((image) => {
      const date = image.key.split('/')[2].split('T')[0];
      if (!groupedImages[date]) {
        groupedImages[date] = [];
      }
      groupedImages[date].push(image.url);
    });

    return {
      vehicleInfo: vehicleInfo[0],
      normalImages: normalImages || [],
      damageImages: groupedImages || {}
    };
  } catch (error) {
    console.error(`Error fetching objects for ${id} `, error);
    return {
      vehicleInfo: null,
      normalImages: [],
      damageImages: {}
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
