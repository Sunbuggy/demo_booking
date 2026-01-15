'use client';
import React, { useState } from 'react';
import CaptureImage from '@/components/ui/Camera';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

interface PicFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  groupName: string; // Add groupName as a prop
}

const PicForm: React.FC<PicFormProps> = ({ isOpen, onOpenChange, groupName }) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [pictureNumber, setPictureNumber] = useState(1);
  const { toast } = useToast();

  const handleCapture = async (image: string) => {
    try {
      // Convert the base64 image to a Blob
      const blob = await fetch(image).then((res) => res.blob());
      const file = new File([blob], generateFileName(), { type: 'image/png' });

      // Upload the file to the bucket with the structured folder path
      await uploadFile(file);

      setPictureNumber((prev) => prev + 1);

      onOpenChange(false);
      setIsCameraOpen(false);
    } catch (error) {
      console.error('Error capturing image:', error);
      toast({
        title: 'Error',
        description: 'Failed to capture and upload the image.',
        variant: 'destructive',
      });
    }
  };

  const handleUploadPicture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const renamedFile = new File([file], generateFileName(), { type: file.type });
          await uploadFile(renamedFile);
          setPictureNumber((prev) => prev + 1);
        }
        onOpenChange(false);
      } catch (error) {
        console.error('Error uploading file:', error);
        toast({
          title: 'Error',
          description: 'Failed to upload the file(s).',
          variant: 'destructive',
        });
      }
    }
  };

  const generateFileName = () => {
    return `${groupName}${pictureNumber}.png`;
  };

  const uploadFile = async (file: File) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); 
    const day = String(today.getDate()).padStart(2, '0');
    const folderPath = `${year}/${month}/${day}/${groupName}`;

    const formData = new FormData();
    formData.append('bucket', 'sb-group-pics');
    formData.append('mode', 'single');
    formData.append('key', `${folderPath}/${file.name}`);
    formData.append('files', file);
    formData.append('contentType', file.type);

    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/s3/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Upload failed.');
    }

    toast({
      title: 'Success',
      description: 'File uploaded successfully!',
      variant: 'success',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Capture Image</DialogTitle>
        </DialogHeader>
        {!isCameraOpen ? (
          <div className="flex flex-col space-y-4">
            <label className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-800 text-center cursor-pointer">
              Upload Picture(s)
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUploadPicture}
                multiple
              />
            </label>
            <button
              onClick={() => setIsCameraOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-800"
            >
              Open Camera
            </button>
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            <CaptureImage onCapture={handleCapture} />
            <button
              onClick={() => setIsCameraOpen(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close Camera
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PicForm;