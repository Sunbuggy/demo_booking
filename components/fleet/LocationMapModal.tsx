'use client';

import React, { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, MapPin, X } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet Default Icon
const icon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  shadowSize: [41, 41]
});

interface LocationMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationName: string;
  lat?: number | null;
  lng?: number | null;
}

export const LocationMapModal = ({ 
  isOpen, 
  onClose, 
  locationName, 
  lat, 
  lng 
}: LocationMapModalProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // Only run if modal is open and we have coords
    if (!isOpen || !lat || !lng) return;

    // 1. CLEANUP: Destroy any existing map instance to prevent duplicates
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // 2. DELAY: Wait for Modal Animation to finish (The Critical Fix)
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      try {
        // Initialize Map
        const map = L.map(mapContainerRef.current).setView([lat, lng], 18); // Zoom 18 for high detail

        // Satellite Layer (Esri World Imagery)
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles © Esri',
          maxZoom: 19
        }).addTo(map);

        // Optional: Hybrid Labels (Street Names overlay)
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 19
        }).addTo(map);

        // Add Marker
        L.marker([lat, lng], { icon })
          .addTo(map)
          .bindPopup(`<div style="font-weight:bold;">${locationName}</div>`)
          .openPopup();

        // FORCE RESIZE: Tells Leaflet "Hey, the container size changed, redraw yourself"
        map.invalidateSize();
        
        mapInstanceRef.current = map;
      } catch (err) {
        console.error("Map initialization error:", err);
      }
    }, 300); // 300ms delay to ensure modal is fully rendered

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, lat, lng, locationName]);

  const openGoogleMaps = () => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden bg-zinc-950 border-zinc-800 text-white gap-0">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-zinc-900 border-b border-zinc-800 z-10 relative">
          <div className="flex items-center gap-2">
            <MapPin className="text-blue-500 w-5 h-5" />
            <div>
              <h3 className="font-bold text-sm text-zinc-100">{locationName}</h3>
              <p className="text-xs text-zinc-400 font-mono">
                {lat?.toFixed(6)}, {lng?.toFixed(6)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="secondary" 
              size="sm" 
              className="gap-2 text-xs h-8 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700"
              onClick={openGoogleMaps}
            >
              <ExternalLink size={14} />
              Google Maps
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-zinc-400 hover:text-white"
              onClick={onClose}
            >
              <X size={18} />
            </Button>
          </div>
        </div>

        {/* Map Container */}
        <div className="relative w-full h-[500px] bg-zinc-900">
          {lat && lng ? (
             <div 
               ref={mapContainerRef} 
               className="w-full h-full z-0 outline-none" 
               // Inline style ensures height is present immediately
               style={{ minHeight: '500px' }}
             />
          ) : (
             <div className="w-full h-full flex items-center justify-center text-zinc-500">
               Invalid Coordinates
             </div>
          )}
        </div>
        
      </DialogContent>
    </Dialog>
  );
};