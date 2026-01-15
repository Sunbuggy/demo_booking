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
import { VehiclePdf } from '../admin/tables/components/row-action-pdf';
import { notFound } from 'next/navigation';

const bucket = 'sb-fleet';

// Helper to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

async function getVehicleData(id: string) {
  const supabase = await await createClient();
  
  // Validate UUID format
  if (!isValidUUID(id)) {
    console.error(`Invalid UUID format: ${id}`);
    return {
      vehicleInfo: null,
      normalImages: [],
      normalBadges: [],
      vehicleTags: [],
      registrationPdf: [],
      titlePdf: [],
      insurancePdf: []
    };
  }

  const vehicleInfo = await fetchVehicleInfo(supabase, id);

  // If no vehicle found, return null
  if (!vehicleInfo || vehicleInfo.length === 0) {
    return {
      vehicleInfo: null,
      normalImages: [],
      normalBadges: [],
      vehicleTags: [],
      registrationPdf: [],
      titlePdf: [],
      insurancePdf: []
    };
  }

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
    const normalReg = normalRegResponse?.objects as VehiclePdf[];
    
    const normalTitleResponse = await fetchObjects(
      bucket,
      false,
      `titles/${id}`
    );
    const normalTitle = normalTitleResponse?.objects as VehiclePdf[];

    const normalInsuranceResponse = await fetchObjects(
      bucket,
      false,
      `insurance/${id}`
    );
    const normalInsurance = normalInsuranceResponse?.objects as VehiclePdf[];

    return {
      vehicleInfo: vehicleInfo[0] as VehicleType,
      normalImages: normalImages || [],
      normalBadges: normalBadges || [],
      vehicleTags,
      registrationPdf: normalReg || [],
      titlePdf: normalTitle || [],
      insurancePdf: normalInsurance || []
    };
  } catch (error) {
    console.error(`Error fetching objects for ${id} `, error);
    return {
      vehicleInfo: vehicleInfo[0] as VehicleType,
      normalImages: [],
      normalBadges: [],
      vehicleTags: [],
      registrationPdf: [],
      titlePdf: [],
      insurancePdf: [] 
    };
  }
}

export default async function VehiclePage({
  params
}: {
  params: Promise<{ id: string }>; // ✅ params is a Promise in Next.js 15
}) {
  try {
    // ✅ Await the params promise to unwrap it
    const { id } = await params;
    
    console.log('Vehicle Page - ID:', id); // Debug log
    
    // Validate ID exists
    if (!id || id === 'undefined') {
      console.error('Vehicle ID is undefined or empty');
      return notFound();
    }

    // Validate UUID format
    if (!isValidUUID(id)) {
      console.error(`Invalid vehicle ID format: ${id}`);
      return notFound();
    }

    const supabase = await await createClient();
    const user = await getUser(supabase);

    if (!user) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
            <p className="text-gray-600">Please sign in to view vehicle details.</p>
          </div>
        </div>
      );
    }

    // Get profile picture
    let profilePic = '';
    try {
      const profilePicResponse = await fetchObjects(
        bucket,
        true,
        `profile_pic/${id}`
      );
      profilePic = String(profilePicResponse?.url || '');
    } catch (error) {
      console.warn('Error fetching profile picture:', error);
      profilePic = '';
    }
    
    // Get vehicle data
    const { 
      vehicleInfo, 
      normalImages, 
      normalBadges, 
      vehicleTags, 
      registrationPdf, 
      titlePdf, 
      insurancePdf 
    } = await getVehicleData(id);

    // If no vehicle info found, show 404
    if (!vehicleInfo) {
      return notFound();
    }

    let vehicleLocations: VehicleLocation[] = [];
    let inventoryLocations: InventoryLocation[] = [];
    
    try {
      vehicleLocations = (await fetchVehicleLocations(
        supabase,
        id
      )) as VehicleLocation[];
    } catch (error) {
      console.warn('Error fetching vehicle locations:', error);
    }
    
    try {
      inventoryLocations = (await fetchVehicleInventoryLocation(
        supabase,
        id
      )) as InventoryLocation[];
    } catch (error) {
      console.warn('Error fetching inventory locations:', error);
    }
    
    return (
      <>
        {user ? (
          <VehicleClientComponent
            id={id}
            initialVehicleInfo={vehicleInfo}
            profilePic={profilePic}
            images={normalImages}
            gif={normalBadges}
            vehicleTags={vehicleTags}
            user={user}
            vehicleLocations={vehicleLocations}
            inventoryLocations={inventoryLocations}
            registrationPdf={registrationPdf}
            titlePdf={titlePdf}
            insurancePdf={insurancePdf} 
          />
        ) : (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
              <p className="text-gray-600">Please sign in to view vehicle details.</p>
            </div>
          </div>
        )}
      </>
    );
  } catch (error) {
    console.error('Error in VehiclePage:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Error Loading Vehicle</h1>
          <p className="text-gray-600">Could not load vehicle details. Please try again.</p>
          <p className="text-sm text-gray-500 mt-2">
            Error: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }
}