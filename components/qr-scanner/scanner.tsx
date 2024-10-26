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
import { MapPin } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import useSound from 'use-sound';

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
  const [pingSound] = useSound('/audios/ping.mp3');
  const [errSound] = useSound('/audios/err.mp3');
  const [level, setLevel] = React.useState('');
  const [result, setResult] = React.useState('');
  const [closeCamera, setCloseCamera] = React.useState(false);
  const [scannedUrls, setScannedUrls] = React.useState<string[]>([]);
  const [city, setCity] = React.useState<string>('');
  const [locationSet, setLocationSet] = React.useState(false);
  const { toast } = useToast();
  const [currentLocation, setCurrentLocation] = React.useState<{
    latitude: number;
    longitude: number;
  }>({ latitude: 0, longitude: 0 });
  const [scannedVehicleIds, setScannedVehicleIds] = React.useState<
    { name: string; id: string; status: string }[]
  >([]);

  const { ref } = useZxing({
    paused: closeCamera,
    onDecodeResult(result) {
      setResult(result.getText());
      //   close the camera after scanning if in single mode
    }
  });

  // useEffect to get the current device location
  React.useEffect(() => {
    // if User rejects the location access then disallow the scanning
    if (!navigator.geolocation) {
      alert('Please allow location access to scan the QR code');
      setCloseCamera(true);
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!position) return;
        if (position.coords.latitude === 0 && position.coords.longitude === 0)
          return;
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLocationSet(true);
      },
      (error) => {
        console.error(error);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    // Get the city name from the lat and long
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (currentLocation.latitude === 0 || currentLocation.longitude === 0) {
        errSound();
        toast({
          title: 'Location Not Set',
          description: 'Location not set please allow location access',
          duration: 7000,
          variant: 'destructive'
        });

        return;
      }
      // Get the city name from the lat and long using getLocationType if unknown then use the api
      const preDefinedLocation = getLocationType(
        currentLocation.latitude,
        currentLocation.longitude
      );
      // if predifined location is unknown then use the api to get the city name
      if (preDefinedLocation === 'Unknown') {
        fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${currentLocation.latitude}&longitude=${currentLocation.longitude}&localityLanguage=en`
        )
          .then((res) => res.json())
          .then((data) => {
            setCity(data.city);
          });
      } else {
        setCity(preDefinedLocation);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [currentLocation]);

  React.useEffect(() => {
    if (result && result.includes('/fleet/')) {
      // if the scanned url is already scanned then dont scan it again
      if (scannedUrls.includes(result)) {
        errSound();
        toast({
          title: 'Already Scanned',
          description: `Already Scanned ${result}`,
          duration: 3000,
          variant: 'destructive'
        });
        return;
      }
      if (!scannedUrls.includes(result)) {
        setScannedUrls([...scannedUrls, result]);
        toast({
          title: 'Scanned',
          description: `Scanned ${result}`,
          duration: 500,
          variant: 'success'
        });
        pingSound();
      }
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
          const veh_status = res[0].vehicle_status as string;
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
              { name: true_veh_name, id: veh_id, status: veh_status }
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
    if (!result.includes('/fleet/')) {
      setScannedUrls([]);
      errSound();
    }
  }, [result]);

  const locationCoordinates = {
    vegasShop: { lat: 36.278439, lon: -115.020068 },
    pismoShop: { lat: 35.105821, lon: -120.63038 },
    nellis: [
      { lat: 36.288471, lon: -114.970005 },
      { lat: 36.316064, lon: -114.944085 }
    ],
    pismoBeach: { lat: 35.090735, lon: -120.629598 }, //0.25 from here
    silverlakeShop: { lat: 43.675239, lon: -86.472552 },
    silverlakeDunes: { lat: 43.686365, lon: -86.508345 }
  };

  const pismoBeachCoordinates = [
    { lat: 35.093107, lon: -120.630094 },
    { lat: 35.093195, lon: -120.628131 },
    { lat: 35.086662, lon: -120.627954 },
    { lat: 35.086777, lon: -120.630302 }
  ];

  const pismoDunesCoordinates = [
    { lat: 35.078224, lon: -120.630382 },
    { lat: 35.078631, lon: -120.623262 },
    { lat: 35.036037, lon: -120.621555 },
    { lat: 35.036288, lon: -120.633892 }
  ];

  function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  function getDistanceFromLatLonInMiles(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 3958.8;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  function isPointInPolygon(
    lat: number,
    lon: number,
    coordinates: { lat: number; lon: number }[]
  ): boolean {
    let inside = false;
    for (
      let i = 0, j = coordinates.length - 1;
      i < coordinates.length;
      j = i++
    ) {
      const xi = coordinates[i].lat,
        yi = coordinates[i].lon;
      const xj = coordinates[j].lat,
        yj = coordinates[j].lon;

      const intersect =
        yi > lon !== yj > lon &&
        lat < ((xj - xi) * (lon - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  function isBetweenCoordinates(
    lat: number,
    lon: number,
    coordinates: { lat: number; lon: number }[]
  ): boolean {
    return isPointInPolygon(lat, lon, coordinates);
  }

  function isNearLocation(
    lat: number,
    lon: number,
    location: keyof typeof locationCoordinates,
    setDistance: number = 2
  ): boolean {
    const coordinates = locationCoordinates[location];
    if (Array.isArray(coordinates)) {
      return coordinates.some(
        (coord) =>
          getDistanceFromLatLonInMiles(lat, lon, coord.lat, coord.lon) <=
          setDistance
      );
    }
    return (
      getDistanceFromLatLonInMiles(
        lat,
        lon,
        coordinates.lat,
        coordinates.lon
      ) <= setDistance
    );
  }

  function getLocationType(lat: number, lon: number): string {
    if (isNearLocation(lat, lon, 'vegasShop')) return 'Vegas Shop';
    if (isNearLocation(lat, lon, 'pismoShop', 0.5)) return 'Pismo Shop';
    if (isNearLocation(lat, lon, 'nellis')) return 'Vegas Nellis';
    if (isBetweenCoordinates(lat, lon, pismoBeachCoordinates))
      return 'Pismo Beach';
    if (isBetweenCoordinates(lat, lon, pismoDunesCoordinates))
      return 'Pismo Dunes';
    if (isNearLocation(lat, lon, 'silverlakeShop')) return 'Silver Lake Shop';
    if (isNearLocation(lat, lon, 'silverlakeDunes', 0.25))
      return 'Silver Lake Dunes';

    return 'Unknown';
  }

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
    }
  };

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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <MapPin
                    size={24}
                    className={`${locationSet ? 'text-green-500' : 'text-red-500'}`}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  {locationSet
                    ? 'Location Set'
                    : ' Allow  location access to scan the QR code'}
                  <br />
                  {/* Show Current Location */}
                  {'Latitude: ' + currentLocation.latitude}
                  <br />
                  {'Longitude: ' + currentLocation.longitude}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

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
            <div className="w-[150px] h-[150px]">
              <video ref={ref} />
            </div>
          </div>
          {locationSet ? (
            <></>
          ) : (
            <div>
              <h1 className="text-center text-red-500">
                PLEASE ALLOW LOCATION ACCESS!!
              </h1>
            </div>
          )}
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
        <div className="m-4">
          <TaggingMode id={scannedVehicleIds[0].id} user={user} />
        </div>
      )}
    </div>
  );
};
