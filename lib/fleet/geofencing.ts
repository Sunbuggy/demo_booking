/**
 * @file lib/fleet/geofencing.ts
 * @description Pure logic for mapping GPS coordinates to Named Locations.
 * FETCHES LIVE FROM DATABASE - NO HARDCODED OVERRIDES.
 * * FIX APPLIED: Added 'safeParsePolygon' to prevent crashes when DB returns JSON strings.
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
  id?: string;
  name: string;
  type: 'point' | 'polygon';
  center?: Coordinates;
  radius_miles?: number;
  polygon?: Coordinates[];
};

// -----------------------------------------------------------------------------
// DATA INTEGRITY HELPER (THE FIX)
// -----------------------------------------------------------------------------
/**
 * Safely parses polygon data from the database.
 * Handles:
 * 1. JSON Strings (e.g. "[{lat:...}]") -> Parses them
 * 2. Raw Arrays (e.g. [{lat:...}]) -> Validates them
 * 3. Null/Undefined -> Returns undefined
 */
function safeParsePolygon(data: any): Coordinates[] | undefined {
  if (!data) return undefined;

  let parsed = data;

  // 1. If it's a string, we MUST parse it before mapping
  if (typeof data === 'string') {
    try {
      parsed = JSON.parse(data);
    } catch (err) {
      console.error("❌ [Geofencing] JSON Parse Error on row:", err);
      return undefined;
    }
  }

  // 2. Ensure we have an array before mapping
  if (Array.isArray(parsed) && parsed.length > 0) {
    return parsed.map((p: any) => ({
      lat: Number(p.lat || p.latitude), // Handle generic variations
      lng: Number(p.lng || p.lon || p.longitude)
    }));
  }

  return undefined;
}

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
  
  // Ensure we select * to get the polygon_coords column
  const { data, error } = await supabase.from('location_geofences').select('*');

  if (error || !data) {
    console.error('Failed to load geofences:', error);
    return [];
  }

  // Transform DB shape to Type shape using the Safe Parser
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type as 'point' | 'polygon',
    center: row.center_lat && row.center_lng 
      ? { lat: row.center_lat, lng: row.center_lng } 
      : undefined,
    radius_miles: row.radius_miles,
    
    // 👇 THIS LINE WAS CRASHING - NOW PROTECTED
    polygon: safeParsePolygon(row.polygon_coords) 
  }));
});

// -----------------------------------------------------------------------------
// MAIN FUNCTION: RESOLVE LOCATION
// -----------------------------------------------------------------------------
export async function resolveVehicleLocation(lat: number | null, lng: number | null): Promise<string> {
  if (!lat || !lng) return 'Unknown';

  // 1. Get definitions (Cached)
  const geofences = await getGeofences();
  const pt = { lat, lng };

  // 2. Check strict Polygons first (Priority)
  const polygonMatch = geofences.find(g => 
    g.type === 'polygon' && 
    g.polygon && 
    isPointInPolygon(pt, g.polygon)
  );
  if (polygonMatch) return polygonMatch.name;

  // 3. Check Radius Points second
  const pointMatch = geofences.find(g => 
    g.type === 'point' && 
    g.center && 
    g.radius_miles && 
    getDistanceMiles(pt, g.center) <= g.radius_miles
  );
  
  if (pointMatch) return pointMatch.name;

  return 'In Transit';
}