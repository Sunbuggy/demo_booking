/**
 * @file mapcomponent.tsx
 * @description The Gatekeeper.
 * 1. Disables SSR for the map (fixes "window is not defined").
 * 2. Manages the "Key" to force fresh instances (fixes "Container initialized").
 */
'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';

// Dynamically import the inner component.
// "ssr: false" is the magic switch that stops the build from breaking.
const MapInner = dynamic(() => import('./MapInner'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center text-slate-400">
      Loading Map Resources...
    </div>
  ),
});

interface MapComponentProps {
  vehicles: any[];
}

const MapComponent = ({ vehicles }: MapComponentProps) => {
  // We use a randomized key to force React to destroy the previous Map DOM node
  // whenever this component re-mounts (like switching tabs).
  const [mapKey, setMapKey] = useState<string>('');

  useEffect(() => {
    setMapKey(`map-session-${Math.random()}`);
  }, []);

  // Don't render anything until we have a key (Client Side only)
  if (!mapKey) {
    return <div className="h-[400px] w-full bg-slate-100 dark:bg-slate-800" />;
  }

  return (
    <div className="h-[400px] w-full relative z-0">
      <MapInner key={mapKey} vehicles={vehicles} />
    </div>
  );
};

export default MapComponent;