'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UploadIcon } from 'lucide-react';
import React from 'react';

const UploadForm = ({
  handleSubmit,
  inputFile,
  setFile,
  uploading
}: {
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  inputFile: React.RefObject<HTMLInputElement>;
  setFile: (value: React.SetStateAction<File | null>) => void;
  uploading: boolean;
}) => {
  return (
    <form onSubmit={handleSubmit} className=" flex gap-3">
      <Input
        id="file"
        type="file"
        ref={inputFile}
        className="w-[120px] hover:cursor-pointer"
        onChange={(e) => {
          const files = e.target.files;
          if (files) {
            setFile(files[0]);
          }
        }}
        accept="image/png, image/jpeg"
      />
      <Button size={'icon'} type="submit" disabled={uploading}>
        <UploadIcon />
      </Button>
    </form>
  );
};

export default UploadForm;
