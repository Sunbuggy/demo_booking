'use client';
import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { UserType } from '@/app/(biz)/biz/users/types';
import { useToast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import Input from '../Input';
import Card from '@/components/ui/Card';
import { useRouter } from 'next/navigation'; // For navigation
import { getVehicleIdFromName } from '@/utils/supabase/queries'; // Import the query function

interface QrHistoryRecord {
  id: number;
  link: string;
  scanned_at: string;
  location: string;
  latitude: any;
  longitude: any;
}

export const QrScanHistory = ({ user }: { user: UserType | null }) => {
  const supabase = createClient();
  const [scannedLinks, setScannedLinks] = useState<QrHistoryRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [badgeGifUrl, setBadgeGifUrl] = useState<string | null>(null);  // State to hold GIF URL
  const { toast } = useToast();
  const router = useRouter(); // For redirecting

  const fetchUserScanHistory = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('qr_history')
      .select('id, link, scanned_at, location, latitude, longitude')
      .eq('user', user.id)
      .order('scanned_at', { ascending: false });

    if (error) {
      console.error('Error fetching scan history:', error);
      toast({
        title: 'Error',
        description: 'Could not fetch QR scan history.',
        variant: 'destructive',
      });
    } else {
      const formattedData = data.map((record: any) => ({
        id: record.id,
        link: record.link ?? '',
        scanned_at: record.scanned_at ?? '',
        location: record.location ?? 'Unknown location',
        latitude: record.latitude ?? null,
        longitude: record.longitude ?? null,
      }));
      setScannedLinks(formattedData);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserScanHistory();
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
        // Query the vehicle by name using the utility function
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

        // Check for a badge GIF in the S3 bucket
        const badgeGifUrl = await fetchBadgeGif(vehicleName);
        if (badgeGifUrl) {
          setBadgeGifUrl(badgeGifUrl); // Set the GIF URL to state
        }

        // Redirect to the vehicle details page
        router.push(`/biz/vehicles/${vehicleId}`);
      } catch (error) {
        console.error('Vehicle search error:', error);
        toast({
          title: 'Error',
          description: `An error occurred while fetching the vehicle data for ${vehicleName}`,
          variant: 'destructive',
        });
      }
    } else {
      window.open(link.startsWith('http') ? link : `https://${link}`, '_blank');
    }
  };

  // Fetch badge GIF from S3 bucket based on vehicle name
  const fetchBadgeGif = async (vehicleName: string) => {
    try {
      const response = await fetch(`/api/s3/upload?bucket=sb-fleet&key=badges/${vehicleName}`, {
        method: 'GET',
      });
      const data = await response.json();
      if (data.objects && data.objects.length > 0) {
        // Find the first GIF file in the vehicle's folder
        const gifObject = data.objects.find((obj: any) => obj.key.endsWith('.gif'));
        if (gifObject) {
          return gifObject.url; // Return the signed URL for the GIF
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching badge GIF:', error);
      return null;
    }
  };

  // Format the date for display and search
  const formatDateForSearch = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Filter scanned links based on the search term
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

      {/* Display badge GIF if found */}
      {badgeGifUrl && (
        <div className="mt-5 text-center">
          <h3 className="text-lg font-semibold">Vehicle Badge</h3>
          <img src={badgeGifUrl} alt="Vehicle Badge" className="mx-auto" />
        </div>
      )}
    </Card>
  );
};
