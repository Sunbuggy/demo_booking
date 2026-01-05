/**
 * src/lib/utils/auth-routing.ts
 * PURPOSE: 
 * Centralizes redirect logic. Maps legacy "Component Keys" to real URL paths.
 */

interface UserProfile {
  user_level: number;
  primary_work_location: string | null;
  homepage?: string | null;
}

function getLocationSlug(dbLocation: string | null): string {
  if (!dbLocation) return 'vegas';
  const normalized = dbLocation.toLowerCase().trim();
  if (normalized.includes('vegas')) return 'vegas';
  if (normalized.includes('pismo')) return 'pismo';
  if (normalized.includes('silver')) return 'silverlake';
  return 'vegas';
}

export function getPostLoginRedirect(profile: UserProfile): string {
  const { user_level, homepage, primary_work_location } = profile;
  const locationSlug = getLocationSlug(primary_work_location);

  // 1. PREFERENCE OVERRIDE (Level 300+)
  // If you specifically saved a homepage in the DB, we honor it.
  if (user_level >= 300 && homepage) {
    switch (homepage) {
      case 'BizPage':
        return `/biz/${locationSlug}`;
      case 'VehiclesManagementPage':
        return `/biz/vehicles/admin`;
      case 'UnsettledPage':
        if (user_level >= 800) return `/biz/reports`;
        break;
      case 'ChooseAdventure':
        return '/'; 
      default:
        break;
    }
  }

  // 2. DEFAULT LOGIC
  
  // REMOVED: The forced redirect for Admins to '/biz/admin'
  // if (user_level >= 900) return '/biz/admin'; 

  // CHANGED: Admins (950) now fall through to this logic.
  // They will land on the Dashboard for their primary location.
  if (user_level >= 300) {
    return `/biz/${locationSlug}`;
  }

  // 3. CUSTOMER / GUEST
  // If Level 100-299, stay on the root (or go to /my-bookings if you prefer)
  if (user_level >= 100) return '/'; 

  return '/';
}