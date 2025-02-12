import { Database } from '@/types_db';
import { VehicleType } from '../../../../page';

type VehicleLocation = Database['public']['Tables']['vehicle_locations']['Row'];

export const locationCoordinates = {
  vegasShop: { lat: 36.278439, lon: -115.020068 },
  pismoShop: { lat: 35.105821, lon: -120.63038 },
  nellis: [
    { lat: 36.288471, lon: -114.970005 },
    { lat: 36.316064, lon: -114.944085 }
  ],
  pismoBeach: { lat: 35.090735, lon: -120.629598 },
  silverlakeShop: { lat: 43.675239, lon: -86.472552 },
  silverlakeDunes: { lat: 43.686365, lon: -86.508345 }
};

const pismoBeachCoordinates = [
  { lat: 35.095288, lon: -120.63195 },
  { lat: 35.095301, lon: -120.621078 },
  { lat: 35.086092, lon: -120.63192 },
  { lat: 35.086167, lon: -120.61671 }
];

const pismoDunesCoordinates = [
  { lat: 35.085717, lon: -120.632317 },
  { lat: 35.091236, lon: -120.583693 },
  { lat: 35.020388, lon: -120.590649 },
  { lat: 35.022873, lon: -120.635966 }
];

const vofCoordinates = [
  { lat: 36.617272, lon: -114.48814 },
  { lat: 36.620518, lon: -114.526353 },
  { lat: 36.479769, lon: -114.583101 },
  { lat: 36.479083, lon: -114.514348 }
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

export function getLocationType(
  lat: number,
  lon: number,
  city?: string
): string {
  if (city) return city;
  if (isNearLocation(lat, lon, 'vegasShop')) return 'Vegas Shop';
  if (isNearLocation(lat, lon, 'pismoShop', 0.5)) return 'Pismo Shop';
  if (isNearLocation(lat, lon, 'nellis')) return 'Vegas Nellis';
  if (isPointInPolygon(lat, lon, vofCoordinates)) return 'Vegas Valley of fire';
  if (isPointInPolygon(lat, lon, pismoBeachCoordinates)) return 'Pismo Beach';
  if (isPointInPolygon(lat, lon, pismoDunesCoordinates)) return 'Pismo Dunes';
  if (isNearLocation(lat, lon, 'silverlakeShop')) return 'Silver Lake Shop';
  if (isNearLocation(lat, lon, 'silverlakeDunes', 0.25))
    return 'Silver Lake Dunes';

  return 'Unknown';
}

export function groupVehicles(vehicles: VehicleType[]): Record<
  string,
  {
    operational: number;
    broken: number;
    operationalIds: string[];
    brokenIds: string[];
  }
> {
  return vehicles.reduce(
    (acc, vehicle) => {
      if (!acc[vehicle.type]) {
        acc[vehicle.type] = {
          operational: 0,
          broken: 0,
          operationalIds: [],
          brokenIds: []
        };
      }
      if (vehicle.vehicle_status === 'broken') {
        acc[vehicle.type].broken++;
        acc[vehicle.type].brokenIds.push(vehicle.id);
      } else {
        acc[vehicle.type].operational++;
        acc[vehicle.type].operationalIds.push(vehicle.id);
      }
      return acc;
    },
    {} as Record<
      string,
      {
        operational: number;
        broken: number;
        operationalIds: string[];
        brokenIds: string[];
      }
    >
  );
}

export function groupVehiclesBySeatCount(
  vehicles: VehicleType[],
  vehicleType: string
): Record<
  string,
  {
    operational: number;
    broken: number;
    operationalIds: string[];
    brokenIds: string[];
  }
> {
  return vehicles
    .filter((v) => v.type === vehicleType)
    .reduce(
      (acc, vehicle) => {
        if (!acc[vehicle.seats]) {
          acc[vehicle.seats] = {
            operational: 0,
            broken: 0,
            operationalIds: [],
            brokenIds: []
          };
        }
        if (vehicle.vehicle_status === 'broken') {
          acc[vehicle.seats].broken++;
          acc[vehicle.seats].brokenIds.push(vehicle.id);
        } else {
          acc[vehicle.seats].operational++;
          acc[vehicle.seats].operationalIds.push(vehicle.id);
        }
        return acc;
      },
      {} as Record<
        string,
        {
          operational: number;
          broken: number;
          operationalIds: string[];
          brokenIds: string[];
        }
      >
    );
}

export function processVehicleLocations(
  vehicles: VehicleType[],
  vehicleLocations: VehicleLocation[]
): VehicleType[] {
  const latestVehicleLocations = vehicleLocations.reduce(
    (acc, location) => {
      if (
        location.vehicle_id &&
        (!acc[location.vehicle_id] ||
          acc[location.vehicle_id].created_at < location.created_at)
      ) {
        acc[location.vehicle_id] = location;
      }
      return acc;
    },
    {} as Record<string, VehicleLocation>
  );

  return vehicles.map((vehicle) => {
    const location = latestVehicleLocations[vehicle.id];
    return {
      ...vehicle,
      city:
        location && location.latitude && location.longitude
          ? getLocationType(
              location.latitude,
              location.longitude,
              location.city || ''
            )
          : 'No Location',
      latitude: location?.latitude,
      longitude: location?.longitude,
      location_created_at: location?.created_at
    };
  });
}

export function calculateAverageVehicleAge(vehicles: VehicleType[]): number {
  const currentYear = new Date().getFullYear();
  const totalAge = vehicles.reduce(
    (sum, vehicle) => sum + (currentYear - vehicle.year),
    0
  );
  return totalAge / vehicles.length;
}
