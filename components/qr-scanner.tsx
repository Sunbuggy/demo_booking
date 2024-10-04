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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';
import { UserType } from '@/app/(biz)/biz/users/types';
import { DrawerClose } from './ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import DialogFactory from './dialog-factory';
import ManualInventory from '@/app/(biz)/biz/vehicles/admin/tables/components/manual-inventory';

export const BarcodeScanner = ({ user }: { user: UserType | null }) => {
  const supabase = createClient();
  const [normalMode, setNormalMode] = React.useState(true);
  const [inventoryMode, setInventoryMode] = React.useState(false);
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
      <div className="flex flex-col items-center gap-2 mb-5">
        <h1 className="text-xl font-bold text-center">
          Mode: {inventoryMode ? 'Inventory' : 'Normal'}
        </h1>
        {inventoryMode && (
          <div>
            <Button onClick={() => setIsManualInventoryDialogOpen(true)}>
              +Manual Inventory
            </Button>
            <DialogFactory
              children={<ManualInventory user_id={user?.id || ''} />}
              isDialogOpen={isManualInventoryDialogOpen}
              setIsDialogOpen={setIsManualInventoryDialogOpen}
              title="Add Inventory Manually"
            />
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <div className="w-[150px] h-[150px]  ">
          <video ref={ref} />
        </div>
      </div>
      {/* Radio  for inventory Mode, and normal mode */}
      <div className="flex gap-2 items-center m-5">
        <input
          type="radio"
          id="normal"
          name="mode"
          value="normal"
          checked={normalMode}
          onChange={() => {
            setNormalMode(true);
            setInventoryMode(false);
          }}
        />
        <label htmlFor="normal">Normal</label>
        <input
          type="radio"
          id="inventory"
          name="mode"
          value="inventory"
          checked={inventoryMode}
          onChange={() => {
            setNormalMode(false);
            setInventoryMode(true);
          }}
        />
        <label htmlFor="inventory">Inventory</label>
      </div>
      {!inventoryMode &&
        (scannedUrls.length > 0 || scannedVehicleIds.length > 0) && (
          <Tabs defaultValue="new" className="w-[400px] mb-5">
            <TabsList className="w-full justify-center">
              <TabsTrigger value="new">New</TabsTrigger>
              <TabsTrigger value="legacy">Legacy</TabsTrigger>
            </TabsList>
            <TabsContent value="new">
              <div className="w-[400px]">
                {scannedVehicleIds.length > 0 && (
                  <div className="flex flex-col gap-4">
                    <h4 className="text-xl font ml-2">Scanned Vehicles:</h4>

                    <ScrollArea className="h-[200px] ml-2  rounded-md border p-4">
                      <div className=" grid grid-cols-4 gap-4">
                        {scannedVehicleIds.map((v, i) => (
                          <span key={i}>
                            <DrawerClose asChild>
                              <Link
                                className="green_button"
                                href={`/biz/vehicles/${v.id}`}
                              >
                                {v.name}
                              </Link>
                            </DrawerClose>
                          </span>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="legacy">
              <div className="w-[400px] ml-5">
                {scannedUrls.length > 0 && (
                  <ScrollArea className="h-[200px] rounded-md border p-4">
                    <h1>Scanned Urls</h1>
                    <ul className="flex flex-col gap-6">
                      {scannedUrls.map((url, i) => (
                        <li key={i}>
                          <Link
                            className=" underline text-pink-500"
                            href={`https://${url}`}
                            target="_blank"
                          >
                            {url}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      {inventoryMode && scannedVehicleIds.length > 0 && (
        <ScrollArea className="h-[120px]  rounded-md border p-4 w-full">
          <div className="grid grid-cols-4 gap-4 ml-5">
            {scannedVehicleIds.map((v, i) => (
              <span key={i} className="flex gap-2 items-center">
                <input
                  type="checkbox"
                  id={v.id}
                  name={v.name}
                  value={v.id as string}
                  onChange={handleCheckboxChange}
                  checked={!!selectedForInventory[v.id]} // Ensure boolean value
                />
                <label htmlFor={v.id}>{v.name}</label>
              </span>
            ))}
          </div>
        </ScrollArea>
      )}
      {inventoryMode && scannedVehicleIds.length > 0 && (
        <div>
          <div className="w-full flex flex-col justify-center items-center my-3 gap-1 border rounded-lg p-3 text-sm">
            <h1 className="text-sm font-bold">
              Add Selected Fleet to Inventory
            </h1>

            <div className="flex flex-col my-5">
              <label className="mb-2">Bay</label>
              <input
                type="text"
                value={bay}
                onChange={(e) => setBay(e.target.value)}
                className="input w-full"
              />
              <label className="mt-3 mb-2">Level</label>
              <input
                type="text"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="input w-full"
              />
            </div>

            <Button onClick={handleSubmit} className="w-full">
              Submit Inventory Location
            </Button>
          </div>

          <Button variant={'positive'} onClick={handleSubmit}>
            +Add
          </Button>
        </div>
      )}
      {/* Camera toggle Button */}
      <div className="flex justify-center m-5">
        <Button
          variant={'destructive'}
          onClick={() => setCloseCamera(!closeCamera)}
        >
          {closeCamera ? 'Open Camera' : 'Close Camera'}
        </Button>
      </div>
    </div>
  );
};
