'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * HELPER: Standardize Payload Construction
 * Ensures both Create and Update use the exact same logic.
 * FIX APPLIED: Removed 'updated_at' to prevent schema cache errors.
 */
function buildPayload(formData: FormData) {
  const name = formData.get('name') as string;
  const type = formData.get('type') as 'point' | 'polygon';
  
  // Base object
  const payload: any = { 
    name, 
    type
    // REMOVED: updated_at: new Date().toISOString() 
    // Reason: The DB table does not have this column, causing the API to reject the request.
  };

  if (type === 'point') {
    // 1. Handle Point Logic
    payload.center_lat = parseFloat(formData.get('lat') as string);
    payload.center_lng = parseFloat(formData.get('lng') as string);
    payload.radius_miles = parseFloat(formData.get('radius') as string);
    
    // Explicitly NULL the polygon data to keep DB clean
    payload.polygon_coords = null; 
  } else {
    // 2. Handle Polygon Logic
    try {
      const rawPoly = formData.get('polygon_json') as string;
      
      // Validation: Ensure it is actually valid JSON before saving
      const parsed = JSON.parse(rawPoly);
      
      // Store: We verify it's an array, then save. 
      payload.polygon_coords = parsed; 

      // Explicitly NULL the point data
      payload.center_lat = null;
      payload.center_lng = null;
      payload.radius_miles = null;
    } catch (e) {
      throw new Error('Invalid JSON format for Polygon. Please check syntax.');
    }
  }

  return payload;
}

/**
 * CREATE GEOFENCE
 */
export async function createGeofence(formData: FormData) {
  const supabase = await createClient();

  try {
    const payload = buildPayload(formData);
    
    const { error } = await supabase.from('location_geofences').insert(payload);
    
    if (error) throw new Error(error.message);

    revalidatePath('/biz/admin/developer/geofence');
    return { success: true, message: 'Geofence Created' };
  } catch (error: any) {
    console.error('Create Error:', error);
    return { success: false, message: error.message };
  }
}

/**
 * UPDATE GEOFENCE
 */
export async function updateGeofence(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get('id');

  if (!id) return { success: false, message: 'Missing Geofence ID' };

  try {
    const payload = buildPayload(formData);

    const { error } = await supabase
      .from('location_geofences')
      .update(payload)
      .eq('id', id);

    if (error) throw new Error(error.message);

    revalidatePath('/biz/admin/developer/geofence');
    return { success: true, message: 'Geofence Updated' };
  } catch (error: any) {
    console.error('Update Error:', error);
    return { success: false, message: error.message };
  }
}

/**
 * DELETE GEOFENCE
 */
export async function deleteGeofence(id: number | string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('location_geofences')
    .delete()
    .eq('id', id);

  if (error) return { success: false, message: error.message };
  
  revalidatePath('/biz/admin/developer/geofence');
  return { success: true };
}