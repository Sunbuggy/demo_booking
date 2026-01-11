/**
 * @file app/(biz)/biz/vehicles/layout.tsx
 * @description GLOBAL FLEET LAYOUT.
 * Wraps ALL vehicle pages (Admin, Details, History) with the Icon Provider.
 */
import React from 'react';
import { FleetIconProvider } from '@/components/fleet/FleetIconProvider';
import { getFleetIconSettings } from '@/app/actions/fleet-settings';

export default async function VehiclesLayout({ children }: { children: React.ReactNode }) {
  // 1. Fetch Settings on the Server (Fast & Secure)
  const settings = await getFleetIconSettings();
  
  // 2. Transform into a Map { 'buggy': 'CarFront', ... }
  const iconMap: Record<string, string> = {};
  if (settings) {
    settings.forEach((s: any) => {
      if (s.vehicle_type && s.icon_name) {
        iconMap[s.vehicle_type.toLowerCase()] = s.icon_name;
      }
    });
  }

  // 3. Pass data to Provider
  return (
    <FleetIconProvider initialIcons={iconMap}>
      {children}
    </FleetIconProvider>
  );
}