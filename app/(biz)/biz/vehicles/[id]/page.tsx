import React from 'react';
import { fetchVehicleInfo } from '@/utils/supabase/queries';
import { VehiclePics } from '../admin/tables/components/row-actions';
import { createClient } from '@/utils/supabase/server';
import VehicleClientComponent from './components/vehicleClient';
import { fetchObjects } from '@/utils/biz/pics/get';

async function getVehicleData(id: string) {
  const supabase = createClient();
  const vehicleInfo = await fetchVehicleInfo(supabase, id);

  const bucket = 'sb-fleet';
  const mainDir = 'vehicles';
  const subDir = id;
  try {
    const response = await fetchObjects(bucket, mainDir, subDir);

    if (response?.success === false) {
      throw new Error(response.error);
    }

    const objs = response?.objects;

    return {
      vehicleInfo: vehicleInfo[0],
      images: objs as VehiclePics[]
    };
  } catch (error) {
    console.error(`Error fetching objects for ${id} `, error);
    return {
      vehicleInfo: null,
      images: []
    };
  }
}

export default async function VehiclePage({
  params
}: {
  params: { id: string };
}) {
  const { vehicleInfo, images } = await getVehicleData(params.id);
  return (
    <VehicleClientComponent
      id={params.id}
      initialVehicleInfo={vehicleInfo}
      initialImages={images}
    />
  );
}
