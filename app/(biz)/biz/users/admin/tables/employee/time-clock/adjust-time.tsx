'use client';
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

const AdjustTime = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Adjust Time {/** adjust time wizard should open */}</Button>
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

export default AdjustTime;
