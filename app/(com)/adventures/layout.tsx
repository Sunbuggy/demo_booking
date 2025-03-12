import { Toaster } from '@/components/ui/Toasts/toaster';
import type { Metadata } from 'next';
import type React from 'react'; // Import React

export const metadata: Metadata = {
  title: 'Adventures Dashboard',
  description: 'Admin dashboard for managing adventures'
};

export default function AdventuresLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">{children}</main>
      <Toaster />
    </div>
  );
}
