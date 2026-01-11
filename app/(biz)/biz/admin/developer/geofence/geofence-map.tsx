'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface GeofenceMapProps {
  data: {
    lat: string;
    lng: string;
    radius: string;
    polygon_json: string;
  };
  activeType: 'point' | 'polygon';
}

export function GeofenceMap({ data, activeType }: GeofenceMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Map if not exists
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current).setView([36.1699, -115.1398], 10); // Default Vegas
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles © Esri',
        maxZoom: 18
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;

    // Clear previous layer
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    try {
      if (activeType === 'point') {
        const lat = parseFloat(data.lat);
        const lng = parseFloat(data.lng);
        const radiusMiles = parseFloat(data.radius);

        if (!isNaN(lat) && !isNaN(lng) && !isNaN(radiusMiles)) {
          // Convert Miles to Meters for Leaflet
          const radiusMeters = radiusMiles * 1609.34;
          
          layerRef.current = L.circle([lat, lng], {
            color: 'blue',
            fillColor: '#3b82f6',
            fillOpacity: 0.3,
            radius: radiusMeters
          }).addTo(map);

          map.setView([lat, lng], 13);
        }
      } else {
        // POLYGON MODE
        if (data.polygon_json) {
          const coords = JSON.parse(data.polygon_json);
          // Transform {lat,lng} objects to [lat,lng] arrays for Leaflet
          const polyPoints = coords.map((c: any) => [c.lat, c.lng]);
          
          layerRef.current = L.polygon(polyPoints, {
            color: 'purple',
            fillColor: '#a855f7',
            fillOpacity: 0.3
          }).addTo(map);
          
          // Fit bounds
          if (polyPoints.length > 0) {
            map.fitBounds((layerRef.current as L.Polygon).getBounds());
          }
        }
      }
    } catch (e) {
      // Ignore parse errors while typing
    }

    // Fix map size on render
    setTimeout(() => map.invalidateSize(), 100);

  }, [data, activeType]);

  return <div ref={mapContainerRef} className="w-full h-48 bg-zinc-100 dark:bg-zinc-800" />;
}