'use client';

import React from 'react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { VehicleType } from '../../admin/page';
import EditVehicle from '../../admin/tables/components/edit-vehicle';
import ImageView from './image-view';
import Link from 'next/link';
import { ArrowBigLeftIcon } from 'lucide-react';
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
interface VehicleClientComponentProps {
  id: string;
  initialVehicleInfo: VehicleType;
  images: VehiclePics[];
  damageImages: VehiclePics[];
  profilePic?: string;
}

const VehicleClientComponent: React.FC<VehicleClientComponentProps> = ({
  id,
  initialVehicleInfo,
  profilePic,
  images,
  damageImages
}) => {
  const vehicleInfo = initialVehicleInfo;
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const inputFile = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!file) {
      toast({
        title: 'Error',
        description: 'Please select a file to upload.',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);

    try {
      const bucket = 'sb-fleet';
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);
      formData.append('mode', 'single');
      formData.append('contentType', file.type);
      formData.append('key', `profile_pic/${id}`);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/s3/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'File uploaded successfully'
        });
      } else {
        throw new Error(data.message || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload file. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  if (vehicleInfo)
    return (
      <div className="md:w-[800px] min-w-[360px] space-y-5">
        <Link
          href={'/biz/vehicles/admin'}
          className="flex gap-2 hover:cursor-pointer text-pink-500 underline"
        >
          <ArrowBigLeftIcon /> Back to Vehicles
        </Link>

        <Card className="space-y-7 w-full">
          <div>{<ImageView src={profilePic} />}</div>
          {!profilePic && (
            <div className="flex justify-center">
              <Button variant={'link'} onClick={() => setIsDialogOpen(true)}>
                Upload Profile Pic
              </Button>
              <DialogFactory
                title="Add Profile Pic"
                setIsDialogOpen={setIsDialogOpen}
                isDialogOpen={isDialogOpen}
                description="Upload a profile picture for the vehicle."
                children={
                  <div>
                    <UploadForm
                      handleSubmit={handleSubmit}
                      inputFile={inputFile}
                      setFile={setFile}
                      uploading={uploading}
                    />
                  </div>
                }
              />
            </div>
          )}
          <CardTitle className="text-center">
            Sunbuggy Fleet{' '}
            <span className="text-orange-500">[{vehicleInfo.name}]</span>
          </CardTitle>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="edit-vehicle">
                <AccordionTrigger>Edit Vehicle</AccordionTrigger>
                <AccordionContent>
                  <EditVehicle id={id} cols={2} />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="show-normal-images">
                <AccordionTrigger>Show Normal Images</AccordionTrigger>
                <AccordionContent>
                  <ImageGrid images={images} />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="show-damage-pics">
                <AccordionTrigger>Show Damage Pics</AccordionTrigger>
                <AccordionContent>
                  <ImageGrid images={damageImages} />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="add-tag">
                <AccordionTrigger>Add Tag</AccordionTrigger>
                <AccordionContent>Placeholder for adding tags</AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    );
};

export default VehicleClientComponent;
