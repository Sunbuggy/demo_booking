/**
 * @file components/fleet/FleetIconProvider.tsx
 * @description CLIENT CONTEXT with SERVER HYDRATION.
 * Now accepts 'initialIcons' so data is available instantly (no loading state).
 */
'use client';

import React, { createContext, useContext, useState } from 'react';
import { AVAILABLE_ICONS } from '@/lib/fleet/icon-registry';
import { HelpCircle } from 'lucide-react';

// --- TYPES ---
type IconMap = Record<string, string>;

// --- CONTEXT ---
const FleetIconContext = createContext<IconMap>({});

// -----------------------------------------------------------------------------
// 1. THE PROVIDER COMPONENT
// -----------------------------------------------------------------------------
export const FleetIconProvider = ({ 
  children, 
  initialIcons = {} 
}: { 
  children: React.ReactNode, 
  initialIcons: IconMap 
}) => {
  // We initialize state with the data passed from the Server
  const [icons] = useState<IconMap>(initialIcons);

  return (
    <FleetIconContext.Provider value={icons}>
      {children}
    </FleetIconContext.Provider>
  );
};

// -----------------------------------------------------------------------------
// 2. THE CONSUMER COMPONENT (<FleetIcon />)
// -----------------------------------------------------------------------------
export const FleetIcon = ({ 
  type, 
  className,
  fallback = 'HelpCircle'
}: { 
  type: string, 
  className?: string,
  fallback?: string 
}) => {
  const iconMap = useContext(FleetIconContext);
  const normalizedType = (type || '').toLowerCase().trim();
  
  // RESOLUTION STRATEGY
  let iconValue = iconMap[normalizedType];

  // Fuzzy Match: Check if any DB key is inside the input string
  // (e.g. DB has 'buggy', Input is 'polaris buggy' -> Match)
  if (!iconValue) {
     const knownKey = Object.keys(iconMap).find(dbKey => normalizedType.includes(dbKey));
     if (knownKey) {
       iconValue = iconMap[knownKey];
     }
  }

  // CASE 1: CUSTOM UPLOAD (URL)
  if (iconValue && (iconValue.startsWith('http') || iconValue.startsWith('/'))) {
    return (
      <img 
        src={iconValue} 
        alt={type} 
        className={className} 
        style={{ objectFit: 'contain', display: 'inline-block' }} 
      />
    );
  }

  // CASE 2: STANDARD LIBRARY (Lucide)
  const IconComponent = AVAILABLE_ICONS[iconValue || fallback] || HelpCircle;
  return <IconComponent className={className} />;
};