import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const TimeSheetAdjustment = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>View Time Sheet Requests</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Coming Soon...</DialogTitle>
          <DialogDescription>Coming Soon...</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default TimeSheetAdjustment;
