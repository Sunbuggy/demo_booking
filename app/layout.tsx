import { Metadata } from 'next';
import Footer from '@/components/ui/Footer';
import Navbar from '@/components/ui/Navbar';
import { Toaster } from '@/components/ui/Toasts/toaster';

import { PropsWithChildren, Suspense } from 'react';
import { getURL } from '@/utils/helpers';
import 'styles/main.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toster } from '@/components/ui/toaster';

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
          <Navbar/>
            {/* <NewNav /> */}
            <main className="p-5"> {children}</main>
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
