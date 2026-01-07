import { Metadata } from 'next';
import { PropsWithChildren, Suspense } from 'react';
import { getURL } from '@/utils/helpers';
import '@/app/globals.css';
import { createClient } from '@/utils/supabase/server';
import { getUserDetails } from '@/utils/supabase/queries'; // Import the query

// Components
import Footer from '@/components/ui/Footer';
import Navbar from '@/components/ui/Navbar';
import { Toaster } from '@/components/ui/Toasts/toaster';
import { Toster } from '@/components/ui/toaster';
import Providers from './providers';
import GlobalBackgroundManager from '@/components/global-background-manager';
import BackgroundLayer from '@/components/ui/BackgroundLayer';
import NavigationButtons from '@/components/NavigationButtons'; // Import the buttons

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
  // 1. Initialize Supabase
  const supabase = await createClient();
  
  // 2. Get Authenticated User
  const { data: { user } } = await supabase.auth.getUser();

  // 3. Check User Level (Logic for 300+)
  let showNavButtons = false;
  if (user) {
    // We pass the supabase client to your existing query function
    const userDetails = await getUserDetails(supabase);
    
    // Check if details exist and user_level is >= 300
    if (userDetails && userDetails.length > 0) {
      const level = userDetails[0].user_level;
      if (typeof level === 'number' && level >= 300) {
        showNavButtons = true;
      }
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      {/* BODY CONFIG:*/}
      <body className="bg-transparent min-h-screen font-sans antialiased overflow-x-hidden relative" suppressHydrationWarning={true}>
        
        {/* === LAYER 1: Background === */}
        {user ? (
          <GlobalBackgroundManager userId={user.id} />
        ) : (
          <BackgroundLayer />
        )}

        <Providers>
          {/* === LAYER 2: Navbar (FIXED & FLUID) ===  */}
          <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40 px-4">
             <div className="w-full">
               <Navbar />
             </div>
          </header>

          {/* === LAYER 2.5: Admin Navigation Buttons === */}
          {/* Rendered only if user_level >= 300 */}
          {showNavButtons && <NavigationButtons />}

          {/* === LAYER 3: Main Content (CONSTRAINED) ===  */}
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