// utils/date-helpers.ts
import { format, parseISO } from 'date-fns';

/**
 * SUNBUGGY STANDARD: DATE FORMATTING
 * Purpose: Centralize date logic to prevent hydration errors and UTC mismatches.
 * * @param dateString - The ISO date string from Supabase (e.g., "2026-01-05T18:31:00Z")
 * @returns string - Formatted date for UI (e.g., "Jan 5, 2026")
 */
export const formatDateForDisplay = (dateString: string | null): string => {
  if (!dateString) return 'N/A';

  // CRITICAL: Next.js Hydration protection. 
  // Ensure we parse the string consistently on Server and Client.
  try {
    const date = parseISO(dateString);
    return format(date, 'MMM d, yyyy'); // Example: "Jan 5, 2026"
  } catch (error) {
    console.error("Date parsing error:", error);
    return dateString; // Fallback to raw string if fail
  }
};

/**
 * SUNBUGGY STANDARD: ROSTER COMPARISON
 * Reference: Architecture PDF "CRITICAL: All date comparisons use .substring(0,10)"
 * * @param dateA - ISO String
 * @param dateB - ISO String
 * @returns boolean
 */
export const isSameRosterDate = (dateA: string, dateB: string): boolean => {
  if (!dateA || !dateB) return false;
  // Strict string comparison avoids Timezone math entirely
  return dateA.substring(0, 10) === dateB.substring(0, 10);
};