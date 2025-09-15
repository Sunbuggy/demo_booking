import { Label } from '@/components/ui/label';
import { UploadIcon, FileTextIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import React, { useState, FormEvent } from 'react';
import { DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

interface TitleUploadProps {
  url_key: string;
  updatePic?: boolean;
  single?: boolean;
  acceptedFormats?: string;
  bucket?: string;
}

// Initialize S3 client on the client side
const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_STORAGE_REGION!,
  forcePathStyle: true,
  endpoint: process.env.NEXT_PUBLIC_STORAGE_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_STORAGE_ACCESSKEY!,
    secretAccessKey: process.env.NEXT_PUBLIC_STORAGE_SECRETKEY!
  }
});

export default function TitleUpload({
  url_key,
  updatePic = false,
  single = false,
  acceptedFormats = 'application/pdf',
  bucket = 'sb-fleet'
}: TitleUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
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

  const uploadFileDirectlyToS3 = async (file: File, key: string) => {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file,
      ContentType: file.type,
      ACL: 'public-read'
    });
    
    await s3Client.send(command);
    return `${process.env.NEXT_PUBLIC_STORAGE_ENDPOINT}/${bucket}/${key}`;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);

    if (!url_key || !bucket) {
      toast({
        title: 'Configuration Error',
        description: 'Missing required URL key or bucket name.',
        variant: 'destructive'
      });
      setIsUploading(false);
      return;
    }

    if (selectedFiles.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select files to upload.',
        variant: 'destructive'
      });
      setIsUploading(false);
      return;
    }

    try {
      if (single) {
        // Handle single file upload
        const file = selectedFiles[0];
        let uploadKey = url_key;
        
        // Rename PDF files to the current date
        if (file.type === 'application/pdf') {
          const today = new Date().toISOString().split('T')[0];
          uploadKey = `${url_key}/${today}.pdf`;
        } else {
          uploadKey = `${url_key}/${file.name}`;
        }
        
        const url = await uploadFileDirectlyToS3(file, uploadKey);
        
        toast({
          title: 'Success',
          description: 'File uploaded successfully!',
          variant: 'success'
        });
      } else {
        // Handle multiple file uploads
        const uploadPromises = selectedFiles.map(async (file) => {
          let fileName = file.name;
          
          // Rename PDF files to the current date with index if multiple PDFs
          if (file.type === 'application/pdf') {
            const today = new Date().toISOString().split('T')[0];
            const index = selectedFiles.indexOf(file);
            fileName = `${today}-${index}.pdf`;
          }
          
          const uploadKey = `${url_key}/${fileName}`;
          const url = await uploadFileDirectlyToS3(file, uploadKey);
          return { key: uploadKey, url };
        });
        
        const results = await Promise.all(uploadPromises);
        
        toast({
          title: 'Success',
          description: `${results.length} files uploaded successfully!`,
          variant: 'success'
        });
      }
      
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
    } finally {
      setIsUploading(false);
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
              Click to upload Title (Must be PDFs)
            </span>
          </Label>
        </div>
      )}
      {selectedFiles.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative group">
                <div className="w-full h-32 flex items-center justify-center bg-gray-200 rounded-md">
                  <FileTextIcon className="h-8 w-8 text-gray-500" />
                  <span className="text-sm text-gray-500">{file.name}</span>
                </div>
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
            <Button type="submit" className="w-full" disabled={isUploading}>
              {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} ${selectedFiles.length === 1 ? 'file' : 'files'}`}
            </Button>
          </DialogClose>
        </div>
      )}
    </form>
  );
}