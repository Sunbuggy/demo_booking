/**
 * SunBuggy Timeclock Camera - "Manager Proxy" Ready
 * Location: components/TimeclockCamera.tsx
 * Update: Added facingMode prop to support rear camera for manager punches.
 */
'use client';

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';

export interface TimeclockCameraHandle {
  capture: () => string | null;
}

interface TimeclockCameraProps {
  onReady?: (isReady: boolean) => void;
  onError?: (error: string) => void;
  // NEW: Allow switching between front ('user') and rear ('environment')
  facingMode?: 'user' | 'environment';
}

const TimeclockCamera = forwardRef<TimeclockCameraHandle, TimeclockCameraProps>(
  ({ onReady, onError, facingMode = 'user' }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    
    // Track active stream for cleanup
    const activeStreamRef = useRef<MediaStream | null>(null);

    useImperativeHandle(ref, () => ({
      capture: () => {
        if (!videoRef.current || !canvasRef.current) return null;
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        if (canvas.width !== video.videoWidth) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // FLIP LOGIC: Only mirror the image if using the front camera ('user')
        if (facingMode === 'user') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.8);
      }
    }));

    useEffect(() => {
      let isMounted = true;

      const initCamera = async () => {
        setIsStreaming(false); // Reset state while switching
        if (onReady) onReady(false);

        try {
          // Stop existing stream first
          if (activeStreamRef.current) {
            activeStreamRef.current.getTracks().forEach(t => t.stop());
          }

          const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
              facingMode: facingMode, // Dynamic facing mode
              width: { ideal: 640 }, 
              height: { ideal: 480 } 
            },
            audio: false
          });
          
          if (!isMounted) {
            stream.getTracks().forEach(t => t.stop());
            return;
          }

          activeStreamRef.current = stream;
          
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(err => {
                console.warn("Autoplay blocked, forcing play:", err);
                videoRef.current?.play();
            });

            setIsStreaming(true);
            if (onReady) onReady(true);
          }

        } catch (err) {
          console.error("Camera Init Error:", err);
          if (isMounted) {
            if (onError) onError("Could not start camera. Check permissions.");
            if (onReady) onReady(false);
          }
        }
      };

      initCamera();

      return () => {
        isMounted = false;
        if (activeStreamRef.current) {
          activeStreamRef.current.getTracks().forEach(track => track.stop());
          activeStreamRef.current = null;
        }
        setIsStreaming(false);
      };
    }, [facingMode]); // Re-run when facingMode changes

    return (
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-slate-700 shadow-inner group">
        <video
          ref={videoRef}
          autoPlay
          playsInline 
          muted
          // Only mirror CSS if front camera
          className={`w-full h-full object-cover transition-opacity duration-500 ${isStreaming ? 'opacity-100' : 'opacity-0'} ${facingMode === 'user' ? 'transform scale-x-[-1]' : ''}`}
        />
        <canvas ref={canvasRef} className="hidden" />

        {!isStreaming && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-900 z-10">
            <span className="animate-pulse font-medium">Initializing Camera...</span>
          </div>
        )}
      </div>
    );
  }
);

TimeclockCamera.displayName = "TimeclockCamera";
export default TimeclockCamera;