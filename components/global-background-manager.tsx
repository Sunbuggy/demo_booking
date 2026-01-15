'use client';

import { useEffect, useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { getUserBgImage, getUserBgProperties } from '@/utils/supabase/queries';
import BackgroundLayer, { BackgroundConfig } from '@/components/ui/BackgroundLayer';

// Routes where the USER'S custom background should appear.
const PROTECTED_ROUTES = ['/account', '/biz', '/admin'];

// Type definition to replace 'any'
type BackgroundProperties = {
  repeat?: string;
  size?: string;
  position?: string;
};

export default function GlobalBackgroundManager({ userId }: { userId: string }) {
  const supabase = createClient();
  const pathname = usePathname();
  
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [bgProps, setBgProps] = useState<BackgroundProperties>({});

  // Check if we are currently on a page that allows custom backgrounds
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname?.startsWith(route));

  // Helper: Construct full Storage URL from the DB path
  // UPDATED: Now handles missing Env Vars without crashing/hiding the image silently
  const getFullUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;

    const prefix = process.env.NEXT_PUBLIC_STORAGE_PUBLIC_PREFIX;
    
    // FIX: If prefix is missing (common on localhost), log warning but don't return null if we can help it.
    if (!prefix) {
       console.warn('GlobalBg: NEXT_PUBLIC_STORAGE_PUBLIC_PREFIX is missing. Backgrounds may fail to load.');
       return null; 
    }

    // Ensure we don't end up with double slashes (e.g. prefix/ + /key)
    const cleanPrefix = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
    const cleanKey = path.startsWith('/') ? path.substring(1) : path;
    
    return `${cleanPrefix}/${cleanKey}`;
  };

  // 1. Initial Data Fetch
  useEffect(() => {
    if (!userId) return;

    let isMounted = true;

    const fetchBg = async () => {
      try {
        const [imgRes, propRes] = await Promise.all([
          getUserBgImage(supabase, userId),
          getUserBgProperties(supabase, userId)
        ]);
        
        if (isMounted) {
            setBgImage(imgRes[0]?.bg_image || null);
            setBgProps(propRes[0] || {});
        }
      } catch (error) {
        console.error('Failed to load global background', error);
      }
    };

    fetchBg();

    return () => { isMounted = false; };
  }, [userId, supabase]); // Removed 'hasLoaded' to ensure it updates if user switches

  // 2. Listen for "Theme Changed" events (from the Customize Dashboard modal)
  useEffect(() => {
    const handleThemeChange = (e: CustomEvent) => {
        // e.detail contains the new image path and properties
        setBgImage(e.detail.image);
        setBgProps(e.detail.properties);
    };
    window.addEventListener('theme-changed', handleThemeChange as EventListener);
    return () => window.removeEventListener('theme-changed', handleThemeChange as EventListener);
  }, []);

  // 3. Construct the Configuration Object for BackgroundLayer
  const config: BackgroundConfig = useMemo(() => {
    // Logic: Only show the custom image if we are on a protected route AND have an image.
    const shouldShowImage = isProtectedRoute && bgImage;

    return {
      url: shouldShowImage ? getFullUrl(bgImage) : null,
      
      // Map DB properties with robust fallbacks
      repeat: (bgProps.repeat === 'repeat' || bgProps.repeat === 'no-repeat') 
        ? bgProps.repeat 
        : 'no-repeat',
        
      size: (bgProps.size === 'auto' || bgProps.size === 'contain' || bgProps.size === 'cover') 
        ? bgProps.size 
        : 'cover',
        
      position: (['center', 'top', 'left', 'right', 'bottom'].includes(bgProps.position || ''))
        ? bgProps.position
        : 'center',
    };
  }, [bgImage, bgProps, isProtectedRoute]);

  // RENDER
  return <BackgroundLayer config={config} />;
}