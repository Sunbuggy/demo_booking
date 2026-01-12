'use client';

import { useState } from 'react';
import LicenseSelfie from './LicenseSelfie';

// Define the steps of the Fun License Flow
type FlowStep = 'SELFIE' | 'WAIVER' | 'COMPLETE';

export default function FunLicenseCard() {
  // STATE
  const [step, setStep] = useState<FlowStep>('SELFIE');
  const [photoData, setPhotoData] = useState<string | null>(null);

  // LOGIC: This is the function that was missing!
  const handlePhotoCaptured = (dataUrl: string) => {
    console.log('[Parent] Photo received. Moving to Waiver step.');
    setPhotoData(dataUrl);
    setStep('WAIVER'); // Advance the flow
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 bg-white dark:bg-zinc-900 min-h-screen">
      
      {/* PROGRESS INDICATOR */}
      <div className="mb-8 flex justify-between items-center text-sm font-bold uppercase tracking-widest text-gray-400">
        <span className={step === 'SELFIE' ? 'text-yellow-500' : ''}>1. Selfie</span>
        <span className="h-px flex-1 bg-gray-200 mx-4"></span>
        <span className={step === 'WAIVER' ? 'text-yellow-500' : ''}>2. Waiver</span>
        <span className="h-px flex-1 bg-gray-200 mx-4"></span>
        <span className={step === 'COMPLETE' ? 'text-yellow-500' : ''}>3. Done</span>
      </div>

      {/* CONTENT SWITCHER */}
      <div className="bg-gray-50 dark:bg-black/20 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl p-6 md:p-10">
        
        {step === 'SELFIE' && (
          // HERE IS THE FIX: Passing the prop correctly
          <LicenseSelfie 
            onPhotoConfirmed={handlePhotoCaptured} 
            initialImage={photoData}
          />
        )}

        {step === 'WAIVER' && (
          <div className="text-center space-y-6 animate-in slide-in-from-right duration-500">
             <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-yellow-500 shadow-lg">
                {/* Show the user the photo they just took */}
                {photoData && <img src={photoData} alt="You" className="w-full h-full object-cover" />}
             </div>
             <h2 className="text-2xl font-bold">Great Shot!</h2>
             <p className="max-w-md mx-auto text-gray-600">
               Now we need you to review the liability waiver.
             </p>
             <button 
               onClick={() => alert("Waiver Integration Coming Next!")}
               className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold uppercase"
             >
               Open Waiver
             </button>
             <button 
               onClick={() => setStep('SELFIE')}
               className="block w-full text-center text-gray-400 text-sm hover:underline mt-4"
             >
               Go back and retake photo
             </button>
          </div>
        )}

      </div>
    </div>
  );
}