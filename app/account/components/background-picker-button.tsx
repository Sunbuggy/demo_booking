'use client';

import React, { useState } from 'react';
import DialogFactory from '@/components/dialog-factory';
import { Button } from '@/components/ui/button';
import { UserDetails } from '@/utils/supabase/queries';
import BackgroundPicker from './background-picker';
import { Palette } from 'lucide-react';

const BackgroundPickerButton = ({ user }: { user: UserDetails }) => {
  const [isBackgroundPickerOpen, setIsBackgroundPickerOpen] = useState(false);

  return (
    <div>
      <Button
        onClick={() => setIsBackgroundPickerOpen(true)}
        // SEMANTIC OVERHAUL:
        // Position: fixed bottom-right (Layout)
        // Z-Index: 50 (Layering above content)
        // Color: bg-primary / text-primary-foreground (Brand Identity)
        // Shadow: shadow-xl (Elevation for floating element)
        className="fixed bottom-6 right-6 z-50 shadow-xl bg-primary text-primary-foreground hover:bg-primary/90 rounded-full md:rounded-lg h-14 w-14 md:w-auto md:h-auto md:px-6 flex items-center justify-center gap-2 transition-transform hover:scale-105 border border-primary-foreground/10"
        title="Customize Background"
      >
        <Palette className="w-6 h-6 md:w-5 md:h-5" />
        <span className="hidden md:inline font-bold">Customize Theme</span>
      </Button>

      <DialogFactory
        isDialogOpen={isBackgroundPickerOpen}
        setIsDialogOpen={setIsBackgroundPickerOpen}
        title="Appearance Settings"
        disableCloseButton={false} // Updated to false for better UX (user can exit easily)
        description="Choose a background color or image to personalize your account."
        children={<BackgroundPicker user={user} />}
      />
    </div>
  );
};

export default BackgroundPickerButton;