// @/config/smartwaiver.ts

export const WAIVER_TEMPLATES = {
  LAS_VEGAS: {
    locationName: 'Las Vegas Dunes',
    // Extracted from: https://waiver.smartwaiver.com/w/5f626a93dcaf9/web/
    templateId: '5f626a93dcaf9', 
    // Matches the 'location' field in your booking database
    requiredFor: ['Las Vegas', 'Valley of Fire', 'Amargosa', 'Nellis'],
  },
  PISMO_BEACH: {
    locationName: 'Pismo Beach',
    // Extracted from: https://waiver.smartwaiver.com/w/wpkw1sluqfrhrvbrgm7wwc/web/
    templateId: 'wpkw1sluqfrhrvbrgm7wwc', 
    requiredFor: ['Pismo Beach', 'Oceano Dunes'],
  },
  SILVER_LAKE: {
    locationName: 'Silver Lake',
    // Extracted from: https://waiver.smartwaiver.com/w/mtksajguqglfc68mrxkm2h/web/
    templateId: 'mtksajguqglfc68mrxkm2h', 
    requiredFor: ['Silver Lake', 'Michigan'],
  },
} as const;

export type LocationKey = keyof typeof WAIVER_TEMPLATES;