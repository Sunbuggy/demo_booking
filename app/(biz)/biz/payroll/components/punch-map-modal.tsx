/**
 * PUNCH MAP MODAL
 * Path: app/(biz)/biz/payroll/components/punch-map-modal.tsx
 * Description: Wraps the focused PunchMapInner to display punch locations (In/Out) on a map.
 * * UPDATE:
 * - Added 'remountKey' to fix "Map container is already initialized" crash.
 * - Forces a fresh DOM node every time the modal opens.
 */

'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic'; 
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ExternalLink, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';

// Dynamic Import to prevent "window is not defined" error
const PunchMapInner = dynamic(() => import('./punch-map-inner'), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full bg-zinc-50 flex flex-col items-center justify-center text-zinc-400">
       <Loader2 className="w-8 h-8 animate-spin mb-2" />
       <p className="text-xs">Loading Map Engine...</p>
    </div>
  ),
});

interface PunchMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: any | null; 
}

export default function PunchMapModal({ isOpen, onClose, entry }: PunchMapModalProps) {
  // CRITICAL FIX: Unique key to force React to destroy/recreate the map DOM
  // whenever the modal opens or the entry data changes.
  const [remountKey, setRemountKey] = useState(0);

  useEffect(() => {
    if (isOpen && entry) {
      setRemountKey((prev) => prev + 1);
    }
  }, [isOpen, entry]);

  if (!entry) return null;

  // 1. TRANSFORM DATA
  const points = [];

  const fmtTime = (iso: string) => {
      try {
          return iso ? format(parseISO(iso), 'h:mm a') : '??';
      } catch (e) { return '??'; }
  };

  if (entry.clock_in_lat && entry.clock_in_lon) {
    points.push({
      id: `in-${entry.id}`,
      lat: entry.clock_in_lat,
      lng: entry.clock_in_lon,
      label: `IN: ${fmtTime(entry.start_time)}`,
      type: 'in' as const
    });
  }

  if (entry.clock_out_lat && entry.clock_out_lon) {
    points.push({
      id: `out-${entry.id}`,
      lat: entry.clock_out_lat,
      lng: entry.clock_out_lon,
      label: `OUT: ${fmtTime(entry.end_time)}`,
      type: 'out' as const
    });
  }

  const handleGoogleMaps = () => {
    if (entry.clock_in_lat && entry.clock_in_lon) {
      const url = `https://www.google.com/maps/search/?api=1&query=${entry.clock_in_lat},${entry.clock_in_lon}`;
      window.open(url, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[900px] p-0 overflow-hidden bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-white dark:bg-zinc-900 z-10 relative shadow-sm">
          <div>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="bg-orange-100 dark:bg-orange-900/20 p-1.5 rounded-full">
                 <MapPin className="w-5 h-5 text-orange-600" />
              </div>
              Punch Locations
            </DialogTitle>
            <p className="text-xs text-zinc-500 mt-1 ml-10">
              Visualizing GPS coordinates for this shift.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleGoogleMaps} className="gap-2 text-xs font-bold">
            Open Google Maps <ExternalLink className="w-3 h-3" />
          </Button>
        </div>

        {/* Map Container */}
        <div className="w-full h-[600px] relative bg-zinc-100 z-0">
            {points.length > 0 ? (
                // PASSING THE KEY HERE FORCES THE FIX
                <PunchMapInner key={remountKey} points={points} />
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                    <MapPin className="w-12 h-12 mb-2 opacity-20" />
                    <p>No GPS data recorded for this entry.</p>
                </div>
            )}
        </div>

      </DialogContent>
    </Dialog>
  );
}