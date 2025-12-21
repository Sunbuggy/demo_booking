'use client';

import { useState } from 'react';
import DialogFactory from '@/components/dialog-factory';
import { Button } from '@/components/ui/button';
import { UserDetails } from '@/utils/supabase/queries';
import React from 'react';
import BackgroundPicker from './background-picker';

const BackgroundPickerButton = ({ user }: { user: UserDetails }) => {
  const [isBackgroundPickerOpen, setIsBackgroundPickerOpen] =
    React.useState(false);
  return (
    <div>
      <Button
        onClick={() => setIsBackgroundPickerOpen(true)}
        className="fixed bottom-4 right-4"
      >
        Background Picker
      </Button>
      <DialogFactory
        isDialogOpen={isBackgroundPickerOpen}
        setIsDialogOpen={setIsBackgroundPickerOpen}
        title="Background Picker"
        disableCloseButton={true}
        description="Choose a background color Or Image for your account."
        children={<BackgroundPicker user={user} />}
      />
    </div>
  );
};

export default BackgroundPickerButton;
