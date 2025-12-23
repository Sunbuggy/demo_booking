'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Share, PlusSquare } from 'lucide-react'; 

export default function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // 1. Check if app is already installed (Standalone mode)
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches 
        || (window.navigator as any).standalone 
        || document.referrer.includes('android-app://');
    
    setIsStandalone(isStandaloneMode);
    
    if (isStandaloneMode) return;

    // 2. Check device type
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 3. Handle Android/Desktop Install Prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault(); // Prevent default mini-infobar
      setDeferredPrompt(e); // Stash the event so it can be triggered later.
      setShowPrompt(true);  // Show our custom UI
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Handle iOS (Show prompt immediately if iOS and not standalone)
    // You might want to delay this or check cookies to not annoy user every time
    if (isIosDevice) {
        setShowPrompt(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt(); // Show the native install prompt
    const { outcome } = await deferredPrompt.userChoice; // Wait for user choice
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
      setShowPrompt(false);
  };

  // Don't render anything if installed or no prompt needed
  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom duration-500 md:left-auto md:right-4 md:w-96">
      <div className="bg-background/95 backdrop-blur-md border border-border shadow-2xl rounded-xl p-4 flex flex-col gap-4">
        
        {/* Header with Close Button */}
        <div className="flex items-start justify-between">
           <div>
             <h3 className="font-bold text-lg text-primary">Install App</h3>
             <p className="text-sm text-muted-foreground">
               Install SunBuggy for the best booking experience!
             </p>
           </div>
           <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground">
             <X className="w-5 h-5"/>
           </button>
        </div>

        {/* Dynamic Content based on Device */}
        {isIOS ? (
           <div className="text-sm bg-muted/50 p-3 rounded-lg space-y-2 border border-muted">
             <p className="flex items-center gap-2">
               1. Tap the Share button <Share className="w-4 h-4 text-blue-500" />
             </p>
             <p className="flex items-center gap-2">
               2. Scroll down & tap "Add to Home Screen" <PlusSquare className="w-4 h-4" />
             </p>
           </div>
        ) : (
           <Button onClick={handleInstallClick} className="w-full font-bold shadow-sm">
             Add to Home Screen
           </Button>
        )}
      </div>
    </div>
  );
}