import { Label } from '@/components/ui/label';
import { CameraIcon, UploadIcon, FileTextIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import React, { useState, FormEvent } from 'react';
import { DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface RegistrationUploadProps {
  url_key: string;
  updatePic?: boolean;
  single?: boolean;
  acceptedFormats?: string;
  bucket?: string;
}

export default function RegistrationUpload({
  url_key,
  updatePic = false,
  single = false,
  acceptedFormats = 'image/*,application/pdf',
  bucket = 'sb-fleet'
}: RegistrationUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { toast } = useToast();
  const formRef = React.useRef<HTMLFormElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setSelectedFiles(fileArray);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  
    if (!url_key || !bucket) {
      toast({
        title: 'Configuration Error',
        description: 'Missing required URL key or bucket name.',
        variant: 'destructive'
      });
      return;
    }
  
    if (selectedFiles.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select files to upload.',
        variant: 'destructive'
      });
      return;
    }
  
    const formData = new FormData();
    formData.append('bucket', bucket);
    formData.append('mode', single ? 'single' : 'multiple');
    formData.append('key', url_key);
  
    // Rename PDF files to the current date
    selectedFiles.forEach((file) => {
      let newFile = file;
      if (file.type === 'application/pdf') {
        const today = new Date().toISOString().split('T')[0]; 
        newFile = new File([file], `${today}.pdf`, { type: file.type });
      }
      formData.append('files', newFile);
      formData.append('contentType', newFile.type);
    });
  
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/s3/upload`,
        {
          method: updatePic ? 'PUT' : 'POST',
          body: formData
        }
      );
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed.');
      }
  
      toast({
        title: 'Success',
        description: 'Files uploaded successfully!',
        variant: 'success'
      });
      setSelectedFiles([]);
      if (formRef.current) formRef.current.reset();
      window.location.reload();
    } catch (error: any) {
      console.error('Error uploading files:', error);
      toast({
        title: 'Upload Error',
        description: error.message || 'Upload failed. Please try again.',
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
              accept={acceptedFormats}
            />
            <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
            <span className="mt-2 block text-sm font-semibold">
              Click to upload Registration (Images or PDFs)
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
              accept="image/*"
            />
            <CameraIcon className="h-6 w-6 text-gray-400" />
            <span className="font-semibold">Take a picture</span>
          </Label>
        </div>
      )}
      {selectedFiles.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative group">
                {file.type.startsWith('image/') ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Selected file ${index + 1}`}
                    className="w-full h-32 object-cover rounded-md"
                  />
                ) : (
                  <div className="w-full h-32 flex items-center justify-center bg-gray-200 rounded-md">
                    <FileTextIcon className="h-8 w-8 text-gray-500" />
                    <span className="text-sm text-gray-500">{file.name}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Remove file ${index + 1}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414 1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <DialogClose asChild>
            <Button type="submit" className="w-full">
              Upload {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'}
            </Button>
          </DialogClose>
        </div>
      )}
    </form>
  );
}
