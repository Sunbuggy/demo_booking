'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getFleetIconSettings() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('fleet_type_settings')
    .select('*');
  
  if (error) {
    console.error('Error fetching icon settings:', error);
    return [];
  }
  return data;
}

export async function updateFleetIcon(vehicleType: string, iconName: string) {
  const supabase = await createClient();
  
  // Upsert allows us to update existing OR add new types on the fly
  const { error } = await supabase
    .from('fleet_type_settings')
    .upsert({ 
      vehicle_type: vehicleType.toLowerCase(), 
      icon_name: iconName,
      updated_at: new Date().toISOString()
    })
    .select();

  if (error) throw new Error(error.message);
  
  revalidatePath('/biz/vehicles/admin'); // Refresh the fleet pages
  revalidatePath('/biz/admin/developer/fleet-icons'); // Refresh admin
  return { success: true };
}
// ... existing imports
import { v4 as uuidv4 } from 'uuid'; // You might need to install: npm i uuid

export async function uploadCustomIcon(file: FormData) {
  const supabase = await createClient();
  const fileData = file.get('file') as File;
  const vehicleType = file.get('type') as string;

  if (!fileData || !vehicleType) throw new Error("Missing file or type");

  // 1. Upload to Storage
  const fileExt = fileData.name.split('.').pop();
  const fileName = `${vehicleType}-${uuidv4()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase
    .storage
    .from('fleet-icons')
    .upload(filePath, fileData);

  if (uploadError) throw new Error(uploadError.message);

  // 2. Get Public URL
  const { data: { publicUrl } } = supabase
    .storage
    .from('fleet-icons')
    .getPublicUrl(filePath);

  // 3. Update Settings Table with the URL
  await updateFleetIcon(vehicleType, publicUrl);

  return { success: true, url: publicUrl };
}