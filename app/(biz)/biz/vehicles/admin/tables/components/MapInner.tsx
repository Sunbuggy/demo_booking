'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Icons
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
  // We use a ref to hold the DOM element
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // We use a ref to hold the Leaflet Instance so we can destroy it later
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // 1. Safety Check
    if (!mapContainerRef.current) return;

    // 2. CLEANUP: If a map already exists, destroy it immediately.
    // This is the line that fixes your error.
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // 3. INITIALIZE: Create the map
    const map = L.map(mapContainerRef.current).setView([36.278439, -115.020068], 5);
    
    // Add Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // 4. Add Markers
    vehicles.forEach((vehicle) => {
      if (vehicle.latitude && vehicle.longitude) {
        const marker = L.marker([vehicle.latitude, vehicle.longitude], { icon })
          .addTo(map);
        
        // Add Popup
        const popupContent = `
          <div style="text-align:center;">
            <strong>${vehicle.pet_name || vehicle.name}</strong><br/>
            <span style="color:#666; font-size:12px;">${vehicle.type}</span><br/>
            <a href="/biz/vehicles/${vehicle.id}" style="color:#3b82f6; text-decoration:underline;">View Details</a>
          </div>
        `;
        marker.bindPopup(popupContent);
      }
    });

    // Save instance to ref
    mapInstanceRef.current = map;

    // 5. UNMOUNT HANDLER
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [vehicles]); // Re-run if vehicles change

  return (
    <div 
      ref={mapContainerRef} 
      style={{ height: '400px', width: '100%', zIndex: 0 }} 
    />
  );
};

export default MapInner;