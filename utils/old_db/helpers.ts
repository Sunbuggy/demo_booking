// utils/old_db/helpers.ts

import { Reservation } from '@/app/(biz)/biz/types';
import { UserType } from '@/app/(biz)/biz/users/types';

/**
 * Safely extracts the hour portion from the reservation time field.
 * Legacy format: sch_time or time = "08:00" or "14:00"
 * * CRITICAL FIX FOR SORTING:
 * We deliberately return the hour WITHOUT padding (e.g., "8" instead of "08").
 * * Why?
 * JavaScript engines (V8) separate object keys into "Indices" (integers) and "Properties" (strings).
 * Indices are always sorted first. Strings are sorted second (insertion order).
 * - "10" and "12" are valid indices (Integers).
 * - "08" is NOT a valid index (it has a leading zero), so it is treated as a String.
 * * Result with padding: ["10", "12", "08"] (Indices first, then Strings).
 * Result without padding: ["8", "10", "12"] (All indices, sorted numerically).
 */
function getHourFromTime(reservation: Reservation): string {
  // Cast to 'any' to allow checking the legacy 'time' field
  const timeStr = String(reservation.sch_time || (reservation as any).time || '00:00');
  const hour = timeStr.split(':')[0];
  
  // Return integer-string (e.g. "8", "10") by parsing and stringifying.
  // This removes any accidental leading zeros from the source data too.
  return String(parseInt(hour, 10)); 
}

/**
 * Transforms the raw tour code (e.g., 'DunesATV') into a human-readable tour name.
 * Preserved exactly as on main — no changes needed for Vegas.
 */
function changeLocation(data: Reservation[]) {
  const with_location = data?.map((itm) => {
    let location = itm.location;
    switch (location) {
      case 'Nellis30': location = 'Mini Baja X (30 min)'; break;
      case 'Nellis60': location = 'Mini Baja XX (60 min)'; break;
      case 'Nellis': location = 'Mini Baja (90 min)'; break;
      case 'NellisDX': location = 'Mini Baja XXX (120 min)'; break;
      case 'FamilyFun': location = 'Family Fun XX'; break;
      case 'NellisTram60': location = 'Nellis Tram XX (60 min)'; break;
      case 'DunesRZR30': location = 'Dunes RZR X (30 min)'; break;
      case 'DunesRZR': location = 'Dunes RZR XX (60 min)'; break;
      case 'DunesATV30': location = 'Dunes ATV X (30 min)'; break;
      case 'DunesATV': location = 'Dunes ATV XX (60 min)'; break;
      case 'DuneATVpack': location = 'ATV XL pack (60 min)'; break;
      case 'DuneATVpack30': location = 'ATV XL Intro pack (30 min)'; break;
      case 'DunesUTV30': location = 'Dunes UTV X (30 min)'; break;
      case 'Dakar': location = 'Mini-Dakar XX'; break;
      case 'Amargosa': location = 'Amargosa'; break;
      case 'Valley': location = 'Valley Of Fire'; break;
      case 'TerraDrift': location = 'Terra Drift'; break;
      case 'DuneDrift': location = 'Dune-n-Drift'; break;
      case 'NellisDunes30': location = 'Nellis Dunes X (30 min)'; break;
      case 'NellisDunes60': location = 'Nellis Dunes XX (60 min)'; break;
      case 'NellisDunes': location = 'Nellis Dunes XXX (90 min)'; break;
      case 'NellisAD30': location = 'Mini Baja AD X (30 min)'; break;
      case 'RZR_valley': location = 'RZR Valley'; break;
      case 'TrackBaja1': location = 'Track-n-Baja XX (60 min)'; break;
      case 'TrackBaja2': location = 'Track-n-Baja (120 min)'; break;
      case 'TrackBaja3': location = 'Track-n-Baja (180 min)'; break;
      case 'TrackBaja4': location = 'Track-n-Baja (240 min)'; break;
      case 'GoKart': location = 'Go Karts (10 min)'; break;
      case 'TrashPatrol': location = 'Trash Patrol (120 min)'; break;
      case 'comboBajaATV': location = 'Dunes Combos (ATV 60min + m.baja 30min)'; break;
      case 'DunesATVFR': location = 'Dunes ATV Free Roam XX'; break;
      default: break;
    }
    return { ...itm, location };
  });
  return with_location;
}

/**
 * Primary grouping function for the Vegas dashboard.
 * Now using integer-style keys ("8", "10") to force correct V8 engine sorting.
 */
export function getTimeSortedData(data: Reservation[]): Record<string, Record<string, Reservation[]>> {
  if (data.length === 0) {
    return {};
  }

  const dataWithDisplayLocation = changeLocation(data);
  const grouped: Record<string, Record<string, Reservation[]>> = {};

  dataWithDisplayLocation.forEach((reservation) => {
    // Returns "8", "10", "12" etc.
    const hour = getHourFromTime(reservation); 
    const locationKey = reservation.location || 'vegas';

    if (!grouped[hour]) {
      grouped[hour] = {};
    }
    if (!grouped[hour][locationKey]) {
      grouped[hour][locationKey] = [];
    }
    grouped[hour][locationKey].push(reservation);
  });

  // Explicit Sort Step (Safety Check)
  // Even though removing '0' padding fixes the V8 engine behavior, 
  // we keep this explicit sort to guarantee the return object is built in the right order.
  const sortedKeys = Object.keys(grouped).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  
  const sortedGrouped: Record<string, Record<string, Reservation[]>> = {};
  sortedKeys.forEach((key) => {
    sortedGrouped[key] = grouped[key];
  });

  return sortedGrouped;
}

/**
 * List of all vehicle column keys from the legacy reservations_modified table.
 */
export const vehiclesList = [
  'QA', 'QB', 'QU', 'QL', 'SB1', 'SB2', 'SB4', 'SB5', 'SB6',
  'twoSeat4wd', 'UZ2', 'UZ4', 'RWG', 'GoKartplus', 'GoKart'
] as const;

export const getVehicleCount = (reservation: Reservation): number => {
  return vehiclesList.reduce((acc, key) => {
    return acc + Number(reservation[key as keyof Reservation] || 0);
  }, 0);
};

export const countPeople = (reservation: Reservation): number => {
  return Number(reservation.ppl_count || 0);
};

export function transformEmplyees(users: UserType[]) {
  const employees = users.filter((user) => user.user_level > 249);
  employees.forEach((user) => {
    if (user.id === 'e27026d4-79ef-4efd-a9e9-a9a12c0edbd8') {
      user.user_level = 900;
    }
  });
  return employees;
}