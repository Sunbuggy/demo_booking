import {
  getVehicleIdFromName,
  recordVehicleLocation
} from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

function getAllowedOrigin(request: NextRequest): string {
  const origin = request.headers.get('origin') ?? '';
  const allowedOrigins = [
    'https://sunbuggy.biz',
    'https://www.sunbuggy.biz',
    'https://sunbuggy.com',
    'https://www.sunbuggy.com',
    'https://book.sunbuggy.com'
  ];

  return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const veh = decodeURIComponent(searchParams.get('veh') || '');
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const supabase = await createClient();

  //   const list_of_sms_recipients = ['+17028072598', '+17024263318'];

  if (!veh || !lat || !lon) {
    console.error('Missing veh, lat, or lon query parameter');
    return NextResponse.json(
      {
        error: 'Missing veh, lat, or lon query parameter'
      },
      {
        headers: {
          'Access-Control-Allow-Origin': getAllowedOrigin(req),
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    );
  }
  const ammendedVeh = veh.match(/^[0-9]+$/) ? `sb${veh}` : veh;
  console.log('Ammended veh:', ammendedVeh);
  let vehicleId: string;
  try {
    const res = await getVehicleIdFromName(supabase, ammendedVeh);
    vehicleId = res[0].id as string;
  } catch (err) {
    console.error('Error getting vehicle ID:', err);
    return NextResponse.json(
      {
        error: 'Error getting vehicle ID'
      },
      {
        headers: {
          'Access-Control-Allow-Origin': getAllowedOrigin(req),
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    );
  }

  const created_at = new Date().toISOString();
  const preDefinedLocation = getLocationType(parseFloat(lat), parseFloat(lon));

  let city: string;
  if (preDefinedLocation === 'Unknown') {
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${parseFloat(lat)}&longitude=${parseFloat(lon)}&localityLanguage=en`
      );
      const data = await response.json();
      city = data.city;
    } catch (err) {
      console.error('Error fetching city:', err);
      return NextResponse.json(
        {
          error: 'Error fetching city'
        },
        {
          headers: {
            'Access-Control-Allow-Origin': getAllowedOrigin(req),
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          }
        }
      );
    }
  } else {
    city = preDefinedLocation;
  }

  try {
    await recordVehicleLocation(supabase, {
      vehicle_id: vehicleId,
      latitude: parseFloat(lat),
      longitude: parseFloat(lon),
      created_at: created_at,
      city: city,
      is_distress_signal: true
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Vehicle location recorded successfully'
      },
      {
        headers: {
          'Access-Control-Allow-Origin': getAllowedOrigin(req),
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    );
  } catch (err) {
    console.error('Error recording vehicle location:', err);
    return NextResponse.json(
      {
        error: 'Error recording vehicle location'
      },
      {
        headers: {
          'Access-Control-Allow-Origin': getAllowedOrigin(req),
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    );
  }
}

export async function OPTIONS(req: NextRequest) {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': getAllowedOrigin(req),
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    }
  );
}

const locationCoordinates = {
  vegasShop: { lat: 36.278439, lon: -115.020068 },
  pismoShop: { lat: 35.105821, lon: -120.63038 },
  nellis: [
    { lat: 36.288471, lon: -114.970005 },
    { lat: 36.316064, lon: -114.944085 }
  ],
  silverlakeShop: { lat: 43.675239, lon: -86.472552 },
  silverlakeDunes: { lat: 43.686365, lon: -86.508345 }
};

const pismoBeachCoordinates = [
  { lat: 35.095288, lon: -120.63195 },
  { lat: 35.095301, lon: -120.621078 },
  { lat: 35.086092, lon: -120.63192 },
  { lat: 35.086167, lon: -120.61671 }
];
const vofCoordinates = [
  { lat: 36.617272, lon: -114.48814 },
  { lat: 36.620518, lon: -114.526353 },
  { lat: 36.479769, lon: -114.583101 },
  { lat: 36.479083, lon: -114.514348 }
];
const pismoDunesCoordinates = [
  { lat: 35.085717, lon: -120.632317 },
  { lat: 35.091236, lon: -120.583693 },
  { lat: 35.020388, lon: -120.590649 },
  { lat: 35.022873, lon: -120.635966 }
];

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

function getDistanceFromLatLonInMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function isPointInPolygon(
  lat: number,
  lon: number,
  coordinates: { lat: number; lon: number }[]
): boolean {
  let inside = false;
  for (let i = 0, j = coordinates.length - 1; i < coordinates.length; j = i++) {
    const xi = coordinates[i].lat,
      yi = coordinates[i].lon;
    const xj = coordinates[j].lat,
      yj = coordinates[j].lon;

    const intersect =
      yi > lon !== yj > lon && lat < ((xj - xi) * (lon - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function isBetweenCoordinates(
  lat: number,
  lon: number,
  coordinates: { lat: number; lon: number }[]
): boolean {
  return isPointInPolygon(lat, lon, coordinates);
}

function isNearLocation(
  lat: number,
  lon: number,
  location: keyof typeof locationCoordinates,
  setDistance: number = 2
): boolean {
  const coordinates = locationCoordinates[location];
  if (Array.isArray(coordinates)) {
    return coordinates.some(
      (coord) =>
        getDistanceFromLatLonInMiles(lat, lon, coord.lat, coord.lon) <=
        setDistance
    );
  }
  return (
    getDistanceFromLatLonInMiles(lat, lon, coordinates.lat, coordinates.lon) <=
    setDistance
  );
}

function getLocationType(lat: number, lon: number): string {
  if (isNearLocation(lat, lon, 'vegasShop')) return 'Vegas Shop';
  if (isNearLocation(lat, lon, 'pismoShop', 0.5)) return 'Pismo Shop';
  if (isNearLocation(lat, lon, 'nellis')) return 'Vegas Nellis';
  if (isBetweenCoordinates(lat, lon, pismoBeachCoordinates))
    return 'Pismo Beach';
  if (isBetweenCoordinates(lat, lon, pismoDunesCoordinates))
    return 'Pismo Dunes';
  if (isNearLocation(lat, lon, 'silverlakeShop')) return 'Silver Lake Shop';
  if (isNearLocation(lat, lon, 'silverlakeDunes', 0.25))
    return 'Silver Lake Dunes';
  if (isBetweenCoordinates(lat, lon, vofCoordinates))
    return 'Vegas Valley of fire';

  return 'Unknown';
}
