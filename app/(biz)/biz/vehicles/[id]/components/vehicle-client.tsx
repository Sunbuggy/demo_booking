'use client';

import React from 'react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { VehicleTagType, VehicleType } from '../../admin/page';
import EditVehicle from '../../admin/tables/components/edit-vehicle';
import ImageView from './image-view';
import Link from 'next/link';
import { ArrowBigLeftIcon } from 'lucide-react';
import { VehiclePics } from '../../admin/tables/components/row-actions';
import { VehicleGifs } from '../../admin/tables/components/row-actions-gif';
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
import { useToast } from '@/components/ui/use-toast';

import ResponsiveFileUpload from './responsive-file-upload';
import LocationHistory from './vehicle-location-history';
import PretripFormManager from './pretrip-forms/pretrip-form-manager';
import InventoryHistory from './vehicle-location-inventory-history';
import { InventoryLocation, VehicleLocation } from '../../types';
import LocationScheduling from './location-scheduling';
import { VehiclePdf } from '../../admin/tables/components/row-action-pdf';
import PDFList from './pdf-view';
import QRCodeGenerator from '../../../qr/components/QRCodeGenerator';
import {
  fetchVehicleLocations,
  recordVehicleLocation
} from '@/utils/supabase/queries';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface VehicleClientComponentProps {
  id: string;
  initialVehicleInfo: VehicleType;
  images: VehiclePics[];
  gif: VehicleGifs[];
  registrationPdf: VehiclePdf[];
  titlePdf: VehiclePdf[];
  insurancePdf?: VehiclePdf[];
  profilePic?: string;
  vehicleTags: VehicleTagType[];
  user: User;
  vehicleLocations: VehicleLocation[];
  inventoryLocations: InventoryLocation[];
}

