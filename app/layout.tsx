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
import GlobalBackgroundManager from '@/components/global-background-manager';
import BackgroundLayer from '@/components/ui/BackgroundLayer';

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

export default async function RootLayout({ children }: PropsWithChildren) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en" suppressHydrationWarning>
      {/* BODY CONFIG:
          - overflow-x-hidden: Prevents horizontal scroll from rogue content.
          - bg-transparent: Ensures background image visibility.
      */}
      <body className="bg-transparent min-h-screen font-sans antialiased overflow-x-hidden relative" suppressHydrationWarning={true}>
        
        {/* === LAYER 1: Background === */}
        {user ? (
          <GlobalBackgroundManager userId={user.id} />
        ) : (
          <BackgroundLayer />
        )}

        <Providers>
          {/* === LAYER 2: Navbar (FIXED & FLUID) === 
             - fixed top-0 left-0 right-0: Pins to viewport edges.
             - REMOVED 'max-w-7xl': This allows the navbar to span the full screen width.
             - px-4: Adds a slight padding so icons don't hit the screen edge.
          */}
          <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40 px-4">
             <div className="w-full">
               <Navbar />
             </div>
          </header>

          {/* === LAYER 3: Main Content (CONSTRAINED) === 
             - pt-20: Pushes content below fixed header.
             - max-w-7xl: Keeps readable text/cards centered and not too wide.
          */}
          <div className="flex flex-col min-h-screen pt-20 relative z-0 w-full min-w-0">
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