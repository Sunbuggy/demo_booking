'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import Image from 'next/image';

// TYPES
interface LicenseSelfieProps {
  /** * Callback when the user confirms their photo. 
   * The Parent component MUST provide this function.
   */
  onPhotoConfirmed: (photoDataUrl: string) => void;
  /** Optional initial image if they are retaking it */
  initialImage?: string | null;
}

export default function LicenseSelfie({ onPhotoConfirmed, initialImage }: LicenseSelfieProps) {
  // STATE
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(initialImage || null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);

  // REFS
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 1. START CAMERA
  const startCamera = async () => {
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setStream(mediaStream);
      setIsCameraActive(true);
    } catch (err) {
      console.error('Camera Error:', err);
      setError('Could not access camera. Check permissions.');
    }
  };

  // 2. STOP CAMERA
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsCameraActive(false);
    }
  }, [stream]);

  // Effect: Attach stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
    return () => {
      stopCamera();
    };
  }, [stream, stopCamera]);

  // 3. CAPTURE PHOTO
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      // 1:1 Aspect Ratio Capture (Square for Circle Crop)
      const size = Math.min(video.videoWidth, video.videoHeight);
      const startX = (video.videoWidth - size) / 2;
      const startY = (video.videoHeight - size) / 2;

      canvas.width = size;
      canvas.height = size;

      // Crop center square
      context.drawImage(video, startX, startY, size, size, 0, 0, size, size);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(dataUrl);
      stopCamera();
      
      console.log('[DEBUG] 0. Photo Snapped');
    }
  };

  // 4. HANDLERS
  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (capturedImage) {
      // SAFETY CHECK: Ensure the parent actually passed the function
      if (typeof onPhotoConfirmed === 'function') {
        onPhotoConfirmed(capturedImage);
      } else {
        console.error("CRITICAL ERROR: Parent component did not pass 'onPhotoConfirmed' prop!");
        alert("System Error: Photo handler missing. Please contact staff.");
      }
    }
  };

  return (
    <div className="w-full flex flex-col items-center space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black uppercase tracking-wide text-gray-900 dark:text-white drop-shadow-sm">
          Fun License Selfie
        </h2>
        <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">
          No Hats • No Sunglasses
        </p>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="bg-red-500 text-white p-3 rounded font-bold w-full text-center max-w-sm">
          {error}
        </div>
      )}

      {/* CIRCULAR CAMERA FRAME */}
      <div className="relative group">
        <div className={`
          relative overflow-hidden shadow-2xl 
          w-64 h-64 md:w-80 md:h-80 
          rounded-full border-[6px] border-yellow-400 
          bg-gray-800 flex items-center justify-center
        `}>
          
          {capturedImage ? (
            /* PREVIEW STATE */
            <div className="relative w-full h-full">
              <Image 
                src={capturedImage} 
                alt="Selfie Preview" 
                fill
                sizes="(max-width: 768px) 100vw, 400px"
                className="object-cover"
                priority
              />
            </div>
          ) : (
            /* LIVE CAMERA STATE */
            <div className="relative w-full h-full bg-black">
               {!isCameraActive ? (
                 <button 
                   onClick={startCamera}
                   className="absolute inset-0 w-full h-full flex flex-col items-center justify-center space-y-2 hover:bg-gray-900 transition-colors"
                 >
                   <span className="text-4xl">📸</span>
                   <span className="text-white font-bold uppercase">Tap to Start</span>
                 </button>
               ) : (
                 <video 
                   ref={videoRef} 
                   autoPlay 
                   playsInline 
                   muted 
                   className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
                 />
               )}
            </div>
          )}
        </div>

        {/* DECORATIVE: SunBuggy branding ring effect */}
        <div className="absolute -inset-2 rounded-full border-2 border-dashed border-gray-300 pointer-events-none opacity-50"></div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="w-full max-w-md flex flex-col gap-3">
        {capturedImage ? (
          <div className="flex gap-4 w-full">
            <button
              onClick={handleRetake}
              className="flex-1 py-4 rounded-xl font-bold uppercase tracking-wider bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors"
            >
              Retake
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-4 rounded-xl font-bold uppercase tracking-wider bg-green-600 text-white hover:bg-green-500 shadow-lg transition-colors"
            >
              Looks Good
            </button>
          </div>
        ) : (
          isCameraActive && (
            <button
              onClick={capturePhoto}
              className="w-full py-5 rounded-xl font-black uppercase text-xl tracking-widest bg-yellow-400 text-black hover:bg-yellow-300 shadow-xl transform active:scale-95 transition-all"
            >
              Snap Photo
            </button>
          )
        )}
      </div>

      {/* Hidden Canvas for Processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}