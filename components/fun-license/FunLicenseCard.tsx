'use client';

import { useState } from 'react';
import Image from 'next/image';
import { CheckCircle2, Camera, AlertTriangle, RefreshCw, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LicenseSelfie from './LicenseSelfie';

interface FunLicenseCardProps {
  profile: any;
  email: string | undefined;
}

export default function FunLicenseCard({ profile, email }: FunLicenseCardProps) {
  // If they have a photo, show card (View Mode). If not, show camera (Edit Mode).
  const hasPhoto = !!profile.license_photo_url;
  const [isEditing, setIsEditing] = useState(!hasPhoto);

  // === EDIT MODE (Camera) ===
  if (isEditing) {
    return (
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center animate-in fade-in zoom-in-95 duration-300">
        
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
            {hasPhoto ? <RefreshCw className="text-yellow-500" /> : <AlertTriangle className="text-yellow-500" />}
            {hasPhoto ? 'Update Your Photo' : 'License Photo Required'}
          </h2>
          <p className="text-zinc-400 text-sm mt-2">
            {hasPhoto 
              ? "Not happy with your pic? Snap a new one." 
              : "Waiver signed! Now let's see that smile."}
          </p>
        </div>

        <LicenseSelfie />

        {/* Cancel Button (Only if they already have a photo to go back to) */}
        {hasPhoto && (
          <Button 
            variant="ghost" 
            onClick={() => setIsEditing(false)} 
            className="mt-6 text-zinc-500 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4 mr-2" /> Cancel
          </Button>
        )}
      </div>
    );
  }

  // === VIEW MODE (Green Card) ===
  return (
    <div className="w-full max-w-md space-y-6 animate-in fade-in slide-in-from-bottom-4">
      
      {/* The Digital Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-green-500" />
        
        <div className="flex flex-col items-center">
          <div className="w-32 h-32 rounded-full border-4 border-green-500 overflow-hidden mb-6 shadow-lg shadow-green-500/20 relative group">
             <Image 
               src={profile.license_photo_url} 
               alt="License Photo" 
               fill 
               className="object-cover"
               unoptimized // Crucial for instant Base64 rendering
             />
          </div>
          
          <h2 className="text-2xl font-bold uppercase text-white">{profile.full_name}</h2>
          <p className="text-green-500 font-mono text-sm mb-6 flex items-center gap-2">
            <CheckCircle2 size={16} /> LICENSE ACTIVE
          </p>

          <div className="w-full bg-black/40 rounded-lg p-4 font-mono text-xs text-zinc-500 space-y-2 border border-zinc-800">
            <div className="flex justify-between">
              <span>LICENSE ID:</span>
              <span className="text-zinc-300">{profile.fun_license_id?.substring(0, 12)}...</span>
            </div>
            <div className="flex justify-between">
              <span>ISSUED:</span>
              <span className="text-zinc-300">
                {profile.license_signed_at ? new Date(profile.license_signed_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>EMAIL:</span>
              <span className="text-zinc-300">{email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* The Update Button */}
      <Button 
        variant="outline" 
        className="w-full h-12 border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
        onClick={() => setIsEditing(true)}
      >
        <Camera className="w-4 h-4 mr-2" /> Update Photo
      </Button>

    </div>
  );
}