const VehicleClientComponent: React.FC<VehicleClientComponentProps> = ({
  id,
  initialVehicleInfo,
  profilePic,
  images,
  gif,
  registrationPdf,
  titlePdf,
  insurancePdf = [],
  vehicleTags,
  user,
  vehicleLocations,
  inventoryLocations
}) => {
  const vehicleInfo = initialVehicleInfo;
  const supabase = createClient();
  const { toast } = useToast();
  const location: {
    [key in 'vegas' | 'pismo' | 'silverlake']: { lat: number; lon: number };
  } = {
    vegas: { lat: 36.278439, lon: -115.020068 },
    pismo: { lat: 35.105821, lon: -120.63038 },
    silverlake: { lat: 43.675239, lon: -86.472552 }
  };
  const [city, setCity] = React.useState<keyof typeof location | ''>('');
  const [isNewUploadDialogOpen, setIsNewUploadDialogOpen] =
    React.useState(false);
  const [isUpdateUploadDialogOpen, setIsUpdateUploadDialogOpen] =
    React.useState(false);
  const [isUploadImagesDialogOpen, setIsUploadImagesDialogOpen] =
    React.useState(false);
  const [isUploadGifsDialogOpen, setIsUploadGifsDialogOpen] =
    React.useState(false);
  const [isUploadRegDialogOpen, setIsUploadRegDialogOpen] =
    React.useState(false);
  const [isUploadTitleDialogOpen, setIsUploadTitleDialogOpen] =
    React.useState(false);
  const [isUploadInsuranceDialogOpen, setIsUploadInsuranceDialogOpen] =
    React.useState(false);
  const [isLocationManagementDialogOpen, setIsLocationManagementDialogOpen] =
    React.useState(false);
  const [
    isLocationCurrentManagementDialogOpen,
    setIsLocationCurrentManagementDialogOpen
  ] = React.useState(false);
  const [
    isInventoryLocationManagementDialogOpen,
    setIsInventoryLocationManagementDialogOpen
  ] = React.useState(false);
  const [isPretripFormOpen, setIsPretripFormOpen] = React.useState(false);
  const [islocationSchedulingDialogOpen, setIsLocationSchedulingDialogOpen] =
    React.useState(false);
  // Add new state for the tag management dialog
  const [isTagManagementDialogOpen, setIsTagManagementDialogOpen] =
    React.useState(false);

  React.useEffect(() => {
    async function getLocation() {
      try {
        const data = await fetchVehicleLocations(supabase, vehicleInfo.id);
        if (data && data.length > 0) {
          // changes location of vehicle if page loads 
          // setCity(data[0].city);
        }
      } catch (error) {
        console.error('Failed to fetch vehicle location:', error);
      }
    }

    getLocation();
  }, [vehicleInfo.id, supabase]);

  React.useEffect(() => {
    const channel = supabase
      .channel('realtime vehicle locator')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicle_locations'
        },
        () => {
          // Use window.location.reload() instead of router.refresh()
          window.location.reload();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'groups'
        },
        () => {
          window.location.reload();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

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
          window.location.reload();
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
          window.location.reload();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  React.useEffect(() => {
    const location: {
      [key in 'vegas' | 'pismo' | 'silverlake']: { lat: number; lon: number };
    } = {
      vegas: { lat: 36.278439, lon: -115.020068 },
      pismo: { lat: 35.105821, lon: -120.63038 },
      silverlake: { lat: 43.675239, lon: -86.472552 }
    };
    if (city) {
      if (!location[city]?.lat || !location[city]?.lon) {
        return;
      }

      if (location[city]?.lat === 0 || location[city]?.lon === 0) {
        return;
      }
      if (
        location[city]?.lat === undefined ||
        location[city]?.lon === undefined
      ) {
        return;
      }

      recordVehicleLocation(supabase, {
        vehicle_id: id,
        latitude: location[city]?.lat,
        longitude: location[city]?.lon,
        city: city,
        created_at: new Date().toISOString(),
        created_by: user.id
      })
        .then((data) => {
          toast({
            title: 'Success',
            description: 'Vehicle location recorded successfully',
            variant: 'success',
            duration: 3000
          });
          setCity('');
          setIsLocationCurrentManagementDialogOpen(false);
        })
        .catch((error) => {
          toast({
            title: 'Error',
            description: 'Error recording vehicle location',
            variant: 'destructive',
            duration: 3000
          });
        });
    }
  }, [city, id, user.id, supabase, toast]);

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

  const uploadMoreGifsTitle = (
    <div>
      <p>
        Upload More badges for{' '}
        <span className="text-xl text-orange-500">{vehicleInfo.name}</span>
      </p>
    </div>
  );

  const uploadMoreRegistration = (
    <div>
      <p>
        Upload More Registration for{' '}
        <span className="text-xl text-orange-500">{vehicleInfo.name}</span>
      </p>
    </div>
  );

  const uploadMoreTitle = (
    <div>
      <p>
        Upload More Title for{' '}
        <span className="text-xl text-orange-500">{vehicleInfo.name}</span>
      </p>
    </div>
  );

  const uploadMoreInsurance = (
    <div>
      <p>
        Upload More Insurance for{' '}
        <span className="text-xl text-orange-500">{vehicleInfo.name}</span>
      </p>
    </div>
  );

  const tagManagementTitle = (
    <div>
      <p>
        Tag Management for{' '}
        <span className="text-xl text-orange-500">{vehicleInfo.name}</span>
      </p>
    </div>
  );

  if (!vehicleInfo) {
    return <div>Loading vehicle information...</div>;
  }

  return (
    <div className="md:w-[800px] w-[375px] space-y-5 relative">
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
            >
              <div>
                <ResponsiveFileUpload
                  url_key={`profile_pic/${id}`}
                  single={true}
                  acceptedFormats="image/*"
                />
              </div>
            </DialogFactory>
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
            >
              <div>
                <ResponsiveFileUpload
                  url_key={`profile_pic/${id}`}
                  updateFile={true}
                  single={true}
                  acceptedFormats="image/*"
                />
              </div>
            </DialogFactory>
          </div>
        )}
        <CardTitle className="text-center mt-5">
          Sunbuggy Fleet{' '}
          <span className="text-orange-500">[{vehicleInfo.name}]</span>
        </CardTitle>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
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

            <AccordionItem value="edit-vehicle">
              <AccordionTrigger>Edit Vehicle Details</AccordionTrigger>
              <AccordionContent>
                <EditVehicle id={id} />
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="show-images">
              <AccordionTrigger>Images</AccordionTrigger>
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
                    >
                      <div>
                        <ResponsiveFileUpload
                          url_key={`vehicles/${id}/${createId()}`}
                          acceptedFormats="image/*"
                          maxFiles={10}
                        />
                      </div>
                    </DialogFactory>
                  </div>
                  <ImageGrid
                    images={images}
                    width={200}
                    height={120}
                    gifs={[]}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="show-badges">
              <AccordionTrigger>Badge</AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-5">
                  <div>
                    <Button onClick={() => setIsUploadGifsDialogOpen(true)}>
                      Upload More badges
                    </Button>
                    <DialogFactory
                      title={uploadMoreGifsTitle}
                      setIsDialogOpen={setIsUploadGifsDialogOpen}
                      isDialogOpen={isUploadGifsDialogOpen}
                      description="Upload one or multiple images for the vehicle."
                    >
                      <div>
                        <ResponsiveFileUpload
                          url_key={`badges/${id}`}
                          acceptedFormats="image/gif"
                          maxFiles={10}
                        />
                      </div>
                    </DialogFactory>
                  </div>
                  <ImageGrid
                    gifs={gif}
                    width={200}
                    height={120}
                    images={[]}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="pre-trip-form">
              <AccordionTrigger>Pretrip Form</AccordionTrigger>
              <AccordionContent>
                <PretripFormManager
                  setIsPretripFormOpen={setIsPretripFormOpen}
                  isPretripFormOpen={isPretripFormOpen}
                  vehicleInfo={vehicleInfo}
                  user={user}
                />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="location-management">
              <AccordionTrigger>Location Management</AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-5 mb-5">
                  <Button
                    onClick={() =>
                      setIsLocationCurrentManagementDialogOpen(true)
                    }
                  >
                    Set Current Location
                  </Button>
                  <DialogFactory
                    title={'Location Setting'}
                    setIsDialogOpen={setIsLocationCurrentManagementDialogOpen}
                    isDialogOpen={isLocationCurrentManagementDialogOpen}
                    description="Manage the current and future location for the vehicle."
                  >
                    <div className="flex flex-col gap-5 w-full">
                      <Select
                        name="current-location"
                        onValueChange={(e) =>
                          setCity(e as keyof typeof location)
                        }
                        defaultValue={city}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select A Current Location" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vegas">Vegas</SelectItem>
                          <SelectItem value="pismo">Pismo</SelectItem>
                          <SelectItem value="silverlake">
                            Silver Lake
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </DialogFactory>
                </div>
                <div className="flex flex-col gap-5">
                  <Button
                    onClick={() => setIsLocationManagementDialogOpen(true)}
                  >
                    Location History
                  </Button>
                  <DialogFactory
                    title={'Location History'}
                    setIsDialogOpen={setIsLocationManagementDialogOpen}
                    isDialogOpen={isLocationManagementDialogOpen}
                    description="Manage the current and future location for the vehicle."
                  >
                    <LocationHistory
                      vehicleLocations={vehicleLocations}
                      locCreator={true}
                      user_id={user.id}
                    />
                  </DialogFactory>
                  <Button
                    onClick={() =>
                      setIsInventoryLocationManagementDialogOpen(true)
                    }
                  >
                    Inventory Location History
                  </Button>
                  <DialogFactory
                    title={'Inventory Location History'}
                    setIsDialogOpen={
                      setIsInventoryLocationManagementDialogOpen
                    }
                    isDialogOpen={isInventoryLocationManagementDialogOpen}
                    description="Manage the current and future location for the vehicle."
                  >
                    <InventoryHistory
                      inventoryLocations={inventoryLocations}
                    />
                  </DialogFactory>
                  <Button
                    onClick={() => setIsLocationSchedulingDialogOpen(true)}
                  >
                    Location Scheduling
                  </Button>
                  <DialogFactory
                    title={'Location Scheduling'}
                    setIsDialogOpen={setIsLocationSchedulingDialogOpen}
                    isDialogOpen={islocationSchedulingDialogOpen}
                    description="Manage the scheduling of future location for the vehicle."
                  >
                    <LocationScheduling
                      user_id={user.id}
                      vehicle_id={vehicleInfo.id}
                    />
                  </DialogFactory>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="show-registration">
              <AccordionTrigger>Registration</AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-5">
                  <Button onClick={() => setIsUploadRegDialogOpen(true)}>
                    Upload Registration
                  </Button>
                  <DialogFactory
                    title={uploadMoreRegistration}
                    setIsDialogOpen={setIsUploadRegDialogOpen}
                    isDialogOpen={isUploadRegDialogOpen}
                    description="Upload one or multiple pdf for the vehicle registration."
                  >
                    <div>
                      <ResponsiveFileUpload
                        url_key={`registrations/${id}`}
                        renamePDFsToDate={true}
                      />
                    </div>
                  </DialogFactory>
                  <PDFList pdfList={registrationPdf} type="registration" />
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="show-title">
              <AccordionTrigger>Title</AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-5">
                  <Button onClick={() => setIsUploadTitleDialogOpen(true)}>
                    Upload Title
                  </Button>
                  <DialogFactory
                    title={uploadMoreTitle}
                    setIsDialogOpen={setIsUploadTitleDialogOpen}
                    isDialogOpen={isUploadTitleDialogOpen}
                    description="Upload one or multiple pdf for the vehicle titles."
                  >
                    <div>
                      <ResponsiveFileUpload
                        url_key={`titles/${id}`}
                        renamePDFsToDate={true}
                      />
                    </div>
                  </DialogFactory>
                  <PDFList pdfList={titlePdf} type="title" />
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="show-insurance">
              <AccordionTrigger>Insurance</AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-5">
                  <Button onClick={() => setIsUploadInsuranceDialogOpen(true)}>
                    Upload Insurance
                  </Button>
                  <DialogFactory
                    title={uploadMoreInsurance}
                    setIsDialogOpen={setIsUploadInsuranceDialogOpen}
                    isDialogOpen={isUploadInsuranceDialogOpen}
                    description="Upload one or multiple pdf for the vehicle insurance."
                  >
                    <div>
                      <ResponsiveFileUpload
                        url_key={`insurance/${id}`}
                        renamePDFsToDate={true}
                      />
                    </div>
                  </DialogFactory>
                  <PDFList pdfList={insurancePdf} type="insurance" />
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="show-vehicle-status">
              <AccordionTrigger>Print QR Code</AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-5">
                  <QRCodeGenerator
                    defUrl={`https://sunbuggy.com/fleet/${vehicleInfo.name}`}
                    defTopText={vehicleInfo.name
                      .match(/[a-zA-Z]+/g)
                      ?.join('')}
                    defBottomText={vehicleInfo.name
                      .match(/[0-9]+/g)
                      ?.join('')}
                    hidden={true}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Updated vehicle status indicator - now clickable */}
      <button
        onClick={() => setIsTagManagementDialogOpen(true)}
        className={`absolute top-12 right-6 transform rotate-45 translate-x-1/2 -translate-y-1/2 border-1 rounded-md text-white px-6 py-1 font-bold cursor-pointer transition-all hover:scale-105 ${vehicleInfo.vehicle_status === 'maintenance' ? 'bg-yellow-600' : vehicleInfo.vehicle_status === 'broken' ? 'bg-red-600' : vehicleInfo.vehicle_status === 'former' ? 'bg-gray-600' : 'bg-green-600'}`}
      >
        {vehicleInfo.vehicle_status}
      </button>

      {/* Tag Management Dialog */}
      <DialogFactory
        title={tagManagementTitle}
        setIsDialogOpen={setIsTagManagementDialogOpen}
        isDialogOpen={isTagManagementDialogOpen}
        description="Manage tags and status for the vehicle."
      >
        <TagManagement
          tags={vehicleTags}
          id={vehicleInfo.id}
          user={user}
          vehicle_name={vehicleInfo.name}
        />
      </DialogFactory>
    </div>
  );
};

export default VehicleClientComponent;