/**
 * @file app/lib/fleet/geofencing.ts
 * @description Pure logic for mapping GPS coordinates to Named Locations.
 * Uses Turntable Math (Haversine) and Point-in-Polygon checks.
 */
import { createClient } from '@/utils/supabase/server';
import { cache } from 'react';

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------
export type Coordinates = {
  lat: number;
  lng: number;
};

export type Geofence = {
  name: string;
  type: 'point' | 'polygon';
  center?: Coordinates;
  radius_miles?: number;
  polygon?: Coordinates[];
};

// -----------------------------------------------------------------------------
// MATH HELPER: HAVERSINE DISTANCE (Miles)
// -----------------------------------------------------------------------------
function getDistanceMiles(pt1: Coordinates, pt2: Coordinates): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = (pt2.lat - pt1.lat) * (Math.PI / 180);
  const dLon = (pt2.lng - pt1.lng) * (Math.PI / 180);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(pt1.lat * (Math.PI / 180)) * Math.cos(pt2.lat * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// -----------------------------------------------------------------------------
// MATH HELPER: POINT IN POLYGON (Ray Casting)
// -----------------------------------------------------------------------------
function isPointInPolygon(pt: Coordinates, polygon: Coordinates[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat, yi = polygon[i].lng;
    const xj = polygon[j].lat, yj = polygon[j].lng;

    const intersect = ((yi > pt.lng) !== (yj > pt.lng)) &&
      (pt.lat < (xj - xi) * (pt.lng - yi) / (yj - yi) + xi);
      
    if (intersect) inside = !inside;
  }
  return inside;
}

// -----------------------------------------------------------------------------
// DATA FETCHING: LOAD GEOFENCES (Cached)
// -----------------------------------------------------------------------------
export const getGeofences = cache(async (): Promise<Geofence[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from('location_geofences').select('*');

  if (error || !data) {
    console.error('Failed to load geofences:', error);
    return [];
  }

  // Transform DB shape to Type shape
  return data.map((row) => ({
    name: row.name,
    type: row.type as 'point' | 'polygon',
    center: row.center_lat && row.center_lng ? { lat: row.center_lat, lng: row.center_lng } : undefined,
    radius_miles: row.radius_miles,
    polygon: row.polygon_coords ? (row.polygon_coords as any[]).map((p: any) => ({ lat: p.lat, lng: p.lon || p.lng })) : undefined
  }));
});

// -----------------------------------------------------------------------------
// MAIN FUNCTION: RESOLVE LOCATION
// -----------------------------------------------------------------------------
export async function resolveVehicleLocation(lat: number | null, lng: number | null): Promise<string> {
  if (!lat || !lng) return 'Unknown';

  // 1. Get definitions (This is cached by React, so it's fast)
  const geofences = await getGeofences();
  const pt = { lat, lng };

  // 2. Check strict Polygons first (e.g., Pismo Dunes boundary)
  const polygonMatch = geofences.find(g => g.type === 'polygon' && g.polygon && isPointInPolygon(pt, g.polygon));
  if (polygonMatch) return polygonMatch.name;

  // 3. Check Radius Points (e.g., Vegas Shop 2-mile radius)
  const pointMatch = geofences.find(g => 
    g.type === 'point' && 
    g.center && 
    g.radius_miles && 
    getDistanceMiles(pt, g.center) <= g.radius_miles
  );
  
  if (pointMatch) return pointMatch.name;

  return 'In Transit';
}