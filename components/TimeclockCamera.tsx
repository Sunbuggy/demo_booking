/**
 * SunBuggy Timeclock Camera - "Bulletproof" Mode
 * Location: components/TimeclockCamera.tsx
 * Fixes: "Initializing..." hang by removing event listener dependency.
 */
'use client';

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';

export interface TimeclockCameraHandle {
  capture: () => string | null;
}

interface TimeclockCameraProps {
  onReady?: (isReady: boolean) => void;
  onError?: (error: string) => void;
}

const TimeclockCamera = forwardRef<TimeclockCameraHandle, TimeclockCameraProps>(
  ({ onReady, onError }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    
    // We use a ref to track the active stream so we can clean it up reliably
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

        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        return canvas.toDataURL('image/jpeg', 0.8);
      }
    }));

    useEffect(() => {
      let isMounted = true;

      const initCamera = async () => {
        try {
          // Stop any existing stream first to prevent "camera in use" errors
          if (activeStreamRef.current) {
            activeStreamRef.current.getTracks().forEach(t => t.stop());
          }

          const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
              facingMode: 'user', 
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
            
            // FIX: Don't wait for an event. Play immediately.
            videoRef.current.play().catch(err => {
                console.warn("Autoplay blocked, forcing play:", err);
                videoRef.current?.play();
            });

            // Mark as ready immediately so the UI doesn't hang
            setIsStreaming(true);
            if (onReady) onReady(true);
          }

        } catch (err) {
          console.error("Camera Init Error:", err);
          // Only show error if we are still mounted
          if (isMounted) {
            if (onError) onError("Could not start camera. Check permissions.");
            if (onReady) onReady(false);
          }
        }
      };

      initCamera();

      // Cleanup function
      return () => {
        isMounted = false;
        if (activeStreamRef.current) {
          activeStreamRef.current.getTracks().forEach(track => track.stop());
          activeStreamRef.current = null;
        }
        setIsStreaming(false);
      };
    }, []); // Empty dependency array ensures this only runs once on mount

    return (
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-slate-700 shadow-inner group">
        <video
          ref={videoRef}
          autoPlay
          playsInline 
          muted
          className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-500 ${isStreaming ? 'opacity-100' : 'opacity-0'}`}
        />
        <canvas ref={canvasRef} className="hidden" />

        {!isStreaming && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-900 z-10">
            <span className="animate-pulse font-medium">Initializing Camera...</span>
            <p className="text-[10px] text-slate-600 mt-2 max-w-[200px] text-center">
                If stuck, please refresh the page.
            </p>
          </div>
        )}
      </div>
    );
  }
);

TimeclockCamera.displayName = "TimeclockCamera";
export default TimeclockCamera;