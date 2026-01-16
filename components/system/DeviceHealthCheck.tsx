'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Camera, MapPin, Wifi, RefreshCw, Info, MousePointerClick } from 'lucide-react'; 
import { cn } from '@/lib/utils'; 

type Status = 'unknown' | 'granted' | 'denied' | 'prompt' | 'error';

export default function DeviceHealthCheck() {
  const [cameraStatus, setCameraStatus] = useState<Status>('unknown');
  const [geoStatus, setGeoStatus] = useState<Status>('unknown');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    checkConnectivity();
    performPassiveChecks();
  }, []);

  const checkConnectivity = () => {
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
  };

  const performPassiveChecks = async () => {
    if (typeof navigator === 'undefined') return;
    try {
      const geoPermission = await navigator.permissions.query({ name: 'geolocation' });
      setGeoStatus(geoPermission.state as Status);
      geoPermission.onchange = () => setGeoStatus(geoPermission.state as Status);
    } catch (e) {
      console.warn("Passive Geo check not supported", e);
    }
  };

  const requestCamera = async () => {
    setCameraStatus('unknown');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStatus('granted');
      stream.getTracks().forEach(track => track.stop());
    } catch (error: any) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setCameraStatus('denied');
      } else {
        setCameraStatus('error');
      }
    }
    setLastChecked(new Date());
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('error');
      return;
    }
    setGeoStatus('unknown');
    navigator.geolocation.getCurrentPosition(
      () => {
        setGeoStatus('granted');
        setLastChecked(new Date());
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) setGeoStatus('denied');
        else setGeoStatus('error');
        setLastChecked(new Date());
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Helper to render semantic status badges
  const renderStatus = (status: Status) => {
    switch (status) {
      case 'granted':
        return (
          <div className="flex items-center text-green-600 dark:text-green-400 font-bold bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
            <CheckCircle2 className="w-5 h-5 mr-2" />
            <span>READY</span>
          </div>
        );
      case 'denied':
        return (
          <div className="flex items-center text-destructive font-bold bg-destructive/10 px-3 py-1 rounded-full border border-destructive/20 animate-pulse">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>BLOCKED</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>ERROR</span>
          </div>
        );
      default:
        return (
          <div className="text-muted-foreground font-medium italic">
            Needs Check
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-6 bg-card text-card-foreground rounded-xl shadow-lg border border-border">
      
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-black uppercase tracking-tight">
          Device Checkup
        </h2>
        <p className="text-sm text-muted-foreground">
          Ensure your device is ready for SunBuggy.
        </p>
      </div>

      <div className="space-y-4">
        
        {/* 1. INTERNET CHECK */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-full text-blue-600 dark:text-blue-400">
              <Wifi className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold">Connectivity</div>
              <div className="text-xs text-muted-foreground">Network connection</div>
            </div>
          </div>
          <div>
            {isOnline ? renderStatus('granted') : renderStatus('error')}
          </div>
        </div>

        {/* 2. CAMERA CHECK */}
        <div className="flex flex-col p-3 rounded-lg bg-muted/40 border border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-full text-orange-600 dark:text-orange-400">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold">Camera Access</div>
                <div className="text-xs text-muted-foreground">Required for Scanning</div>
              </div>
            </div>
            {renderStatus(cameraStatus)}
          </div>
          
          {cameraStatus !== 'granted' && (
            <div className="space-y-3">
              {/* COACHING TEXT */}
              <div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs p-2 rounded flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                   When prompted, please select <strong>"While using the app"</strong> or <strong>"Allow on every visit"</strong> to avoid repeated requests.
                </span>
              </div>

              <button
                onClick={requestCamera}
                className="w-full py-3 bg-primary text-primary-foreground hover:opacity-90 font-bold rounded-lg shadow transition-all flex justify-center items-center gap-2"
              >
                <MousePointerClick className="w-4 h-4" />
                {cameraStatus === 'denied' ? 'Retry Camera Permission' : 'Tap to Allow Camera'}
              </button>
            </div>
          )}

          {cameraStatus === 'denied' && (
            <div className="mt-2 text-xs text-destructive bg-destructive/10 p-2 rounded border border-destructive/20">
              <strong>Action Required:</strong> Browser blocked camera. Tap <span className="font-bold">"Aa"</span> or <span className="font-bold">lock icon</span> &rarr; <strong>Website Settings</strong> &rarr; Camera &rarr; <strong>Allow</strong>.
            </div>
          )}
        </div>

        {/* 3. LOCATION CHECK */}
        <div className="flex flex-col p-3 rounded-lg bg-muted/40 border border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-full text-indigo-600 dark:text-indigo-400">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold">Location</div>
                <div className="text-xs text-muted-foreground">Required for Check-in</div>
              </div>
            </div>
            {renderStatus(geoStatus)}
          </div>

           {geoStatus !== 'granted' && (
            <div className="space-y-3">
               {/* COACHING TEXT */}
               <div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs p-2 rounded flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                   For best results, select <strong>"Allow While Using App"</strong>.
                </span>
              </div>

              <button
                onClick={requestLocation}
                className="w-full py-3 bg-primary text-primary-foreground hover:opacity-90 font-bold rounded-lg shadow transition-all flex justify-center items-center gap-2"
              >
                <MousePointerClick className="w-4 h-4" />
                {geoStatus === 'denied' ? 'Retry Location Permission' : 'Tap to Allow Location'}
              </button>
            </div>
          )}
          
           {geoStatus === 'denied' && (
            <div className="mt-2 text-xs text-destructive bg-destructive/10 p-2 rounded border border-destructive/20">
              <strong>Action Required:</strong> Location blocked. Check device settings &rarr; Privacy &rarr; Location Services.
            </div>
          )}
        </div>

      </div>

      <div className="text-center pt-2">
         {cameraStatus === 'granted' && geoStatus === 'granted' && (
           <p className="text-green-600 dark:text-green-400 font-bold text-sm">
             All systems ready.
           </p>
         )}
         {lastChecked && (
           <p className="text-muted-foreground text-[10px] mt-1">
             Last checked: {lastChecked.toLocaleTimeString()}
           </p>
         )}
      </div>
    </div>
  );
}