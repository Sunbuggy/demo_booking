'use client';

import { useEffect, useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { getUserBgImage, getUserBgProperties } from '@/utils/supabase/queries';
import BackgroundLayer, { BackgroundConfig } from '@/components/ui/BackgroundLayer';

// Routes where the USER'S custom background should appear.
// On other routes, we may fall back to no image (just glass) or a default.
const PROTECTED_ROUTES = ['/account', '/biz', '/admin'];

export default function GlobalBackgroundManager({ userId }: { userId: string }) {
  const supabase = createClient();
  const pathname = usePathname();
  
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [bgProps, setBgProps] = useState<any>({});
  const [hasLoaded, setHasLoaded] = useState(false);

  // Check if we are currently on a page that allows custom backgrounds
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname?.startsWith(route));

  // Helper: Construct full Storage URL from the DB path
  const getFullUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const prefix = process.env.NEXT_PUBLIC_STORAGE_PUBLIC_PREFIX;
    if (!prefix) return null;
    const cleanKey = path.startsWith('/') ? path.substring(1) : path;
    return `${prefix}/${cleanKey}`;
  };

  // 1. Initial Data Fetch
  useEffect(() => {
    if (!userId || hasLoaded) return;
    const fetchBg = async () => {
      try {
        const [imgRes, propRes] = await Promise.all([
          getUserBgImage(supabase, userId),
          getUserBgProperties(supabase, userId)
        ]);
        setBgImage(imgRes[0]?.bg_image || null);
        setBgProps(propRes[0] || {});
        setHasLoaded(true);
      } catch (error) {
        console.error('Failed to load global background', error);
      }
    };
    fetchBg();
  }, [userId, hasLoaded, supabase]);

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
    // Otherwise, we pass 'url: null', which tells BackgroundLayer to render ONLY the glass effect.
    const shouldShowImage = isProtectedRoute && bgImage;

    return {
      url: shouldShowImage ? getFullUrl(bgImage) : null,
      // Map DB properties to strict TypeScript types, with fallbacks
      repeat: (bgProps.repeat === 'repeat' || bgProps.repeat === 'no-repeat') 
        ? bgProps.repeat 
        : 'no-repeat',
      size: (bgProps.size === 'auto' || bgProps.size === 'contain' || bgProps.size === 'cover') 
        ? bgProps.size 
        : 'cover',
      position: (['center', 'top', 'left', 'right', 'bottom'].includes(bgProps.position))
        ? bgProps.position
        : 'center',
    };
  }, [bgImage, bgProps, isProtectedRoute]);

  // RENDER
  // We always render BackgroundLayer now. If config.url is null, it just renders the 
  // "Atmosphere" (glass tint) which is critical for text readability on all pages.
  return <BackgroundLayer config={config} />;
}