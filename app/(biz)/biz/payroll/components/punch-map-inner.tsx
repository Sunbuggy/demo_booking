/**
 * PUNCH MAP INNER (Client Component)
 * Path: app/(biz)/biz/payroll/components/punch-map-inner.tsx
 * Description: A focused Leaflet map showing specific punch locations (Satellite View).
 * * FIXES:
 * - Robust Overlap Logic: Increased threshold to catch GPS drift (~50m).
 * - "Rabbit Ears" Layout: Uses CSS percentage transforms to guarantee label separation.
 */

'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet marker icons
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  label: string; 
  type: 'in' | 'out';
}

export default function PunchMapInner({ points }: { points: MapPoint[] }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    // @ts-ignore
    if (mapContainerRef.current._leaflet_id) return;
    if (mapInstanceRef.current) return;

    // 1. ROBUST OVERLAP DETECTION
    // We check if points are within ~50 meters of each other (0.0005 degrees)
    // This catches GPS drift inside the same building.
    let isOverlap = false;
    if (points.length === 2) {
      const latDiff = Math.abs(points[0].lat - points[1].lat);
      const lngDiff = Math.abs(points[0].lng - points[1].lng);
      if (latDiff < 0.0005 && lngDiff < 0.0005) {
        isOverlap = true;
      }
    }

    // 2. INITIALIZE MAP
    const defaultCenter: [number, number] = [36.1699, -115.1398];
    const initialCenter = points.length > 0 ? [points[0].lat, points[0].lng] : defaultCenter;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 16,
      zoomAnimation: false, 
      fadeAnimation: false,
      markerZoomAnimation: false
    });

    mapInstanceRef.current = map;

    // 3. SATELLITE TILES
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri',
      maxZoom: 19
    }).addTo(map);

    // 4. ADD MARKERS
    const bounds = L.latLngBounds([]);

    points.forEach(p => {
      const borderColor = p.type === 'in' ? 'border-green-500' : 'border-red-500';
      const textColor = p.type === 'in' ? 'text-green-600' : 'text-red-600';
      const zIndex = p.type === 'in' ? 100 : 90; // Green always on top if tight

      // --- DYNAMIC POSITIONING LOGIC ---
      // Standard: Centered horizontally, sitting above the point.
      // Overlap Green: Pushed entirely to the LEFT of the point.
      // Overlap Red: Pushed entirely to the RIGHT of the point.
      let containerStyle = `transform: translate(-50%, -100%);`; // Default Center
      let pointerStyle = `left: 50%; transform: translate(-50%, 0) rotate(45deg);`; // Default Center pointer

      if (isOverlap) {
        if (p.type === 'in') {
          // RABBIT EAR LEFT (Green)
          // Translate -100% (align right edge to center), move left 4px for gap
          containerStyle = `transform: translate(-100%, -100%) translateX(-4px);`;
          // Move pointer to bottom-right corner
          pointerStyle = `right: -6px; bottom: 0; transform: rotate(45deg);`; 
        } else {
          // RABBIT EAR RIGHT (Red)
          // Translate 0% (align left edge to center), move right 4px for gap
          containerStyle = `transform: translate(0%, -100%) translateX(4px);`; 
          // Move pointer to bottom-left corner
          pointerStyle = `left: -6px; bottom: 0; transform: rotate(45deg);`;
        }
      }

      // Custom HTML Icon
      const customIcon = L.divIcon({
        className: 'custom-map-icon', 
        html: `
          <div style="position: absolute; bottom: 0; left: 0; ${containerStyle} display: flex; flex-direction: column; align-items: center; width: max-content; z-index: ${zIndex};">
             
             <div class="bg-white/95 backdrop-blur-md border-2 ${borderColor} ${textColor} rounded-lg px-2.5 py-1.5 shadow-black/60 shadow-xl text-xs font-bold whitespace-nowrap">
               ${p.label}
             </div>

             <div class="w-3 h-3 bg-white/95 border-r-2 border-b-2 ${borderColor}" 
                  style="position: absolute; bottom: -6px; ${pointerStyle} background-clip: padding-box;">
             </div>

          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0] // We handle offsets via CSS
      });

      L.marker([p.lat, p.lng], { icon: customIcon })
        .addTo(map)
        .bindPopup(`
          <div class="text-center p-1">
            <strong class="block text-xs uppercase text-gray-500 mb-1">
                ${p.type === 'in' ? 'Clocked In' : 'Clocked Out'}
            </strong>
            <span class="text-sm font-bold">${p.label}</span>
          </div>
        `);
      
      bounds.extend([p.lat, p.lng]);
    });

    // 5. AUTO-ZOOM
    if (points.length > 0) {
      if (points.length === 1 || isOverlap) {
         // Super close zoom for overlaps so we can see the separation
         map.setView([points[0].lat, points[0].lng], 19); 
      } else {
         map.fitBounds(bounds, { padding: [80, 80], maxZoom: 18 });
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [points]); 

  return <div ref={mapContainerRef} className="h-full w-full z-0 bg-zinc-900" />;
}