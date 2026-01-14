'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner'; // Assuming you use Sonner for toasts

export default function GoogleOneTap() {
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    // Only run on client mount
    setMounted(true);
  }, []);

  // 1. The Callback: Handle the Google Response
  const handleCredentialResponse = async (response: any) => {
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
      });

      if (error) throw error;

      // SUCCESS:
      toast.success("Welcome to the Insider Club! Off-peak rates unlocked.");
      router.refresh(); // Refresh page to update "SmartPriceTags"
    } catch (error) {
      console.error('One Tap Error:', error);
    }
  };

  // 2. Initialize Google Logic
  const initializeGoogleOneTap = () => {
    if (!window.google) return;

    // Check if user is ALREADY logged in to Supabase
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) return; // Don't show if already logged in

      // A. Setup the client
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!, 
        callback: handleCredentialResponse,
        // "use_fedcm_for_prompt": true, // Modern browser standard
        cancel_on_tap_outside: false, // Keep it visible until they interact
        context: 'signup', // Shows "Sign up with Google" vs "Sign in"
      });

      // B. Display the Prompt
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed()) {
            console.log('One Tap not displayed:', notification.getNotDisplayedReason());
        } else {
            // C. SHOW THE INCENTIVE (The "Context" you asked for)
            // Since we can't change Google's text, we show a toast simultaneously
            toast("⚡ Insider Tip: Sign in to unlock off-peak pricing!", {
                duration: 8000,
                position: 'top-right',
            });
        }
      });
    });
  };

  if (!mounted) return null;

  return (
    <>
      <Script 
        src="https://accounts.google.com/gsi/client" 
        strategy="afterInteractive"
        onLoad={initializeGoogleOneTap}
      />
      {/* Invisible div required by Google just in case */}
      <div id="credential_picker_container" className="fixed top-0 right-0 z-[9999]" /> 
    </>
  );
}

// Add types to window to prevent TS errors
declare global {
  interface Window {
    google: any;
  }
}