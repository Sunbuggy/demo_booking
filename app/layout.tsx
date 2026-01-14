import { Metadata } from 'next';
import { PropsWithChildren, Suspense } from 'react';
import localFont from 'next/font/local';
import { getURL } from '@/utils/helpers';
import '@/app/globals.css';
import { createClient } from '@/utils/supabase/server';

// Components
import Footer from '@/components/ui/Footer';
import Navbar from '@/components/ui/Navbar';
import { Toaster } from '@/components/ui/Toasts/toaster';
import { Toster } from '@/components/ui/toaster';
import Providers from './providers';
import GlobalBackgroundManager from '@/components/global-background-manager';
import BackgroundLayer from '@/components/ui/BackgroundLayer';
import NavigationButtons from '@/components/NavigationButtons'; 

// Auth Components
// Ensure you have created this file at this path based on our previous step
import GoogleOneTap from '@/components/auth/google-one-tap';

const title = 'Sunbuggy Fun Rentals';
const description = 'Sunbuggy Fun Rentals is the ultimate off-road adventure experience.';

// === Configure Banco Font ===
const banco = localFont({
  src: [
    {
      path: '../public/fonts/banco.ttf', 
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-banco', 
  display: 'swap',
});

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
      <body 
        className={`bg-transparent min-h-screen font-sans antialiased overflow-x-hidden relative ${banco.variable}`} 
        suppressHydrationWarning={true}
      >
        
        {/* === LAYER 1: Background === */}
        {user ? (
          <GlobalBackgroundManager userId={user.id} />
        ) : (
          <BackgroundLayer />
        )}

        <Providers>
          
          {/* === LAYER 1.5: Auth Incentives (Non-Blocking) === */}
          {/* Only load the Google Script if the user is NOT logged in.
              Suspense ensures this never blocks the UI from painting. */}
          {!user && (
            <Suspense fallback={null}>
              <GoogleOneTap />
            </Suspense>
          )}

          {/* === LAYER 2: Navbar ===  */}
          <Navbar />

          {/* === LAYER 3: Main Content ===  */}
          <div className="flex flex-col min-h-screen pt-20 relative z-0 w-full min-w-0">
            {/* GLOBAL FIX: Increased bottom padding from pb-28 to pb-36.
               This ensures the bottom of every page clears the floating NavigationButtons
               so users don't have to "scroll up" to click bottom actions.
            */}
            <main className="p-2 flex flex-col flex-grow w-full max-w-7xl mx-auto pb-36 md:pb-16">
              {children}
            </main>
            <Footer />
          </div>

          {/* === LAYER 4: Navigation Buttons (Floating) === */}
          {/* Ensure this component has pointer-events-none on its container 
              and pointer-events-auto on the buttons themselves */}
          <NavigationButtons />

          <Suspense>
            <Toaster />
            <Toster />
          </Suspense>
        </Providers>

      </body>
    </html>
  );
}