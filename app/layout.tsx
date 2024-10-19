import { Metadata } from 'next';
import Footer from '@/components/ui/Footer';
import Navbar from '@/components/ui/Navbar';
import { Toaster } from '@/components/ui/Toasts/toaster';
import Providers from './providers';
import { PropsWithChildren, Suspense } from 'react';
import { getURL } from '@/utils/helpers';
import '@/app/globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toster } from '@/components/ui/toaster';
import { createClient } from '@/utils/supabase/server';
import { getUserBgImage, getUserBgProperties } from '@/utils/supabase/queries';

const title = 'Sunbuggy Fun Rentals';
const description =
  'Sunbuggy Fun Rentals is the ultimate off-road adventure experience.';

export const metadata: Metadata = {
  metadataBase: new URL(getURL()),
  title: title,
  description: description,
  openGraph: {
    title: title,
    description: description
  }
};

async function getBackgroundStyles() {
  const supabase = createClient();
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
      <body style={backgroundStyles}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          // themes={Object.keys(themes) as ThemeName[]}
        >
          <div className="flex flex-col gap-5 max-w-full min-h-screen bg-background/85">
            <Navbar />
            {/* <ThemeSelector /> */}
            <main className="p-2 max-w-11/12 flex mx-auto flex-grow">
              <Providers>{children}</Providers>
            </main>
            <Footer />
          </div>
        </ThemeProvider>
        <Suspense>
          <Toaster />
          <Toster />
        </Suspense>
      </body>
    </html>
  );
}
