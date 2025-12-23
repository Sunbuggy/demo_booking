import { Metadata } from 'next';
import Footer from '@/components/ui/Footer';
import Navbar from '@/components/ui/Navbar';
import { Toaster } from '@/components/ui/Toasts/toaster';
import { Toster } from '@/components/ui/toaster';
import Providers from './providers';
import { PropsWithChildren, Suspense } from 'react';
import { getURL } from '@/utils/helpers';
import '@/app/globals.css';
import { createClient } from '@/utils/supabase/server';
import { getUserBgImage, getUserBgProperties } from '@/utils/supabase/queries';

const title = 'Sunbuggy Fun Rentals';
const description = 'Sunbuggy Fun Rentals is the ultimate off-road adventure experience.';

export const metadata: Metadata = {
  metadataBase: new URL(getURL()),
  title,
  description,
  openGraph: {
    title,
    description
  }
};

async function getBackgroundStyles() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return {};
  const bgImageData = await getUserBgImage(supabase, user.id);
  const bgPropertiesData = await getUserBgProperties(supabase, user.id);
  const bgImage = bgImageData?.[0]?.bg_image || '';
  const bgProperties = bgPropertiesData?.[0] || {};
  return {
    backgroundImage: bgImage
      ? `url(${process.env.NEXT_PUBLIC_STORAGE_PUBLIC_PREFIX}/${bgImage})`
      : 'none',
    backgroundSize: bgProperties.bg_size || 'cover',
    backgroundPosition: bgProperties.bg_position || 'center',
    backgroundRepeat: bgProperties.bg_repeat || 'no-repeat'
  };
}

export default async function RootLayout({ children }: PropsWithChildren) {
  const backgroundStyles = await getBackgroundStyles();

  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning={true}>
        <div style={backgroundStyles} className="fixed inset-0 z-[-1]" />
        <div className="fixed inset-0 bg-background/85 z-[-1]" />

        <Providers>
          <div className="flex flex-col gap-5 min-h-screen relative">
            <Navbar />
            
            
            {/* FIX: Added 'flex-col' and 'w-full'. 
                'items-start' ensures tables start from left (standard). 
                Individual pages like Timeclock will center themselves. */}
            <main className="p-2 flex flex-col flex-grow w-full max-w-7xl mx-auto">
              {children}
            </main>
            
            <Footer />
          </div>

          <Suspense>
            <Toaster />
            <Toster />
          </Suspense>
        </Providers>

      </body>
    </html>
  );
}