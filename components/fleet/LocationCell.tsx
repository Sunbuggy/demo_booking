'use client';

import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

// 1. DYNAMIC IMPORT (The Fix)
// We lazy-load the modal and disable SSR. 
// This prevents Leaflet from running on the server and crashing the app.
const LocationMapModal = dynamic(
  () => import('./LocationMapModal').then((mod) => mod.LocationMapModal),
  { ssr: false }
);

interface LocationCellProps {
  name: string;
  lat?: number | null;
  lng?: number | null;
  className?: string;
  iconClassName?: string;
}

export const LocationCell = ({ 
  name, 
  lat, 
  lng, 
  className,
  iconClassName 
}: LocationCellProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const isClickable = !!(lat && lng);

  return (
    <>
      <div 
        onClick={(e) => {
          if (isClickable) {
            e.stopPropagation(); 
            setIsOpen(true);
          }
        }}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 border",
          isClickable 
            ? "cursor-pointer bg-white border-zinc-200 text-zinc-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-blue-700 dark:hover:bg-blue-900/30 dark:hover:text-blue-400" 
            : "cursor-default border-transparent bg-transparent pl-0 text-zinc-400",
          className
        )}
        title={isClickable ? "View on Map" : "Location unknown"}
      >
        <MapPin 
          className={cn(
            "w-3 h-3 shrink-0", 
            isClickable ? "text-zinc-400 group-hover:text-current" : "text-zinc-300", 
            iconClassName
          )} 
        />
        <span className="truncate max-w-[140px]">
          {name || 'Unknown'}
        </span>
      </div>

      {/* 2. CONDITIONAL RENDER
         Only render the modal if it's clickable. 
         Since it's dynamic, the code won't even download until this line runs.
      */}
      {isClickable && isOpen && (
        <LocationMapModal 
          isOpen={isOpen} 
          onClose={() => setIsOpen(false)} 
          locationName={name}
          lat={lat}
          lng={lng}
        />
      )}
    </>
  );
};