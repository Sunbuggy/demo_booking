'use client';

import React from 'react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { VehicleTagType, VehicleType } from '../../admin/page';
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
import DialogFactory from '@/components/dialog-factory';
import TagManagement from './tag-management';
import { User } from '@supabase/supabase-js';
import { createId } from '@paralleldrive/cuid2';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import ShuttlePretripForm from './pretrip-forms/shuttle/shuttle-pretrip-form';
import ShuttlePretripHistory from './pretrip-forms/shuttle/shuttle-pretrip-history';
import TruckPretripHistory from './pretrip-forms/truck/truck-pretrip-history';
import TruckPretripForm from './pretrip-forms/truck/truck-pretrip-form';
import ATVPretripHistory from './pretrip-forms/atv/atv-pretrip-history';
import ATVPretripForm from './pretrip-forms/atv/atv-pretrip-form';
import BuggyPretripHistory from './pretrip-forms/buggy/buggy-pretrip-history';
import BuggyPretripForm from './pretrip-forms/buggy/buggy-pretrip-form';
import ForkliftPretripForm from './pretrip-forms/forklift/forklift-pretrip-form';
import ForkliftPretripHistory from './pretrip-forms/forklift/forklift-pretrip-history';
import ResponsiveImageUpload from './responsive-image-upload-form';

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
  const supabase = createClient();
  const router = useRouter();
  const [isNewUploadDialogOpen, setIsNewUploadDialogOpen] =
    React.useState(false);
  const [isUpdateUploadDialogOpen, setIsUpdateUploadDialogOpen] =
    React.useState(false);
  const [isUploadImagesDialogOpen, setIsUploadImagesDialogOpen] =
    React.useState(false);
  const [isPretripFormOpen, setIsPretripFormOpen] = React.useState(false);

  React.useEffect(() => {
    const channel = supabase
      .channel('realtime vehicle tags and vehicle')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicle_tag'
        },
        () => {
          router.refresh();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicle'
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router]);

  const updateProfilePicTitle = (
    <div>
      <p>
        Update the Profile Pic for{' '}
        <span className="text-xl text-orange-500">{vehicleInfo.name}</span>
      </p>
    </div>
  );

  const addProfilePicTitle = (
    <div>
      <p>
        Add a Profile Pic for{' '}
        <span className="text-xl text-orange-500">{vehicleInfo.name}</span>
      </p>
    </div>
  );

  const uploadMoreImagesTitle = (
    <div>
      <p>
        Upload More Images for{' '}
        <span className="text-xl text-orange-500">{vehicleInfo.name}</span>
      </p>
    </div>
  );

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
                title={addProfilePicTitle}
                setIsDialogOpen={setIsNewUploadDialogOpen}
                isDialogOpen={isNewUploadDialogOpen}
                description="Upload a profile picture for the vehicle."
                children={
                  <div>
                    <ResponsiveImageUpload
                      url_key={`profile_pic/${id}`}
                      single={true}
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
                title={updateProfilePicTitle}
                setIsDialogOpen={setIsUpdateUploadDialogOpen}
                isDialogOpen={isUpdateUploadDialogOpen}
                description="Update the profile picture for the vehicle. Please just upload a single image."
                children={
                  <div>
                    <ResponsiveImageUpload
                      url_key={`profile_pic/${id}`}
                      updatePic={true}
                      single={true}
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
                  <EditVehicle id={id} />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="show-images">
                <AccordionTrigger>Show Images</AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-5">
                    <div>
                      <Button onClick={() => setIsUploadImagesDialogOpen(true)}>
                        Upload More Images
                      </Button>
                      <DialogFactory
                        title={uploadMoreImagesTitle}
                        setIsDialogOpen={setIsUploadImagesDialogOpen}
                        isDialogOpen={isUploadImagesDialogOpen}
                        description="Upload one or multiple images for the vehicle."
                        children={
                          <div>
                            <ResponsiveImageUpload
                              url_key={`vehicles/${id}/${createId()}`}
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
                    vehicle_name={vehicleInfo.name}
                  />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="pre-trip-form">
                <AccordionTrigger>Pretrip Form</AccordionTrigger>
                <AccordionContent>
                  <>
                    <Button
                      className="mb-5"
                      onClick={() => setIsPretripFormOpen(true)}
                    >
                      View Pretrip Form History
                    </Button>
                    <DialogFactory
                      title={'Pretrip Form History'}
                      setIsDialogOpen={setIsPretripFormOpen}
                      isDialogOpen={isPretripFormOpen}
                      description="History of pretrip forms for the vehicle."
                      children={
                        <>
                          {vehicleInfo.type === 'shuttle' && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
                              <ShuttlePretripHistory
                                veh_id={vehicleInfo.id}
                                vehicle_name={vehicleInfo.name}
                              />
                            </div>
                          )}
                          {vehicleInfo.type === 'truck' && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
                              <TruckPretripHistory
                                veh_id={vehicleInfo.id}
                                vehicle_name={vehicleInfo.name}
                              />
                            </div>
                          )}
                          {vehicleInfo.type === 'atv' && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
                              <ATVPretripHistory
                                veh_id={vehicleInfo.id}
                                vehicle_name={vehicleInfo.name}
                              />
                            </div>
                          )}

                          {vehicleInfo.type === 'buggy' && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
                              <BuggyPretripHistory
                                veh_id={vehicleInfo.id}
                                vehicle_name={vehicleInfo.name}
                              />
                            </div>
                          )}

                          {vehicleInfo.type === 'forktruck' && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
                              <ForkliftPretripHistory
                                veh_id={vehicleInfo.id}
                                vehicle_name={vehicleInfo.name}
                              />
                            </div>
                          )}
                        </>
                      }
                    />
                    {vehicleInfo.type === 'shuttle' && (
                      <div>
                        <ShuttlePretripForm
                          user_id={user.id}
                          vehicle_id={vehicleInfo.id}
                        />
                      </div>
                    )}
                    {vehicleInfo.type === 'truck' && (
                      <div>
                        <TruckPretripForm
                          user_id={user.id}
                          vehicle_id={vehicleInfo.id}
                        />
                      </div>
                    )}
                    {vehicleInfo.type === 'atv' && (
                      <div>
                        <ATVPretripForm
                          user_id={user.id}
                          vehicle_id={vehicleInfo.id}
                        />
                      </div>
                    )}
                    {vehicleInfo.type === 'buggy' && (
                      <div>
                        <BuggyPretripForm
                          user_id={user.id}
                          vehicle_id={vehicleInfo.id}
                        />
                      </div>
                    )}
                    {vehicleInfo.type === 'forktruck' && (
                      <div>
                        <ForkliftPretripForm
                          user_id={user.id}
                          vehicle_id={vehicleInfo.id}
                        />
                      </div>
                    )}
                  </>
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
