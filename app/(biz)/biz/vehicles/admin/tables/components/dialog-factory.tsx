import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import React from 'react';

const DialogFactory = ({
  title = 'Put Title Here',
  setIsDialogOpen,
  isDialogOpen,
  description = 'Put Description Here',
  children
}: {
  title: string;
  setIsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isDialogOpen: boolean;
  children: React.ReactNode;
  description?: string;
}) => {
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent
        className={'lg:max-w-screen-lg overflow-y-scroll max-h-screen'}
      >
        <DialogTitle>{title}</DialogTitle>
        {/* Add your edit vehicle form or content here */}
        <DialogDescription>{description}</DialogDescription>
        {children}
        <DialogClose className="text-red-500">Close</DialogClose>
      </DialogContent>
    </Dialog>
  );
};

export default DialogFactory;
