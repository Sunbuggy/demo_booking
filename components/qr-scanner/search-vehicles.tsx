import { createClient } from '@/utils/supabase/client';
import { recordVehicleLocation } from '@/utils/supabase/queries';
import { User } from '@supabase/supabase-js';
import React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { useToast } from '../ui/use-toast';
import { useRouter } from 'next/navigation';
import { Input } from '../ui/input';
const SearchVehicles = ({
  user,
  setIsDialogOpen
}: {
  user: User | undefined | null;
  setIsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const supabase = createClient();
  const [query, setQuery] = useState('');
  interface Vehicle {
    color: string | null;
    id: string;
    licenseplate: string | null;
    make: string;
    model: string;
    name: string;
    notes: string | null;
    pet_name: string | null;
    profile_pic_bucket: string | null;
    profile_pic_path: string | null;
    profile_pic_url: string | null;
    type: string;
    user_id: string;
    year: number;
  }
  const { toast } = useToast();
  const router = useRouter();

  const [results, setResults] = useState<Vehicle[]>([]);
  const [city, setCity] = useState('');
  const [currentLocation, setCurrentLocation] = React.useState<{
    latitude: number;
    longitude: number;
  }>({ latitude: 0, longitude: 0 });
  React.useEffect(() => {
    // if User rejects the location access then disallow the scanning
    if (!navigator.geolocation) {
      alert('Please allow location access to scan the QR code');
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
      },
      (error) => {
        console.error(error);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    // Get the city name from the lat and long
  }, []);

  React.useEffect(() => {
    fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${currentLocation.latitude}&longitude=${currentLocation.longitude}&localityLanguage=en`
    )
      .then((res) => res.json())
      .then((data) => {
        setCity(data.city);
      });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (query.length >= 2) {
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .ilike('name', `%${query}%`);
        if (!error && data) {
          if (data) {
            setResults(data as unknown as Vehicle[]);
          } else {
            console.error('Error fetching data:', error);
            setResults([]);
          }
        } else {
          setResults([]);
        }
      } else {
        setResults([]);
      }
    };

    fetchData();
  }, [query]);

  function recordVehLoc(veh_id: string, veh_name: string) {
    if (!user) return; // Check if user is logged in

    const vehicleLocation = {
      city,
      created_at: new Date().toISOString(),
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      vehicle_id: veh_id,
      created_by: user?.id ?? 'unknown'
    };
    recordVehicleLocation(supabase, vehicleLocation)
      .then(() => {
        router.push(`/biz/vehicles/${veh_id}`);
        setIsDialogOpen(false);
        // toast({
        //   title: 'Vehicle Location Updated',
        //   description: `Vehicle location updated for ${veh_name}`,
        //   duration: 5000,
        //   variant: 'success'
        // });
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

  return (
    <div className="w-full flex flex-col items-center">
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search vehicles"
      />
      <ul>
        {results.map((vehicle) => (
          <Button
            key={vehicle.id}
            className="large_button_circular relative"
            onClick={() => recordVehLoc(vehicle.id, vehicle.name)}
          >
            {vehicle.name}
          </Button>
        ))}
      </ul>
    </div>
  );
};

export default SearchVehicles;
