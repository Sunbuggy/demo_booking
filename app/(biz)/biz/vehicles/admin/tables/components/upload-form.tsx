'use client';
import Separator from '@/components/ui/AuthForms/Separator';
import { Button } from '@/components/ui/button';
import { DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { UploadIcon } from 'lucide-react';
import React, { useState } from 'react';

const UploadForm = ({
  handleSubmit,
  inputFile,
  setFile,
  setFiles,
  uploading,
  multiple = false,
  acceptFormat = 'image/png, image/jpeg'
}: {
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  inputFile: React.RefObject<HTMLInputElement>;
  setFile?: (value: React.SetStateAction<File | null>) => void;
  setFiles?: (value: React.SetStateAction<File[]>) => void;
  uploading: boolean;
  multiple?: boolean;
  acceptFormat?: string;
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setSelectedFiles(fileArray);
      if (setFile) {
        setFile(fileArray[0]);
      }
      if (setFiles) {
        setFiles(fileArray);
      }
    }
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    if (setFiles) {
      setFiles(newFiles);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Input
        id="file"
        type="file"
        ref={inputFile}
        className="w-[120px] hover:cursor-pointer"
        onChange={handleFileChange}
        accept={acceptFormat}
        multiple={multiple}
      />

      <div className="flex flex-wrap gap-2 mt-3">
        {selectedFiles.map((file, index) => (
          <div key={index} className="relative">
            <img
              src={URL.createObjectURL(file)}
              alt={`Selected file ${index + 1}`}
              className="w-20 h-20 object-cover"
            />
            <button
              type="button"
              onClick={() => removeFile(index)}
              className="absolute top-0 right-0 bg-red-500 w-[20px] h-[20px] text-white rounded-full p-1 flex items-center justify-center"
            >
              &minus;
            </button>
          </div>
        ))}
      </div>
      <Separator text="" />
      {selectedFiles.length > 0 && (
        <DialogClose asChild type="submit" disabled={uploading}>
          <Button className="text-green-500" size="icon">
            <UploadIcon />
          </Button>
        </DialogClose>
      )}
    </form>
  );
};

export default UploadForm;
