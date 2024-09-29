'use client';
import { useZxing } from 'react-zxing';
import React from 'react';
import { createClient } from '@/utils/supabase/client';
import {
  fetchVehicleLocations,
  getVehicleIdFromName,
  recordVehicleLocation
} from '@/utils/supabase/queries';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';
import { UserType } from '@/app/(biz)/biz/users/types';

export const BarcodeScanner = ({ user }: { user: UserType | null }) => {
  const supabase = createClient();
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
        console.log('fetchedData', data);
        setCity(data.city);
      });
    console.log('currentLocation', currentLocation);
  }, [currentLocation]);

  React.useEffect(() => {
    if (!scannedUrls.includes(result)) {
      setScannedUrls([...scannedUrls, result]);
    }
    if (result && result.includes('/fleet/')) {
      const veh_name = result.split('/fleet/')[1].toLowerCase();
      //   if veh_name is just a number then add sb infront of it if it has a letter then just use it
      const true_veh_name = isNaN(parseInt(veh_name))
        ? veh_name
        : `sb${veh_name}`;
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
          console.log('Vehicle Location', vehicleLocation);
          // Make sure it doesnt exist in the arrays...
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
                  if (distance < 0.00005) {
                    toast({
                      title: 'Vehicle Location Not Updated',
                      description: `Vehicle location not updated for ${true_veh_name} as it is less than 5 meters`,
                      duration: 500,
                      variant: 'default'
                    });
                    return;
                  } else {
                    recordVehicleLocation(supabase, vehicleLocation)
                      .then((res) => {
                        console.log('Vehicle Location Updated', res);
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
                      console.log('Vehicle Location Created', res);
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

  return (
    <div>
      <div className="flex justify-center">
        <div className="w-[150px] h-[150px]  ">
          <video ref={ref} />
        </div>
      </div>
      {(scannedUrls.length > 0 || scannedVehicleIds.length > 0) && (
        <Tabs defaultValue="new" className="w-[400px] mb-5">
          <TabsList className="w-full justify-center">
            <TabsTrigger value="new">New</TabsTrigger>
            <TabsTrigger value="legacy">Legacy</TabsTrigger>
          </TabsList>
          <TabsContent value="new">
            <div className="w-[400px] ml-5">
              {scannedVehicleIds.length > 0 && (
                <div className="flex flex-col gap-4">
                  <h4 className="text-xl font">Scanned Vehicles:</h4>
                  <div className=" grid grid-cols-4 gap-4">
                    {scannedVehicleIds.map((v, i) => (
                      <span key={i}>
                        <Link
                          className="green_button"
                          href={`/biz/vehicles/${v.id}`}
                          target="_blank"
                        >
                          {v.name}
                        </Link>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="legacy">
            <div className="w-[400px] ml-5">
              {scannedUrls.length > 0 && (
                <div>
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
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
      {/* Camera toggle Button */}
      <div className="flex justify-center">
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
