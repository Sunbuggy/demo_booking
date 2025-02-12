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
import { MapPin, RotateCcw } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import useSound from 'use-sound';
import SearchVehicles from './search-vehicles';
export const BarcodeScanner = ({
  user,
  setIsDialogOpen
}: {
  user: User | null | undefined;
  setIsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
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
    { name: string; id: string; status: string; pet_name: string }[]
  >([]);

  const { ref } = useZxing({
    paused: closeCamera,
    onDecodeResult(result) {
      setResult(result.getText());
      //   close the camera after scanning if in single mode
    }
  });

  React.useEffect(() => {
    // console.log('ids:', scannedVehicleIds);
  }, [scannedVehicleIds]);

  // notify via toast when location is set
  React.useEffect(() => {
    if (locationSet) {
      toast({
        title: 'Location Set',
        description: 'Location Set',
        duration: 3000,
        variant: 'success'
      });
    }
  }, [locationSet]);

  // useEffect to get the current device location
  React.useEffect(() => {
    // if User rejects the location access then disallow the scanning
    if (!navigator.geolocation) {
      alert(
        'Geolocation is not supported by your browser. Please use a modern browser.'
      );
      setCloseCamera(true);
      return;
    }

    // Request the user to allow location access. This call will trigger the browser's prompt if not already granted.
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Permission granted: do nothing here as location fetching is handled later.
      },
      (error) => {
        alert('Please allow location access to scan the QR code');
        setCloseCamera(true);
        // send a request to the user to allow location access
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );

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
      // Check if the scanned URL has already been processed
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
      setScannedUrls([...scannedUrls, result]);
      toast({
        title: 'Scanned',
        description: `Scanned ${result}`,
        duration: 500,
        variant: 'success'
      });
      pingSound();

      const veh_name = result.split('/fleet/')[1].toLowerCase();
      const true_veh_name = isNaN(parseInt(veh_name))
        ? veh_name
        : `sb${veh_name}`;

      // Call getVehicleIdFromName to fetch vehicle_id and other data
      getVehicleIdFromName(supabase, true_veh_name)
        .then((res) => {
          const veh_id = res[0].id as string;
          const veh_status = res[0].vehicle_status as string;
          const pet_name = res[0].pet_name as string;

          // Update the history entry with the vehicle_id
          saveScannedUrlToHistory(result, city, veh_id);

          const vehicleLocation = {
            city,
            created_at: new Date().toISOString(),
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            vehicle_id: veh_id,
            created_by: user?.id ?? 'unknown'
          };

          // if no current location then return
          if (
            currentLocation.latitude === 0 ||
            currentLocation.longitude === 0
          ) {
            errSound();
            toast({
              title: 'Location Not Set',
              description: 'Location not set please allow location access',
              duration: 7000,
              variant: 'destructive'
            });
            return;
          }

          // Check if the vehicle is already scanned and not repeated
          if (
            !scannedVehicleIds.find((v) => v.id === veh_id) &&
            !scannedUrls.includes(result)
          ) {
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
                  if (distance < 0.0005) {
                    toast({
                      title: 'Vehicle Location Not Updated',
                      description: `Vehicle location not updated for ${true_veh_name} as it is less than 50 meters`,
                      duration: 5000,
                      variant: 'default'
                    });
                    return;
                  } else {
                    recordVehicleLocation(supabase, vehicleLocation)
                      .then(() => {
                        toast({
                          title: 'Vehicle Location Updated',
                          description: `Vehicle location updated for ${true_veh_name}`,
                          duration: 5000,
                          variant: 'success'
                        });
                      })
                      .catch((err) => {
                        console.error(err);
                        toast({
                          title: 'error',
                          description: 'Error Occured (1) Please Contact Devs',
                          duration: 5000,
                          variant: 'destructive'
                        });
                      });
                  }
                } else {
                  recordVehicleLocation(supabase, vehicleLocation)
                    .then(() => {
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
                        description: 'Error Occured (2) Please Contact Devs',
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
                  description: 'Error Occured (3) Please Contact Devs',
                  duration: 5000,
                  variant: 'destructive'
                });
              });

            setScannedVehicleIds([
              ...scannedVehicleIds,
              {
                name: true_veh_name,
                id: veh_id,
                status: veh_status,
                pet_name: pet_name
              }
            ]);
          }
        })
        .catch((err) => {
          console.error(err);
          toast({
            title: 'error',
            description: 'Error Occured (4) Please Contact Devs',
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
    { lat: 35.095288, lon: -120.63195 },
    { lat: 35.095301, lon: -120.621078 },
    { lat: 35.086092, lon: -120.63192 },
    { lat: 35.086167, lon: -120.61671 }
  ];
  const vofCoordinates = [
    { lat: 36.617272, lon: -114.48814 },
    { lat: 36.620518, lon: -114.526353 },
    { lat: 36.479769, lon: -114.583101 },
    { lat: 36.479083, lon: -114.514348 }
  ];
  const pismoDunesCoordinates = [
    { lat: 35.085717, lon: -120.632317 },
    { lat: 35.091236, lon: -120.583693 },
    { lat: 35.020388, lon: -120.590649 },
    { lat: 35.022873, lon: -120.635966 }
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
    if (isBetweenCoordinates(lat, lon, vofCoordinates))
      return 'Vegas Valley of fire';

    return 'Unknown';
  }

  // Function to save the scanned
  const saveScannedUrlToHistory = async (
    scannedUrl: string,
    location: string,
    vehicle_id?: string
  ) => {
    if (!user) return; // Check if user is logged in

    const { data, error } = await supabase.from('qr_history').insert([
      {
        user: user.id,
        scanned_at: new Date().toISOString(),
        location: location,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        vehicle_id: vehicle_id ?? null
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
            description: 'Error Occured (5) Please Contact Devs',
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
      <div className="flex flex-col w-full gap-4">
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

          <div className="text-xl font-bold text-center">
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
          </div>
        </div>
        <div className=" mb-5">
          <div className="w-[200px] h-[150px]">
            <video ref={ref} />
          </div>
        </div>
        <div className="flex flex-col items-center">
          {locationSet ? (
            <div>
              <div className="mt-1 w-full">
                {normalMode && (
                  <div className="flex flex-col items-center">
                    <div className="w-full flex flex-col items-center">
                      {scannedVehicleIds.length > 0 && (
                        <NormalMode
                          scannedVehicleIds={scannedVehicleIds}
                          scannedUrls={scannedUrls}
                        />
                      )}
                    </div>
                    <div className="mb-4">
                      <SearchVehicles
                        scannedVehicleIds={scannedVehicleIds}
                        setScannedVehicleIds={setScannedVehicleIds}
                      />
                    </div>
                  </div>
                )}
                {inventoryMode && scannedVehicleIds.length > 0 && (
                  <InventoryModeScroll
                    scannedVehicleIds={scannedVehicleIds}
                    handleCheckboxChange={handleCheckboxChange}
                    selectedForInventory={selectedForInventory}
                  />
                )}
                {inventoryMode && (
                  <div>
                    <Button
                      onClick={() => setIsManualInventoryDialogOpen(true)}
                    >
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
            </div>
          ) : (
            <div className="w-full flex flex-col items-center gap-3">
              <h1 className="text-center text-red-500">
                PLEASE ALLOW LOCATION ACCESS!!
              </h1>
              <Button
                onClick={() => {
                  if (!navigator.geolocation) {
                    alert('Geolocation is not supported by your browser');
                    return;
                  }
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      if (!position) return;
                      if (
                        position.coords.latitude === 0 &&
                        position.coords.longitude === 0
                      )
                        return;
                      setCurrentLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                      });
                      setLocationSet(true);
                    },
                    (error) => {
                      console.error(error);
                      alert(
                        'Unable to retrieve your location, please allow location access'
                      );
                    },
                    { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
                  );
                }}
              >
                <RotateCcw className="p-1" /> Retry Location Access
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
