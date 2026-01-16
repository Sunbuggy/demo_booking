'use client';

import { useState, useEffect } from 'react';

export type PermissionState = 'granted' | 'denied' | 'prompt' | 'unknown';

export function useDevicePermissions() {
  const [camera, setCamera] = useState<PermissionState>('unknown');
  const [location, setLocation] = useState<PermissionState>('unknown');

  useEffect(() => {
    // SECURITY CHECK: Ensure we are in the browser
    if (typeof navigator === 'undefined' || !navigator.permissions) return;

    // 1. Check Camera
    // Note: 'camera' support varies by browser (Chrome/Edge support it, Safari/Firefox may not)
    navigator.permissions.query({ name: 'camera' as any })
      .then((status) => {
        setCamera(status.state as PermissionState);
        status.onchange = () => setCamera(status.state as PermissionState);
      })
      .catch(() => {
        // Fallback for browsers that don't support querying camera permission directly
        setCamera('unknown');
      });

    // 2. Check Geolocation
    navigator.permissions.query({ name: 'geolocation' })
      .then((status) => {
        setLocation(status.state as PermissionState);
        status.onchange = () => setLocation(status.state as PermissionState);
      })
      .catch(() => setLocation('unknown'));

  }, []);

  const combinedStatus: PermissionState = 
    (camera === 'denied' || location === 'denied') ? 'denied' :
    (camera === 'granted' && location === 'granted') ? 'granted' :
    'prompt';

  return { camera, location, combinedStatus };
}