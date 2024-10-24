'use client'
import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { UserType } from '@/app/(biz)/biz/users/types';
import { useToast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { fetchUserScanHistory, getVehicleIdFromName } from '@/utils/supabase/queries';

interface QrHistoryRecord {
  id: number;
  link: string;
  scanned_at: string;
  location: string;
  latitude: any;
  longitude: any;
}

export const GuestHistory = ({ user }: { user: UserType | null }) => {
  const supabase = createClient();
  const [scannedLinks, setScannedLinks] = useState<QrHistoryRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [gifUrls, setGifUrls] = useState<string[]>([]); // State to store the list of GIFs
  const { toast } = useToast();

  const loadUserScanHistory = async () => {
    if (!user) return;

    try {
      const data = await fetchUserScanHistory(supabase, user.id); // Using the new utility function
      
      if (data.length === 0) {
        toast({
          title: 'No History',
          description: 'No scan history found.',
          variant: 'default',
        });
      }

      const formattedData = data.map((record: any) => ({
        id: record.id,
        link: record.link ?? '',
        scanned_at: record.scanned_at ?? '',
        location: record.location ?? 'Unknown location',
        latitude: record.latitude ?? null,
        longitude: record.longitude ?? null,
      }));
      setScannedLinks(formattedData);
    } catch (error) {
      console.error('Error fetching scan history:', error);
      toast({
        title: 'Error',
        description: 'Could not fetch QR scan history.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (user) {
      loadUserScanHistory();
    }
  }, [user]);

  const handleLinkClick = async (link: string) => {
    const fleetPrefix = 'sunbuggy.com/fleet/';
    if (link.startsWith(fleetPrefix)) {
      const fleetIdentifier = link.substring(fleetPrefix.length);
  
      // Convert fleetIdentifier to lowercase
      let vehicleName = fleetIdentifier.toLowerCase();
  
      // If it's a number, prepend 'sb' to the name
      if (!isNaN(Number(fleetIdentifier))) {
        vehicleName = `sb${fleetIdentifier.toLowerCase()}`;
      }

      try {
        const vehicleData = await getVehicleIdFromName(supabase, vehicleName);

        if (!vehicleData || vehicleData.length === 0) {
          toast({
            title: 'Error',
            description: `No vehicle found for ${vehicleName}`,
            variant: 'destructive',
          });
          return;
        }

        const vehicleId = vehicleData[0]?.id;
        if (!vehicleId) {
          toast({
            title: 'Error',
            description: `Vehicle ID not found for ${vehicleName}`,
            variant: 'destructive',
          });
          return;
        }

        // Fetch the list of GIFs in the folder
        const res = await fetch('/api/s3/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vehicleId }),
        });

        const result = await res.json();

        if (result.success) {
          setGifUrls(result.gifs); // Set the GIFs in state
        } else {
          toast({
            title: 'Error',
            description: result.message,
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Vehicle search error:', error);
        toast({
          title: 'Error',
          description: `An error occurred while fetching the vehicle data for ${vehicleName}`,
          variant: 'destructive',
        });
      }
    }
  };

  const formatDateForSearch = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const filteredLinks = scannedLinks.filter((linkRecord) => {
    const searchLower = searchTerm.toLowerCase();
    const formattedDate = formatDateForSearch(linkRecord.scanned_at).toLowerCase();
    return (
      linkRecord.link.toLowerCase().includes(searchLower) ||
      formattedDate.includes(searchLower) ||
      linkRecord.location.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Card title="Your Scan History" description="Search and view your scan history">
      <div className="mb-5 text-center">
        <Input
          type="text"
          className="border p-2 rounded-md w-full max-w-md"
          placeholder="Search by link, date, or location"
          value={searchTerm}
          onChange={(value: string) => setSearchTerm(value)}
        />
      </div>

      {filteredLinks.length > 0 ? (
        <ScrollArea className="h-[300px] rounded-md border p-4">
          <div className="grid grid-cols-1 gap-4">
            {filteredLinks.map((linkRecord) => (
              <div key={linkRecord.id} className="flex flex-col gap-2 border-b pb-2">
                <a
                  className="underline text-orange-500 cursor-pointer"
                  onClick={() => handleLinkClick(linkRecord.link)} 
                >
                  {linkRecord.link}
                </a>
                <span>Scanned at: {formatDateForSearch(linkRecord.scanned_at)}</span>
                <span>Location: {linkRecord.location}</span>
                {linkRecord.latitude && linkRecord.longitude && (
                  <span>
                    Coordinates: {linkRecord.latitude.toFixed(6)}, {linkRecord.longitude.toFixed(6)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <p className="text-center text-gray-500">No results found.</p>
      )}

      {/* Display the GIFs */}
      {gifUrls.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xl mb-2">Vehicle Badges</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {gifUrls.map((gifUrl, index) => (
              <img key={index} src={gifUrl} alt={`Vehicle badge ${index + 1}`} className="w-full h-auto" />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
