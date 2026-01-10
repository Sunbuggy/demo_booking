'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Default Icons
const icon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  shadowSize: [41, 41]
});

interface MapInnerProps {
  vehicles: any[];
}

const MapInner = ({ vehicles }: MapInnerProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // 1. Safety Check
    if (!mapContainerRef.current) return;

    // 2. NUCLEAR CLEANUP (The Fix for "Already Initialized")
    // We manually strip the internal Leaflet ID from the DOM element.
    // This tricks Leaflet into thinking it's a fresh <div>.
    // @ts-ignore
    if (mapContainerRef.current._leaflet_id) {
      // @ts-ignore
      mapContainerRef.current._leaflet_id = null;
    }

    // 3. Destroy previous instance if React kept it in memory
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // 4. Initialize Map
    try {
      const map = L.map(mapContainerRef.current).setView([36.278439, -115.020068], 5);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // 5. Add Markers
      vehicles.forEach((vehicle) => {
        if (vehicle.latitude && vehicle.longitude) {
          const marker = L.marker([vehicle.latitude, vehicle.longitude], { icon }).addTo(map);
          // Safety check for popup content
          const name = vehicle.pet_name || vehicle.name || 'Vehicle';
          const loc = vehicle.location_name || vehicle.type || 'Unknown';
          
          marker.bindPopup(`
            <div style="text-align:center; font-family: sans-serif;">
              <strong>${name}</strong><br/>
              <span style="font-size:12px; color:#666;">${loc}</span><br/>
              <a href="/biz/vehicles/${vehicle.id}" style="color:#2563eb;">View</a>
            </div>
          `);
        }
      });

      mapInstanceRef.current = map;

    } catch (err) {
      console.warn("Map Re-init warning:", err);
    }

    // 6. Cleanup on Unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [vehicles]);

  return <div ref={mapContainerRef} style={{ height: '100%', width: '100%', zIndex: 0 }} />;
};

export default MapInner;