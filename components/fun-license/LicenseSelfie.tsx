'use client';

import { useState, useRef } from 'react';
import { Camera, RefreshCw, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { updateLicensePhoto } from '@/app/actions/update-license-photo';
import { useToast } from '@/components/ui/use-toast';
import TimeclockCamera, { TimeclockCameraHandle } from '@/components/TimeclockCamera';

export default function LicenseSelfie() {
  const cameraRef = useRef<TimeclockCameraHandle>(null);
  
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  
  const { toast } = useToast();

  // 1. CAPTURE via the Ref
  const handleSnap = () => {
    if (cameraRef.current) {
      const photoData = cameraRef.current.capture();
      if (photoData) {
        setPreview(photoData);
      } else {
        toast({ title: "Capture Failed", description: "Could not get image from camera.", variant: "destructive" });
      }
    }
  };

  // 2. SAVE via Server Action
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

  // 3. FILE UPLOAD (Fallback)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center gap-6 max-w-sm mx-auto w-full">
      
      {/* === VIEWFINDER === */}
      <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-dashed border-zinc-700 bg-black flex items-center justify-center shadow-xl group">
        
        {/* STATE A: PREVIEW (Photo Taken) */}
        {preview ? (
          <Image 
            src={preview} 
            alt="Selfie Preview" 
            fill 
            className="object-cover transform scale-x-[-1]" 
            unoptimized 
          /> 
        ) : (
          /* STATE B: LIVE CAMERA (Using your component) */
          <div className="w-full h-full relative">
            <TimeclockCamera 
               ref={cameraRef}
               facingMode="user"
               onReady={(ready) => setIsCameraReady(ready)}
               onError={(err) => console.error(err)}
               // THE FIX: Force height/width to 100% to fill the circle, remove default border/radius
               className="h-full w-full rounded-none border-none" 
            />
            
            {/* Loading Overlay (While TimeclockCamera initializes) */}
            {!isCameraReady && (
               <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 z-20 text-center p-4">
                  <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mb-2" />
                  <p className="text-xs text-zinc-500">Starting Camera...</p>
               </div>
            )}
          </div>
        )}
      </div>

      {/* === CONTROLS === */}
      <div className="w-full space-y-3">
        
        {/* SNAP MODE */}
        {!preview && (
           <div className="space-y-3">
             <Button 
                type="button" 
                onClick={handleSnap} 
                disabled={!isCameraReady}
                className="w-full h-12 bg-white text-black hover:bg-zinc-200 font-bold transition-all"
             >
               <Camera className="w-4 h-4 mr-2" /> SNAP PHOTO
             </Button>

             {/* File Upload Fallback */}
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

        {/* REVIEW MODE */}
        {preview && (
           <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-bottom-2 fade-in duration-300">
             <Button 
                type="button" 
                variant="outline" 
                onClick={() => setPreview(null)} 
                disabled={loading} 
                className="h-12"
             >
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
      </div>
      
      {!preview && (
        <p className="text-xs text-center text-zinc-600 max-w-xs">
          Tip: Ensure good lighting. This photo is your official SunBuggy ID.
        </p>
      )}
    </div>
  );
}