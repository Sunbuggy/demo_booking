import { Label } from '@/components/ui/label';
import { CameraIcon, UploadIcon, Trash2Icon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import React, { useState, FormEvent, useRef } from 'react';
import { DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import Image from 'next/image';

interface ResponsiveGifUploadProps {
  url_key: string;
  updateGif?: boolean;
  single?: boolean;
  onSuccess?: () => void;
  maxFiles?: number;
}

export default function ResponsiveGifUpload({
  url_key,
  updateGif = false,
  single = false,
  onSuccess,
  maxFiles = 10
}: ResponsiveGifUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    const validFiles: File[] = [];
    const errors: {title: string; details: string}[] = [];

    files.forEach((file) => {
      // Check file type
      if (!file.type.includes('gif')) {
        errors.push({
          title: 'Invalid File Type',
          details: `"${file.name}" is not a GIF file. Only GIF files are allowed.`
        });
        return;
      }

      // Check if we've reached max files
      if (selectedFiles.length + validFiles.length >= maxFiles) {
        errors.push({
          title: 'Maximum Files Reached',
          details: `You can only upload ${maxFiles} GIFs at a time.`
        });
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      toast({
        title: 'Upload Issues Detected',
        description: (
          <div className="space-y-2">
            {errors.slice(0, 3).map((error, i) => (
              <div key={i} className="border-l-2 border-red-500 pl-3">
                <p className="font-medium">{error.title}</p>
                <p className="text-sm text-muted-foreground">{error.details}</p>
              </div>
            ))}
            {errors.length > 3 && (
              <p className="text-sm text-muted-foreground">
                + {errors.length - 3} more issue{errors.length - 3 !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        ),
        variant: 'destructive',
        duration: 8000
      });
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles].slice(0, maxFiles));
    }

    // Reset input to allow selecting same files again
    if (e.target === fileInputRef.current) {
      fileInputRef.current.value = '';
    } else if (e.target === cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);

    if (selectedFiles.length === 0) {
      toast({
        title: 'No Files Selected',
        description: 'Please select at least one GIF file to upload.',
        variant: 'destructive',
        duration: 5000
      });
      setIsUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append('bucket', 'sb-fleet');
    formData.append('mode', single ? 'single' : 'multiple');
    formData.append('key', url_key);
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
        let errorDetails = 'Unknown error occurred';
        
        try {
          const errorData = await response.json();
          errorDetails = errorData.message || errorData.error || JSON.stringify(errorData);
        } catch (e) {
          errorDetails = `Server responded with status ${response.status}`;
        }

        throw new Error(errorDetails);
      }

      const data = await response.json();
      toast({
        title: 'Upload Successful',
        description: (
          <div>
            <p>Successfully uploaded {selectedFiles.length} GIF{selectedFiles.length !== 1 ? 's' : ''}</p>
            {data.urls && (
              <p className="text-sm text-muted-foreground mt-1">
                Files are now being processed.
              </p>
            )}
          </div>
        ),
        variant: 'default',
        duration: 5000
      });

      setSelectedFiles([]);
      if (formRef.current) formRef.current.reset();
      
      if (onSuccess) {
        onSuccess();
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error uploading GIFs:', error);
      
      let errorMessage = 'Failed to upload GIFs. Please try again.';
      if (error instanceof Error) {
        errorMessage = `Upload failed: ${error.message}`;
      }

      toast({
        title: 'Upload Error',
        description: (
          <div>
            <p>{errorMessage}</p>
            <p className="text-sm text-muted-foreground mt-1">
              If this persists, please contact support.
            </p>
          </div>
        ),
        variant: 'destructive',
        duration: 10000
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} ref={formRef} className="space-y-4">
      {selectedFiles.length === 0 ? (
        <div className="space-y-2">
          <Label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center gap-2 text-sm font-medium border-2 border-dashed dark:border-gray-300 rounded-md p-6 text-center cursor-pointer hover:border-primary transition-colors min-h-[180px]"
          >
            <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
            <span className="mt-2 block text-sm font-semibold">
              Click to upload GIFs
            </span>
            <span className="text-xs text-gray-500">
              Maximum {maxFiles} GIFs allowed
            </span>
            <Input
              id="file-upload"
              name="files"
              type="file"
              className="sr-only"
              multiple={!single}
              onChange={handleFileChange}
              accept="image/gif"
              ref={fileInputRef}
            />
          </Label>
          <Label
            htmlFor="camera-upload"
            className="flex items-center justify-center gap-2 text-sm font-medium border-2 border-dashed dark:border-gray-300 rounded-md p-4 text-center cursor-pointer hover:border-primary transition-colors lg:hidden"
          >
            <CameraIcon className="h-6 w-6 text-gray-400" />
            <span className="font-semibold">Take a picture (GIF)</span>
            <Input
              id="camera-upload"
              name="files"
              type="file"
              className="sr-only"
              capture="environment"
              onChange={handleFileChange}
              accept="image/gif"
              ref={cameraInputRef}
            />
          </Label>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">
              Selected {selectedFiles.length} GIF{selectedFiles.length !== 1 ? 's' : ''}
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearAllFiles}
              className="text-red-500 hover:text-red-600"
            >
              <Trash2Icon className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto p-1">
            {selectedFiles.map((file, index) => (
              <div key={`${file.name}-${index}`} className="relative group">
                <div className="aspect-square overflow-hidden rounded-md border">
                  <Image
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    width={200}
                    height={200}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Remove GIF ${index + 1}`}
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs mt-1 truncate">{file.name}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                clearAllFiles();
                fileInputRef.current?.click();
              }}
            >
              Add More
            </Button>
            <DialogClose asChild>
              <Button
                type="submit"
                className="flex-1"
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  `Upload ${selectedFiles.length} GIF${selectedFiles.length !== 1 ? 's' : ''}`
                )}
              </Button>
            </DialogClose>
          </div>
        </div>
      )}
    </form>
  );
}