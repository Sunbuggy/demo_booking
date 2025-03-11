'use client';
import React, { useState } from 'react';
import CaptureImage from '@/components/ui/Camera';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { FaCamera } from 'react-icons/fa'; // Import the camera icon from react-icons

const PicForm: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCapture = (image: string) => {
    console.log('Captured image:', image);
    // Close the dialog after capturing the image
    setIsDialogOpen(false);
  };

  return (
    <div>
      {/* <h1>Capture Image Example</h1> */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <button className="p-3 rounded-fulltext-white hover:bg-red-600 focus:outline-none">
            <FaCamera className="w-5 h-5" />
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Capture Image</DialogTitle>
          </DialogHeader>
          <CaptureImage onCapture={handleCapture} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PicForm;
