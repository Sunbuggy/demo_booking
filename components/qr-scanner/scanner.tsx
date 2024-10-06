'use client';
import { useZxing } from 'react-zxing';
import React from 'react';
import { createClient } from '@/utils/supabase/client';
import {
  fetchVehicleLocations,
  getVehicleIdFromName,
  insertIntoVehicleInventoryLocation,
  recordVehicleLocation
} from '@/utils/supabase/queries';
import ManualInventory from '@/app/(biz)/biz/vehicles/admin/tables/components/manual-inventory';
import { useToast } from '../ui/use-toast';
import { Button } from '../ui/button';
import DialogFactory from '../dialog-factory';
import NormalMode from './normal-mode';
import InventoryModeScroll from './inventory-result-scroll';
import InventoryForm from './inventory-form';
import TaggingMode from './tagging-mode';
import { User } from '@supabase/supabase-js';

export const BarcodeScanner = ({ user }: { user: User | null | undefined }) => {
  const supabase = createClient();
  const [normalMode, setNormalMode] = React.useState(true);
  const [inventoryMode, setInventoryMode] = React.useState(false);
  const [taggingMode, setTaggingMode] = React.useState(false);
  const [selectedForInventory, setSelectedForInventory] = React.useState<{
    [key: string]: boolean;
  }>({});
  const [isManualInventoryDialogOpen, setIsManualInventoryDialogOpen] =
    React.useState(false);
  const [bay, setBay] = React.useState('');
  const [level, setLevel] = React.useState('');
  const [result, setResult] = React.useState('');
  const [closeCamera, setCloseCamera] = React.useState(false);
  const [scannedUrls, setScannedUrls] = React.useState<string[]>([]);
  const [city, setCity] = React.useState<string>('');
  const { toast } = useToast();
  const [currentLocation, setCurrentLocation] = React.useState<{
    latitude: number;
    longitude: number;
  }>({ latitude: 0, longitude: 0 });
  const [scannedVehicleIds, setScannedVehicleIds] = React.useState<
    { name: string; id: string }[]
  >([]);

  const { ref } = useZxing({
    paused: closeCamera,
    onDecodeResult(result) {
      setResult(result.getText());
      //   close the camera after scanning if in single mode
    }
  });

  // Function to save the scanned /fleet/ URL to Supabase (qr_history table)
  const saveScannedUrlToHistory = async (link: string, location: string) => {
    if (!user || !link.includes('/fleet/')) return;

    const { data, error } = await supabase.from('qr_history').insert([
      {
        user: user.id,
        link,
        scanned_at: new Date().toISOString(),
        location,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude
      }
    ]);

    if (error) {
      console.error('Error saving QR scan:', error);
      toast({
        title: 'Error',
        description: 'Could not save QR scan to history.',
        variant: 'destructive'
      });
    } else {
      console.log('QR scan saved:', data);
    }
  };

  // useEffect to get the current device location
  React.useEffect(() => {
    // if User rejects the location access then disallow the scanning
    if (!navigator.geolocation) {
      alert('Please allow location access to scan the QR code');
      setCloseCamera(true);
    }

    navigator.geolocation.getCurrentPosition((position) => {
      if (!position) return;
      if (position.coords.latitude === 0 && position.coords.longitude === 0)
        return;
      setCurrentLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
    });

    // Get the city name from the lat and long
  }, []);

  React.useEffect(() => {
    if (currentLocation.latitude === 0 && currentLocation.longitude === 0)
      return;
    fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${currentLocation.latitude}&longitude=${currentLocation.longitude}&localityLanguage=en`
    )
      .then((res) => res.json())
      .then((data) => {
        setCity(data.city);
      });
  }, [currentLocation]);

  React.useEffect(() => {
    if (!scannedUrls.includes(result) && result !== '') {
      setScannedUrls([...scannedUrls, result]);
    }
    if (result && result.includes('/fleet/')) {
      const veh_name = result.split('/fleet/')[1].toLowerCase();
      //   if veh_name is just a number then add sb infront of it if it has a letter then just use it
      const true_veh_name = isNaN(parseInt(veh_name))
        ? veh_name
        : `sb${veh_name}`;

      // Save the scanned /fleet/ URL to the qr_history table
      saveScannedUrlToHistory(result, city);

      getVehicleIdFromName(supabase, true_veh_name)
        .then((res) => {
          const veh_id = res[0].id as string;
          const vehicleLocation = {
            city: city,
            created_at: new Date().toISOString(),
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            vehicle_id: veh_id,
            created_by: user?.id ?? 'unknown'
          };

          if (
            !scannedVehicleIds.find((v) => v.id === veh_id) &&
            !scannedUrls.includes(result)
          ) {
            // before inserting the record check if the last created_at if the latitude and longitude is less than 5meters then dont insert
            fetchVehicleLocations(supabase, veh_id)
              .then((res) => {
                if (res.length > 0) {
                  const lastLocation = res[res.length - 1];
                  const distance = Math.sqrt(
                    Math.pow(
                      lastLocation.latitude - currentLocation.latitude,
                      2
                    ) +
                      Math.pow(
                        lastLocation.longitude - currentLocation.longitude,
                        2
                      )
                  );
                  // calculate the distance between the last record and the current record
                  if (distance < 0.0005) {
                    toast({
                      title: 'Vehicle Location Not Updated',
                      description: `Vehicle location not updated for ${true_veh_name} as it is less than 50 meters`,
                      duration: 500,
                      variant: 'default'
                    });
                    return;
                  } else {
                    recordVehicleLocation(supabase, vehicleLocation)
                      .then((res) => {
                        toast({
                          title: 'Vehicle Location Updated',
                          description: `Vehicle location updated for ${true_veh_name}`,
                          duration: 500,
                          variant: 'success'
                        });
                      })
                      .catch((err) => {
                        console.error(err);
                        toast({
                          title: 'error',
                          description: 'Error Occured Please Contact Devs',
                          duration: 5000,
                          variant: 'destructive'
                        });
                      });
                  }
                } else {
                  recordVehicleLocation(supabase, vehicleLocation)
                    .then((res) => {
                      toast({
                        title: 'First Location Created',
                        description: `First Vehicle location Created for ${true_veh_name}`,
                        duration: 5000,
                        variant: 'success'
                      });
                    })
                    .catch((err) => {
                      console.error(err);
                      toast({
                        title: 'error',
                        description: 'Error Occured Please Contact Devs',
                        duration: 5000,
                        variant: 'destructive'
                      });
                    });
                }
              })
              .catch((err) => {
                console.error(err);
                toast({
                  title: 'error',
                  description: 'Error Occured Please Contact Devs',
                  duration: 5000,
                  variant: 'destructive'
                });
              });

            setScannedVehicleIds([
              ...scannedVehicleIds,
              { name: true_veh_name, id: veh_id }
            ]);
          }
        })
        .catch((err) => {
          console.error(err);
          toast({
            title: 'error',
            description: 'Error Occured Please Contact Devs',
            duration: 5000,
            variant: 'destructive'
          });
        });
    }
  }, [result]);

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { id, checked } = event.target;
    setSelectedForInventory((prevState) => ({
      ...prevState,
      [id]: checked
    }));
  };

  // Handle submit button click
  const handleSubmit = () => {
    const checkedVehicleIds = Object.keys(selectedForInventory).filter(
      (id) => selectedForInventory[id]
    );

    checkedVehicleIds.forEach((id) => {
      const inventory_location = {
        bay,
        level,
        created_at: new Date().toISOString(),
        created_by: user?.id ?? 'unknown',
        vehicle_id: id
      };
      insertIntoVehicleInventoryLocation(supabase, inventory_location)
        .then((res) => {
          toast({
            title: 'Vehicle Inventory Location Updated',
            description: `Vehicle Inventory location updated `,
            duration: 500,
            variant: 'success'
          });
        })
        .catch((err) => {
          console.error(err);
          toast({
            title: 'error',
            description: 'Error Occured Please Contact Devs',
            duration: 5000,
            variant: 'destructive'
          });
        });
    });

    // Remove the selected vehicles from the scannedVehicleIds
    setScannedVehicleIds((prevScannedVehicleIds) =>
      prevScannedVehicleIds.filter((v) => !checkedVehicleIds.includes(v.id))
    );

    // Clear the selectedForInventory state
    setSelectedForInventory({});
  };

  return (
    <div className="h-[70vh]">
      <div className="flex w-full gap-4">
        <div>
          <div className="flex flex-col items-center gap-2 mb-5">
            <h1 className="text-xl font-bold text-center">
              Mode:
              {/* Create select to select mode */}
              <select
                className="border rounded-md p-1 m-2 text-sm"
                onChange={(e) => {
                  switch (e.target.value) {
                    case 'normal':
                      setNormalMode(true);
                      setInventoryMode(false);
                      setTaggingMode(false);
                      break;
                    case 'inventory':
                      setNormalMode(false);
                      setInventoryMode(true);
                      setTaggingMode(false);
                      break;
                    case 'tagging':
                      setNormalMode(false);
                      setInventoryMode(false);
                      setTaggingMode(true);
                      break;
                  }
                }}
              >
                <option value="normal">Main</option>
                <option value="inventory">Inventory</option>
                <option value="tagging">Tagging</option>
              </select>
            </h1>
          </div>

          <div className="flex justify-center">
            <div className="w-[150px] h-[150px]  ">
              <video ref={ref} />
            </div>
          </div>
        </div>
        <div>
          {normalMode &&
            (scannedUrls.length > 0 || scannedVehicleIds.length > 0) && (
              <NormalMode
                scannedVehicleIds={scannedVehicleIds}
                scannedUrls={scannedUrls}
              />
            )}
          {inventoryMode && scannedVehicleIds.length > 0 && (
            <InventoryModeScroll
              scannedVehicleIds={scannedVehicleIds}
              handleCheckboxChange={handleCheckboxChange}
              selectedForInventory={selectedForInventory}
            />
          )}
        </div>
      </div>

      {inventoryMode && (
        <div>
          <Button onClick={() => setIsManualInventoryDialogOpen(true)}>
            +Manual Inventory
          </Button>
          <DialogFactory
            disableCloseButton={true}
            children={<ManualInventory user_id={user?.id || ''} />}
            isDialogOpen={isManualInventoryDialogOpen}
            setIsDialogOpen={setIsManualInventoryDialogOpen}
            title="Add Inventory Manually"
          />
        </div>
      )}

      {inventoryMode && scannedVehicleIds.length > 0 && (
        <InventoryForm
          setBay={setBay}
          setLevel={setLevel}
          bay={bay}
          level={level}
          handleSubmit={handleSubmit}
        />
      )}

      {taggingMode && scannedVehicleIds.length === 1 && user && (
        <TaggingMode id={scannedVehicleIds[0].id} user={user} />
      )}
    </div>
  );
};
