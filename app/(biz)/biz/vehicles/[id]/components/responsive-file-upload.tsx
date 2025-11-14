'use client'; 
import { Label } from '@/components/ui/label';
import { CameraIcon, UploadIcon, Trash2Icon, FileTextIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import React, { useState, FormEvent, useRef, useEffect } from 'react';
import { DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import Image from 'next/image';

interface ResponsiveFileUploadProps {
  url_key: string;
  updateFile?: boolean;
  single?: boolean;
  acceptedFormats?: string;
  bucket?: string;
  maxFiles?: number;
  onSuccess?: () => void;
  renamePDFsToDate?: boolean;
}

export default function ResponsiveFileUpload({
  url_key,
  updateFile = false,
  single = false,
  acceptedFormats = 'image/*,application/pdf',
  bucket = 'sb-fleet',
  maxFiles = 10,
  onSuccess,
  renamePDFsToDate = false
}: ResponsiveFileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Check if accepted formats include images (for camera functionality)
  const acceptsImages = acceptedFormats.includes('image');
  const isGIFOnly = acceptedFormats === 'image/gif';
  const isPDFOnly = acceptedFormats === 'application/pdf';

  useEffect(() => {
    if (cameraActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [cameraActive]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      toast({
        title: 'Camera Error',
        description: 'Could not access camera. Please check permissions.',
        variant: 'destructive',
        duration: 5000
      });
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    mediaStreamRef.current = null;
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return;

    setIsCapturing(true);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    context?.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob(blob => {
      if (blob) {
        // Apply date-based naming to captured images as well
        const today = new Date().toISOString().split('T')[0];
        const fileExtension = 'png';
        
        // Find the next available number for this date
        let fileNumber = 1;
        const existingFilesForDate = selectedFiles.filter(file => 
          file.name.startsWith(today)
        );
        
        if (existingFilesForDate.length > 0) {
          const numbers = existingFilesForDate.map(file => {
            const match = file.name.match(/\((\d+)\)\./);
            return match ? parseInt(match[1]) : 0;
          });
          fileNumber = Math.max(...numbers) + 1;
        }
        
        const fileName = fileNumber === 1 
          ? `${today}.${fileExtension}`
          : `${today}(${fileNumber}).${fileExtension}`;
        
        const file = new File([blob], fileName, {
          type: 'image/png'
        });
        
        setSelectedFiles(prev => {
          const updatedFiles = [...prev, file];
          return updatedFiles.slice(0, maxFiles);
        });
        
        setCameraActive(false);
      }
      setIsCapturing(false);
    }, 'image/png', 0.95);
  };

  const generateDateBasedFileName = (originalFile: File, existingFiles: File[]): string => {
    const today = new Date().toISOString().split('T')[0];
    const fileExtension = originalFile.name.split('.').pop() || 
                         originalFile.type.split('/')[1] || 
                         'file';
    
    // Find all files that start with today's date
    const existingFilesForDate = existingFiles.filter(file => 
      file.name.startsWith(today)
    );
    
    // If no files exist for today, use just the date
    if (existingFilesForDate.length === 0) {
      return `${today}.${fileExtension}`;
    }
    
    // Extract numbers from existing files (e.g., "2024-01-15(1).pdf" -> 1)
    const numbers = existingFilesForDate.map(file => {
      const match = file.name.match(/\((\d+)\)\./);
      return match ? parseInt(match[1]) : 0;
    });
    
    // Find the next available number
    const nextNumber = Math.max(...numbers) + 1;
    return `${today}(${nextNumber}).${fileExtension}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    const validFiles: File[] = [];
    const errors: {title: string; details: string}[] = [];

    // Create regex pattern from accepted formats
    const formatPatterns = acceptedFormats.split(',').map(format => {
      // Convert wildcards to proper regex
      if (format.includes('*')) {
        return new RegExp(format.replace('*', '.*'));
      }
      return new RegExp(format);
    });

    files.forEach((file) => {
      // Check if file type matches any of the accepted formats
      const isAccepted = formatPatterns.some(pattern => 
        pattern.test(file.type)
      );

      if (!isAccepted) {
        errors.push({
          title: 'Invalid File Type',
          details: `"${file.name}" is not an accepted file type. Accepted formats: ${acceptedFormats}`
        });
        return;
      }

      if (selectedFiles.length + validFiles.length >= maxFiles) {
        errors.push({
          title: 'Maximum Files Reached',
          details: `You can only upload ${maxFiles} files at a time.`
        });
        return;
      }

      // Apply date-based renaming to ALL files
      let processedFile = file;
      if (renamePDFsToDate) {
        const newFileName = generateDateBasedFileName(file, [...selectedFiles, ...validFiles]);
        processedFile = new File([file], newFileName, { type: file.type });
      }

      validFiles.push(processedFile);
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

    if (e.target === fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Helper function to determine file type and return appropriate preview
  const getFilePreview = (file: File) => {
    if (file.type.startsWith('image/')) {
      return (
        <Image
          src={URL.createObjectURL(file)}
          alt={`Preview ${file.name}`}
          width={200}
          height={200}
          className="w-full h-full object-cover"
          unoptimized
        />
      );
    } else if (file.type === 'application/pdf') {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-gray-100 p-4">
          <FileTextIcon className="h-12 w-12 text-red-500" />
          <span className="text-xs mt-2 text-center font-medium">PDF Document</span>
          <span className="text-xs text-gray-500 text-center mt-1">
            {file.name}
          </span>
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-gray-100 p-4">
          <FileTextIcon className="h-12 w-12 text-blue-500" />
          <span className="text-xs mt-2 text-center font-medium">
            {file.type.split('/')[1]?.toUpperCase() || 'File'}
          </span>
          <span className="text-xs text-gray-500 text-center mt-1">
            {file.name}
          </span>
        </div>
      );
    }
  };

  const getUploadButtonText = () => {
    if (isGIFOnly) return 'GIFs';
    if (isPDFOnly) return 'PDFs';
    return 'files';
  };

  const getTitleText = () => {
    if (isGIFOnly) return 'GIFs';
    if (isPDFOnly) return 'PDFs';
    if (acceptedFormats === 'image/*') return 'images';
    return 'files';
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Check if we're still capturing an image
    if (isCapturing) {
      toast({
        title: 'Please wait',
        description: 'Still processing your captured image...',
        variant: 'default',
        duration: 2000
      });
      return;
    }

    if (selectedFiles.length === 0) {
      const description = isPDFOnly 
        ? 'Please select at least one PDF to upload.'
        : isGIFOnly
        ? 'Please select at least one GIF to upload.'
        : 'Please select or capture at least one file to upload.';

      toast({
        title: 'No Files Selected',
        description,
        variant: 'destructive',
        duration: 5000
      });
      return;
    }

    setIsUploading(true);

    const loadingToast = toast({
      title: 'Uploading Files',
      description: `Please wait while your ${selectedFiles.length} ${getTitleText().slice(0, -1)}${selectedFiles.length !== 1 ? 's' : ''} are being uploaded...`,
      variant: 'default',
      duration: Infinity
    });

    const formData = new FormData();
    formData.append('bucket', bucket);
    formData.append('mode', single ? 'single' : 'multiple');
    formData.append('key', url_key);
    
    // Set appropriate content type
    if (isGIFOnly) {
      formData.append('contentType', 'image/gif');
    } else if (isPDFOnly) {
      formData.append('contentType', 'application/pdf');
    } else {
      formData.append('contentType', 'multipart/form-data');
    }

    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/s3/upload`,
        {
          method: updateFile ? 'PUT' : 'POST',
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
      
      loadingToast.dismiss();
      
      toast({
        title: 'Upload Successful',
        description: (
          <div>
            <p>Successfully uploaded {selectedFiles.length} {getTitleText().slice(0, -1)}{selectedFiles.length !== 1 ? 's' : ''}</p>
            {data.urls && (
              <p className="text-sm text-muted-foreground mt-1">
                Files are now being processed.
              </p>
            )}
          </div>
        ),
        variant: 'success',
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
      console.error('Error uploading files:', error);
      
      loadingToast.dismiss();
      
      let errorMessage = 'Failed to upload files. Please try again.';
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
      {cameraActive ? (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center h-full p-8">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full max-w-3xl"
          />
          <div className="flex gap-4 mt-4">
            <Button 
              variant="destructive" 
              onClick={() => setCameraActive(false)}
              disabled={isCapturing}
            >
              Cancel
            </Button>
            <Button 
              onClick={captureImage}
              disabled={isCapturing}
            >
              {isCapturing ? 'Capturing...' : 'Capture Photo'}
            </Button>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      ) : null}

      {selectedFiles.length === 0 ? (
        <div className="space-y-2">
          <Label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center gap-2 text-sm font-medium border-2 border-dashed dark:border-gray-300 rounded-md p-6 text-center cursor-pointer hover:border-primary transition-colors min-h-[180px]"
          >
            <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
            <span className="mt-2 block text-sm font-semibold">
              Click to upload {getTitleText()}
            </span>
            <span className="text-xs text-gray-500">
              {maxFiles > 1 ? `Maximum ${maxFiles} ${getTitleText()} allowed` : 'Single file upload'}
              {acceptedFormats && ` • Accepted formats: ${acceptedFormats}`}
              {renamePDFsToDate && ` • Files will be renamed to date format`}
            </span>
            <Input
              id="file-upload"
              name="files"
              type="file"
              className="sr-only"
              multiple={!single}
              onChange={handleFileChange}
              accept={acceptedFormats}
              ref={fileInputRef}
            />
          </Label>
          {acceptsImages && !isGIFOnly && (
            <Button
              type="button"
              className="flex items-center justify-center gap-2 text-sm font-medium border-2 border-dashed dark:border-gray-300 rounded-md p-4 w-full hover:border-primary transition-colors"
              onClick={() => setCameraActive(true)}
              disabled={isCapturing}
            >
              <CameraIcon className="h-6 w-6 text-gray-400" />
              <span className="font-semibold">
                {isCapturing ? 'Processing...' : 'Take a picture'}
              </span>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">
              Selected {selectedFiles.length} {getTitleText().slice(0, -1)}{selectedFiles.length !== 1 ? 's' : ''}
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearAllFiles}
              className="text-red-500 hover:text-red-600"
              disabled={isCapturing}
            >
              <Trash2Icon className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto p-1">
            {selectedFiles.map((file, index) => (
              <div key={`${file.name}-${index}`} className="relative group">
                <div className="aspect-square overflow-hidden rounded-md border bg-gray-50">
                  {getFilePreview(file)}
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Remove file ${index + 1}`}
                    disabled={isCapturing}
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs mt-1 truncate">{file.name}</p>
                <span className="text-xs text-gray-500 capitalize">
                  {file.type.split('/')[1] || file.type}
                </span>
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
              disabled={isCapturing}
            >
              Add More
            </Button>
            <DialogClose asChild>
              <Button
                type="submit"
                className="flex-1"
                disabled={isUploading || isCapturing}
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
                  `Upload ${selectedFiles.length} ${getUploadButtonText().slice(0, -1)}${selectedFiles.length !== 1 ? 's' : ''}`
                )}
              </Button>
            </DialogClose>
          </div>
        </div>
      )}
    </form>
  );
}