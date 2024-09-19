'use client';

import React from 'react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { VehicleTagType, VehicleType } from '../../admin/page';
import EditVehicle from '../../admin/tables/components/edit-vehicle';
import ImageView from './image-view';
import Link from 'next/link';
import { ArrowBigLeftIcon, Trash } from 'lucide-react';
import { VehiclePics } from '../../admin/tables/components/row-actions';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import ImageGrid from './image-grid';
import { useToast } from '@/components/ui/use-toast';
import DialogFactory from '../../admin/tables/components/dialog-factory';
import UploadForm from '../../admin/tables/components/upload-form';
import TagManagement from './tag-management';
import { User } from '@supabase/supabase-js';
import { createId } from '@paralleldrive/cuid2';

interface VehicleClientComponentProps {
  id: string;
  initialVehicleInfo: VehicleType;
  images: VehiclePics[];
  profilePic?: string;
  vehicleTags: VehicleTagType[];
  user: User;
}

const VehicleClientComponent: React.FC<VehicleClientComponentProps> = ({
  id,
  initialVehicleInfo,
  profilePic,
  images,
  vehicleTags,
  user
}) => {
  const vehicleInfo = initialVehicleInfo;
  const [isNewUploadDialogOpen, setIsNewUploadDialogOpen] =
    React.useState(false);
  const [isUpdateUploadDialogOpen, setIsUpdateUploadDialogOpen] =
    React.useState(false);
  const [isUploadImagesDialogOpen, setIsUploadImagesDialogOpen] =
    React.useState(false);
  const [files, setFiles] = React.useState<File[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const inputFile = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    key: string,
    update_pic?: boolean
  ) => {
    e.preventDefault();
    if (files.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select files to upload.',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);

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
      setUploading(false);
      // reload page
      window.location.reload();
    }
  };

  if (vehicleInfo)
    return (
      <div className="md:w-[800px] min-w-[360px] space-y-5 relative">
        <Link
          href={'/biz/vehicles/admin'}
          className="flex gap-2 hover:cursor-pointer text-pink-500 underline"
        >
          <ArrowBigLeftIcon /> Back to Vehicles
        </Link>

        <Card className="space-y-7 w-full">
          <ImageView width={400} height={300} src={profilePic} />
          {!profilePic && (
            <div className="flex justify-center">
              <Button
                variant={'link'}
                onClick={() => setIsNewUploadDialogOpen(true)}
              >
                Upload Profile Pic
              </Button>
              <DialogFactory
                title="Add Profile Pic"
                setIsDialogOpen={setIsNewUploadDialogOpen}
                isDialogOpen={isNewUploadDialogOpen}
                description="Upload a profile picture for the vehicle."
                children={
                  <div>
                    <UploadForm
                      handleSubmit={(e) => handleSubmit(e, `profile_pic/${id}`)}
                      inputFile={inputFile}
                      setFiles={setFiles}
                      uploading={uploading}
                    />
                  </div>
                }
              />
            </div>
          )}
          {profilePic && (
            <div className="flex justify-center">
              <Button
                variant={'link'}
                onClick={() => setIsUpdateUploadDialogOpen(true)}
              >
                Update Profile Pic
              </Button>
              <DialogFactory
                title="Update the Profile Pic"
                setIsDialogOpen={setIsUpdateUploadDialogOpen}
                isDialogOpen={isUpdateUploadDialogOpen}
                description="Update the profile picture for the vehicle. Please just upload a single image."
                children={
                  <div>
                    <UploadForm
                      handleSubmit={(e) =>
                        handleSubmit(e, `profile_pic/${id}`, true)
                      }
                      inputFile={inputFile}
                      setFiles={setFiles}
                      uploading={uploading}
                    />
                  </div>
                }
              />
            </div>
          )}
          <CardTitle className="text-center mt-5">
            Sunbuggy Fleet{' '}
            <span className="text-orange-500">[{vehicleInfo.name}]</span>
          </CardTitle>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="edit-vehicle">
                <AccordionTrigger>Edit Vehicle Details</AccordionTrigger>
                <AccordionContent>
                  <EditVehicle id={id} cols={2} />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="show-images">
                <AccordionTrigger>Show Images</AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-5">
                    <div>
                      <Button onClick={() => setIsUploadImagesDialogOpen(true)}>
                        Upload Images
                      </Button>
                      <DialogFactory
                        title="Upload Images for This Vehicle"
                        setIsDialogOpen={setIsUploadImagesDialogOpen}
                        isDialogOpen={isUploadImagesDialogOpen}
                        description="Upload one or multiple images for the vehicle."
                        children={
                          <div>
                            <UploadForm
                              handleSubmit={(e) =>
                                handleSubmit(e, `vehicles/${id}/${createId()}`)
                              }
                              inputFile={inputFile}
                              setFiles={setFiles}
                              uploading={uploading}
                              multiple={true}
                            />
                          </div>
                        }
                      />
                    </div>
                    <ImageGrid images={images} width={200} height={120} />
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="tag-management">
                <AccordionTrigger>Tag Management</AccordionTrigger>
                <AccordionContent>
                  <TagManagement
                    tags={vehicleTags}
                    id={vehicleInfo.id}
                    user={user}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
        <div
          className={`absolute top-12 right-6 transform rotate-45 translate-x-1/2 -translate-y-1/2 border-1 rounded-md  text-white px-6 py-1 font-bold ${vehicleInfo.vehicle_status === 'maintenance' ? 'bg-yellow-600' : vehicleInfo.vehicle_status === 'broken' ? 'bg-red-600' : 'bg-green-600'}`}
        >
          {vehicleInfo.vehicle_status}
        </div>
      </div>
    );
};

export default VehicleClientComponent;
