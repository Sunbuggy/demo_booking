'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { updateLicensePhoto } from '@/app/actions/update-license-photo';
import { useToast } from '@/components/ui/use-toast';

export default function LicenseSelfie() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false); // <--- NEW: Tracks if video is actually playing
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  // 1. START CAMERA
  const startCamera = async () => {
    try {
      setCameraReady(false); // Reset ready state
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "user", 
          width: { ideal: 640 }, // We ask for standard SD to ensure fast mobile processing
          height: { ideal: 640 }
        } 
      });
      setStream(mediaStream);
    } catch (err) {
      console.error("Camera denied or not available:", err);
      toast({ title: "Camera Error", description: "Could not access camera. Try uploading a file.", variant: "destructive" });
    }
  };

  // 2. STOP CAMERA 
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setCameraReady(false);
    }
  };

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      // Mobile Safari often needs an explicit play call even with autoPlay prop
      videoRef.current.play().catch(e => console.error("Video play error:", e));
    }
    return () => stopCamera(); 
  }, [stream]);

  // 3. CAPTURE PHOTO
  const takePhoto = () => {
    if (!videoRef.current || !cameraReady) return;

    const video = videoRef.current;
    
    // Safety check for dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
        toast({ title: "Camera warming up...", description: "Please wait a moment and try again." });
        return;
    }

    const canvas = document.createElement('canvas');
    // Square Aspect Ratio
    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const xOffset = (video.videoWidth - size) / 2;
    const yOffset = (video.videoHeight - size) / 2;

    ctx.drawImage(video, xOffset, yOffset, size, size, 0, 0, size, size);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85); 
    setPreview(dataUrl);
    stopCamera();
  };

  // 4. SAVE TO DB
  const handleSave = async () => {
    if (!preview) return;
    setLoading(true);

    const res = await updateLicensePhoto(preview);
    
    if (res.success) {
      toast({ title: "Success!", description: "Fun License Photo Updated." });
      window.location.reload(); 
    } else {
      toast({ title: "Error", description: "Could not save photo.", variant: "destructive" });
      setLoading(false);
    }
  };

  const handleRetake = () => {
    setPreview(null);
    startCamera();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center gap-6 max-w-sm mx-auto w-full">
      
      {/* === VIEWFINDER AREA === */}
      <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-dashed border-zinc-700 bg-black flex items-center justify-center shadow-xl">
        
        {/* State A: Preview (Photo Taken) */}
        {preview ? (
          <Image 
            src={preview} 
            alt="Selfie Preview" 
            fill 
            className="object-cover transform scale-x-[-1]" 
            unoptimized 
          /> 
        ) 
        /* State B: Live Camera */
        : stream ? (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            onCanPlay={() => setCameraReady(true)} // <--- CRITICAL FOR MOBILE
            className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-500 ${cameraReady ? 'opacity-100' : 'opacity-0'}`} 
          />
        ) 
        /* State C: Idle */
        : (
          <div className="text-center p-4">
            <Camera className="w-12 h-12 mx-auto text-zinc-500 mb-2" />
            <p className="text-xs text-zinc-400">Ready for your closeup?</p>
          </div>
        )}

        {/* Loading Spinner overlay for camera warmup */}
        {stream && !cameraReady && !preview && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
        )}
      </div>

      {/* === CONTROLS === */}
      <div className="w-full space-y-3">
        
        {/* SNAP MODE */}
        {stream && !preview && (
           <div className="grid grid-cols-2 gap-3">
             <Button 
                type="button" 
                variant="outline" 
                onClick={stopCamera} 
                className="h-12 border-red-900 text-red-500 hover:bg-red-950/30"
             >
               <X className="w-4 h-4 mr-2" /> Cancel
             </Button>
             
             <Button 
                type="button" 
                onClick={takePhoto} 
                disabled={!cameraReady} // <--- Disabled until video is actually playing
                className="h-12 bg-white text-black hover:bg-zinc-200 font-bold disabled:opacity-50"
             >
               <Camera className="w-4 h-4 mr-2" /> SNAP
             </Button>
           </div>
        )}

        {/* REVIEW MODE */}
        {preview && (
           <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-bottom-2 fade-in duration-300">
             <Button type="button" variant="outline" onClick={handleRetake} disabled={loading} className="h-12">
               <RefreshCw className="w-4 h-4 mr-2" /> Retake
             </Button>
             <Button 
                type="button"
                onClick={handleSave} 
                disabled={loading} 
                className="h-12 bg-green-600 hover:bg-green-700 text-white font-bold"
             >
               {loading ? "Saving..." : <><Check className="w-4 h-4 mr-2" /> LOOKS GOOD</>}
             </Button>
           </div>
        )}

        {/* IDLE MODE */}
        {!stream && !preview && (
           <div className="space-y-3">
             <Button 
               type="button"
               onClick={startCamera} 
               className="w-full h-12 rounded-full border border-yellow-500 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 uppercase font-bold tracking-wider"
             >
                Open Camera
             </Button>

             <div className="relative">
                <Button type="button" variant="ghost" className="w-full text-xs text-zinc-500 hover:text-zinc-300">
                   Or upload a file
                </Button>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
             </div>
           </div>
        )}
      </div>
      
      {!preview && !stream && (
        <p className="text-xs text-center text-zinc-600 max-w-xs">
          Tip: Ensure good lighting. This photo is your official SunBuggy ID.
        </p>
      )}
    </div>
  );
}