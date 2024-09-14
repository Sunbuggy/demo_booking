import React from 'react';
import { fetchVehicleInfo } from '@/utils/supabase/queries';
import { VehiclePics } from '../admin/tables/components/row-actions';
import { createClient } from '@/utils/supabase/server';
import VehicleClientComponent from './components/vehicle-client';
import { fetchObjects } from '@/utils/biz/pics/get';
import { VehicleTagType } from '../admin/page';

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

  const bucket = 'sb-fleet';
  try {
    const normalPicsResponse = await fetchObjects(
      bucket,
      false,
      `vehicles/${id}`
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

    return {
      vehicleInfo: vehicleInfo[0],
      normalImages: normalImages || [],
      vehicleTags
    };
  } catch (error) {
    console.error(`Error fetching objects for ${id} `, error);
    return {
      vehicleInfo: null,
      normalImages: [],
      vehicleTags: []
    };
  }
}

export default async function VehiclePage({
  params
}: {
  params: { id: string };
}) {
  const { vehicleInfo, normalImages, vehicleTags } = await getVehicleData(
    params.id
  );

  return (
    <VehicleClientComponent
      id={params.id}
      initialVehicleInfo={vehicleInfo}
      profilePic={vehicleInfo?.profile_pic}
      images={normalImages}
      vehicleTags={vehicleTags}
    />
  );
}
