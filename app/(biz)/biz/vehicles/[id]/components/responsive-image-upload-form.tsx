import { Label } from '@/components/ui/label';
import { CameraIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import React from 'react';
import { DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { VehiclePics } from '../../admin/tables/components/row-actions';

const ResponsiveImageUpload = ({
  inputFile,
  selectedFiles,
  url_key,
  files,
  images,
  setSelectedFiles,
  setFiles,
  setImages,
  updatePic,
  single = false
}: {
  inputFile: React.RefObject<HTMLInputElement>;
  selectedFiles: File[];
  url_key: string;
  images: VehiclePics[];
  files: File[];
  setImages: React.Dispatch<React.SetStateAction<VehiclePics[]>>;
  setSelectedFiles: (value: React.SetStateAction<File[]>) => void;
  setFiles: (value: React.SetStateAction<File[]>) => void;
  updatePic?: boolean;
  single?: boolean;
}) => {
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setSelectedFiles(fileArray);
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

  const handleSubmit = async (key: string, update_pic?: boolean) => {
    if (files.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select files to upload.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const bucket = 'sb-fleet';
      const formData = new FormData();
      for (const file of files) {
        formData.append('files', file);
      }
      formData.append('bucket', bucket);
      formData.append('mode', files.length > 1 ? 'multiple' : 'single');
      formData.append('contentType', files[0].type); // Assuming all files have the same type
      formData.append('key', key);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/s3/upload`,
        {
          method: update_pic ? 'PUT' : 'POST',
          body: formData
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Files uploaded successfully'
        });
      } else {
        throw new Error(data.message || 'Failed to upload files');
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload files. Please try again.',
        variant: 'destructive'
      });
    } finally {
      // Put files images in teh images state
      const newImages = files.map((file) => {
        return {
          url: URL.createObjectURL(file),
          key: file.name
        };
      }) as VehiclePics[];
      setImages([...images, ...newImages]);
      setSelectedFiles([]);
    }
  };

  return (
    <>
      {selectedFiles.length === 0 && (
        <>
          <Label
            htmlFor="file"
            className="block text-sm font-medium border-2 border-dashed dark:border-gray-300 rounded-md p-2 text-center cursor-pointer"
          >
            <Input
              type="file"
              id="file"
              className="hidden"
              multiple={!single}
              ref={inputFile}
              onChange={handleFileChange}
              accept="image/png, image/jpeg"
            />
            Click Here To Upload Pics
          </Label>
          <Label
            htmlFor="camera"
            className="flex w-full justify-center gap-5 text-sm font-medium border-2 border-dashed dark:border-gray-300 rounded-md p-2 text-center cursor-pointer mt-2 lg:hidden"
          >
            <Input
              type="file"
              id="camera"
              className="hidden"
              capture="environment"
              onChange={handleFileChange}
              accept="image/png, image/jpeg"
            />
            {/*camera icon  */}
            <CameraIcon size={24} />
            Click Here To Take A Picture
          </Label>
        </>
      )}
      {selectedFiles.length > 0 && (
        <>
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
          <DialogClose asChild>
            <Button onClick={() => handleSubmit(url_key, updatePic)}>
              Upload
            </Button>
          </DialogClose>
        </>
      )}
    </>
  );
};

export default ResponsiveImageUpload;
