import React from 'react';
import { fetchVehicleInfo } from '@/utils/supabase/queries';
import { VehiclePics } from '../admin/tables/components/row-actions';
import { createClient } from '@/utils/supabase/server';
import VehicleClientComponent from './components/vehicleClient';
import axios from 'axios';

async function getVehicleData(id: string) {
  const supabase = createClient();
  const vehicleInfo = await fetchVehicleInfo(supabase, id);

  const bucket = 'sb-fleet';
  const mainDir = 'vehicles';
  const subDir = id;
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/s3/upload/?bucket=${bucket}&mainDir=${mainDir}&subDir=${subDir}`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const { objects } = (await response.data) as { objects: VehiclePics[] };

    return {
      vehicleInfo: vehicleInfo[0],
      images: objects
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
