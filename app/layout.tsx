import { Metadata } from 'next';
import Footer from '@/components/ui/Footer';
import Navbar from '@/components/ui/Navbar';
import { Toaster } from '@/components/ui/Toasts/toaster';

import { PropsWithChildren, Suspense } from 'react';
import { getURL } from '@/utils/helpers';
import 'styles/main.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toster } from '@/components/ui/toaster';
import { createClient } from '@/utils/supabase/server';
import { getUserDetails } from '@/utils/supabase/queries';

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

export default async function RootLayout({ children }: PropsWithChildren) {
    // Fetch user details and role server-side
    const supabase = createClient();
    const user = await getUserDetails(supabase);
    const role = user && user[0] ? user[0].user_level : null;
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex flex-col gap-5 max-w-full">
          <Navbar role={role} />
            {/* <NewNav /> */}
            <main className="max-w-6xl mx-auto"> {children}</main>
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
