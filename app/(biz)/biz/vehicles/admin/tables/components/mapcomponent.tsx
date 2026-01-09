'use client';

import dynamic from 'next/dynamic';
import React, { useState, useEffect } from 'react';

// Dynamic Import is CRITICAL.
// It stops the "window is not defined" error and ensures CSS loads only in the browser.
const MapInner = dynamic(() => import('./MapInner'), {
  ssr: false, // This disables server-side rendering for the map entirely
  loading: () => (
    <div className="h-[400px] w-full bg-slate-100 dark:bg-zinc-900 flex items-center justify-center text-slate-400">
      Loading Map...
    </div>
  ),
});

interface MapComponentProps {
  vehicles: any[];
}

const MapComponent = ({ vehicles }: MapComponentProps) => {
  // We use a unique key to force React to completely destroy/recreate 
  // the component when the tab changes.
  const [mapKey, setMapKey] = useState<string>('');

  useEffect(() => {
    setMapKey(`map-${Math.random()}`);
  }, []);

  if (!mapKey) return <div className="h-[400px] bg-slate-50" />;

  return (
    <div className="h-[400px] w-full relative z-0 border rounded-md overflow-hidden">
      <MapInner key={mapKey} vehicles={vehicles} />
    </div>
  );
};

export default MapComponent;