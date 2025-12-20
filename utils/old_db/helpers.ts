// utils/old_db/helpers.ts
// This file contains all helper functions used by the internal Vegas operations dashboard (/biz/* routes).
// These functions process raw reservation data fetched from the LEGACY database (reservations_modified view via fetch_from_old_db).
//
// KEY CHANGES FOR FEATURE BRANCH COMPATIBILITY:
// - getTimeSortedData was previously grouping by transformed sch_time (e.g., "8:00 AM") and then by location.
//   This broke the Vegas board because legacy records have no meaningful 'location' field (it's used for tour type like 'DunesATV').
// - We now revert to grouping by raw hour (e.g., "08") as the outer key — this matches the original main branch behavior and the expectations of Landing.tsx and HourCard components.
// - Inner grouping uses a safe locationKey fallback to 'vegas' for legacy records.
// - changeLocation() is preserved (used for display of tour name in cards).
// - All required exports (countPeople, getVehicleCount, vehiclesList, getTimeSortedData) are present and correctly implemented.
// - No changes to old DB queries or connections — Vegas ops remain 100% on legacy DB.

import { Reservation } from '@/app/(biz)/biz/types';
import { UserType } from '@/app/(biz)/biz/users/types';

/**
 * Safely extracts the hour portion from the reservation time field.
 * Legacy format: sch_time or time = "08:00" or "14:00"
 * Returns "08", "14", etc. — used as the primary grouping key for HourCards.
 */
function getHourFromTime(reservation: Reservation): string {
  const timeStr = String(reservation.sch_time || reservation.time || '00:00');
  return timeStr.split(':')[0].padStart(2, '0'); // Ensures "08" instead of "8"
}

/**
 * Transforms the raw tour code (e.g., 'DunesATV') into a human-readable tour name.
 * Used for display in HourCard titles and reservation details.
 * Preserved exactly as on main — no changes needed for Vegas.
 */
function changeLocation(data: Reservation[]) {
  const with_location = data?.map((itm) => {
    let location = itm.location;
    switch (location) {
      case 'Nellis30':
        location = 'Mini Baja X (30 min)';
        break;
      case 'Nellis60':
        location = 'Mini Baja XX (60 min)';
        break;
      case 'Nellis':
        location = 'Mini Baja (90 min)';
        break;
      case 'NellisDX':
        location = 'Mini Baja XXX (120 min)';
        break;
      case 'FamilyFun':
        location = 'Family Fun XX';
        break;
      case 'NellisTram60':
        location = 'Nellis Tram XX (60 min)';
        break;
      case 'DunesRZR30':
        location = 'Dunes RZR X (30 min)';
        break;
      case 'DunesRZR':
        location = 'Dunes RZR XX (60 min)';
        break;
      case 'DunesATV30':
        location = 'Dunes ATV X (30 min)';
        break;
      case 'DunesATV':
        location = 'Dunes ATV XX (60 min)';
        break;
      case 'DuneATVpack':
        location = 'ATV XL pack (60 min)';
        break;
      case 'DuneATVpack30':
        location = 'ATV XL Intro pack (30 min)';
        break;
      case 'DunesUTV30':
        location = 'Dunes UTV X (30 min)';
        break;
      case 'Dakar':
        location = 'Mini-Dakar XX';
        break;
      case 'Amargosa':
        location = 'Amargosa';
        break;
      case 'Valley':
        location = 'Valley Of Fire';
        break;
      case 'TerraDrift':
        location = 'Terra Drift';
        break;
      case 'DuneDrift':
        location = 'Dune-n-Drift';
        break;
      case 'NellisDunes30':
        location = 'Nellis Dunes X (30 min)';
        break;
      case 'NellisDunes60':
        location = 'Nellis Dunes XX (60 min)';
        break;
      case 'NellisDunes':
        location = 'Nellis Dunes XXX (90 min)';
        break;
      case 'NellisAD30':
        location = 'Mini Baja AD X (30 min)';
        break;
      case 'RZR_valley':
        location = 'RZR Valley';
        break;
      case 'TrackBaja1':
        location = 'Track-n-Baja XX (60 min)';
        break;
      case 'TrackBaja2':
        location = 'Track-n-Baja (120 min)';
        break;
      case 'TrackBaja3':
        location = 'Track-n-Baja (180 min)';
        break;
      case 'TrackBaja4':
        location = 'Track-n-Baja (240 min)';
        break;
      case 'GoKart':
        location = 'Go Karts (10 min)';
        break;
      case 'TrashPatrol':
        location = 'Trash Patrol (120 min)';
        break;
      case 'comboBajaATV':
        location = 'Dunes Combos (ATV 60min + m.baja 30min)';
        break;
      case 'DunesATVFR':
        location = 'Dunes ATV Free Roam XX';
        break;
      default:
        break;
    }
    return {
      ...itm,
      location
    };
  });
  return with_location;
}

