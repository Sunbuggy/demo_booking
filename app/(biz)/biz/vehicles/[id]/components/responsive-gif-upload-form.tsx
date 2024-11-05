import { Label } from '@/components/ui/label';
import { CameraIcon, UploadIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import React, { useState, FormEvent } from 'react';
import { DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface VehicleGif {
  url: string;
  key: string;
}

interface ResponsiveGifUploadProps {
  vehicleId: string; // Updated to be more descriptive
  updateGif?: boolean;
  single?: boolean;
}

export default function ResponsiveGifUpload({
  vehicleId,
  updateGif = false,
  single = false
}: ResponsiveGifUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { toast } = useToast();
  const formRef = React.useRef<HTMLFormElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      if (single && fileArray.length > 1) {
        // If single mode, only take the first file
        setSelectedFiles([fileArray[0]]);
      } else {
        setSelectedFiles(fileArray);
      }
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (selectedFiles.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select a GIF to upload.',
        variant: 'destructive'
      });
      return;
    }

    const formData = new FormData();
    formData.append('bucket', 'sb-fleet');
    formData.append('mode', single ? 'single' : 'multiple');
    formData.append('key', `badges/${vehicleId}.gif`); // Set path for GIF
    formData.append('contentType', 'image/gif'); 

    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/s3/upload`,
        {
          method: updateGif ? 'PUT' : 'POST',
          body: formData
        }
      );

      if (!response.ok) {
        const data = await response.json();
        console.error('Failed to upload GIF:', data.message);
        throw new Error(data.message || 'Failed to upload GIF');
      }

      const data = await response.json();
      toast({
        title: 'Success',
        description: 'GIF uploaded successfully',
        variant: 'success'
      });
      setSelectedFiles([]);
      if (formRef.current) formRef.current.reset();
      window.location.reload(); 
    } catch (error) {
      console.error('Error uploading GIF:', error);
      toast({
        title: 'Error',
        description: `Failed to upload GIF. Please try again.`,
        variant: 'destructive'
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} ref={formRef} className="space-y-4">
      {selectedFiles.length === 0 && (
        <div className="space-y-2">
          <Label
            htmlFor="file-upload"
            className="block text-sm font-medium border-2 border-dashed dark:border-gray-300 rounded-md p-4 text-center cursor-pointer hover:border-primary transition-colors"
          >
            <Input
              id="file-upload"
              name="files"
              type="file"
              className="sr-only"
              multiple={!single}
              onChange={handleFileChange}
              accept="image/gif"
            />
            <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
            <span className="mt-2 block text-sm font-semibold">
              Click to upload GIF
            </span>
          </Label>
          <Label
            htmlFor="camera-upload"
            className="flex items-center justify-center gap-2 text-sm font-medium border-2 border-dashed dark:border-gray-300 rounded-md p-4 text-center cursor-pointer hover:border-primary transition-colors lg:hidden"
          >
            <Input
              id="camera-upload"
              name="files"
              type="file"
              className="sr-only"
              capture="environment"
              onChange={handleFileChange}
              accept="image/gif"
            />
            <CameraIcon className="h-6 w-6 text-gray-400" />
            <span className="font-semibold">Take a picture (GIF)</span>
          </Label>
        </div>
      )}
      {selectedFiles.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative group">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Selected file ${index + 1}`}
                  className="w-full h-32 object-cover rounded-md"
                />
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Remove GIF ${index + 1}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <DialogClose asChild>
            <Button type="submit" className="w-full">
              Upload {selectedFiles.length}{' '}
              {selectedFiles.length === 1 ? 'GIF' : 'GIFs'}
            </Button>
          </DialogClose>
        </div>
      )}
    </form>
  );
}
