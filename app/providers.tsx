'use client';

// 1. New Imports for Theme and Toasts
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { Toaster } from 'sonner';

// Existing Imports for React Query
import {
  isServer,
  QueryClient,
  QueryClientProvider
} from '@tanstack/react-query';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000
      }
    }
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (isServer) {
    return makeQueryClient();
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    // Keep QueryClientProvider at the top level
    <QueryClientProvider client={queryClient}>
      
      {/* 2. Add the Theme Provider inside */}
      <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
        
        {children}
        
        {/* 3. Add the Toaster here so notifications work everywhere */}
        <Toaster />
        
      </NextThemesProvider>
    </QueryClientProvider>
  );
}