/**
 * Primary grouping function for the Vegas dashboard.
 * 
 * Expected return format by Landing.tsx and HourCard:
 *   Record<string, Record<string, Reservation[]>>   → { hour: { locationKey: Reservation[] } }
 * 
 * Fix details:
 * - Groups by raw hour ("08", "09", etc.) — matches original main branch behavior and HourCard keys.
 * - Applies changeLocation() for human-readable tour names.
 * - Uses safe locationKey: explicit location if present (future-proof for Pismo), otherwise 'vegas' fallback.
 * - Legacy Vegas records (no location field) → all grouped under 'vegas' key → displays correctly.
 * 
 * @param data Raw reservations from old DB
 * @returns Nested grouped data ready for Landing component
 */
export function getTimeSortedData(data: Reservation[]): Record<string, Record<string, Reservation[]>> {
  // Early return empty object if no data — prevents rendering issues
  if (data.length === 0) {
    return {};
  }

  // Apply human-readable tour names
  const dataWithDisplayLocation = changeLocation(data);

  const grouped: Record<string, Record<string, Reservation[]>> = {};

  dataWithDisplayLocation.forEach((reservation) => {
    const hour = getHourFromTime(reservation);

    // Safe location key for inner grouping
    // Legacy records have no meaningful location → default to 'vegas'
    // Future Pismo records can have actual 'pismo' value
    const locationKey = reservation.location || 'vegas';

    if (!grouped[hour]) {
      grouped[hour] = {};
    }
    if (!grouped[hour][locationKey]) {
      grouped[hour][locationKey] = [];
    }

    grouped[hour][locationKey].push(reservation);
  });

  return grouped;
}

/**
 * List of all vehicle column keys from the legacy reservations_modified table.
 * Used to calculate totals and build the vehicle summary string (e.g., "8-QA, 6-SB2").
 */
export const vehiclesList = [
  'QA',
  'QB',
  'QU',
  'QL',
  'SB1',
  'SB2',
  'SB4',
  'SB5',
  'SB6',
  'twoSeat4wd',
  'UZ2',
  'UZ4',
  'RWG',
  'GoKartplus',
  'GoKart'
] as const;

/**
 * Calculates the total number of vehicles booked in a single reservation.
 * Used for vehicle summary and availability calculations.
 */
export const getVehicleCount = (reservation: Reservation): number => {
  return vehiclesList.reduce((acc, key) => {
    return acc + Number(reservation[key as keyof Reservation] || 0);
  }, 0);
};

/**
 * Returns the total number of people (passengers) in a reservation.
 * Legacy DB stores this pre-calculated in ppl_count column.
 */
export const countPeople = (reservation: Reservation): number => {
  return Number(reservation.ppl_count || 0);
};

/**
 * Utility to filter and slightly modify employee user list for dashboard display.
 * Not used in reservation processing — kept unchanged.
 */
export function transformEmplyees(users: UserType[]) {
  const employees = users.filter((user) => user.user_level > 249);
  employees.forEach((user) => {
    if (user.id === 'e27026d4-79ef-4efd-a9e9-a9a12c0edbd8') {
      user.user_level = 900;
    }
  });
  return employees;
}