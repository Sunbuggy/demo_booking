'use client';

import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'; // Adjust path to your UI components
import DeviceHealthCheck from '@/components/system/DeviceHealthCheck';
import { ReactNode } from 'react';

export default function DeviceCheckModal({ children }: { children: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md p-0 border-none bg-transparent shadow-none">
        {/* We wrap the existing component in a modal */}
        <DeviceHealthCheck />
      </DialogContent>
    </Dialog>
  );
}