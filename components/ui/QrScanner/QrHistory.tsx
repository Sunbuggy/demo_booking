'use client';
import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { UserType } from '@/app/(biz)/biz/users/types';
import { useToast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import Input from '../Input';
import Card from '@/components/ui/Card';
import { useRouter } from 'next/navigation';
import { fetchUserScanHistory, fetchVehicleNameFromId } from '@/utils/supabase/queries';

interface QrHistoryRecord {
  id: number;
  vehicle_id: string;
  vehicle_name: string | null; // New field for vehicle name
  scanned_at: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
}

export const QrScanHistory = ({ user }: { user: UserType | null }) => {
  const supabase = createClient();
  const [scannedLinks, setScannedLinks] = useState<QrHistoryRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const { toast } = useToast();
  const router = useRouter();

  const fetchUserScanHistoryData = async () => {
    if (!user) return;

    try {
      const scanHistoryData = await fetchUserScanHistory(supabase, user.id);

      if (!scanHistoryData.length) {
        toast({
          title: 'No Data',
          description: 'No QR scan history found for this user.',
        });
        return;
      }

      // Fetch vehicle names for each scan history record
      const dataWithVehicleNames = await Promise.all(
        scanHistoryData.map(async (record: any) => {
          const vehicleData = await fetchVehicleNameFromId(supabase, record.vehicle_id);
          const vehicleName = vehicleData[0]?.name || 'Unknown Vehicle';
          return {
            ...record,
            vehicle_name: vehicleName, // Add vehicle name to the record
          };
        })
      );

      setScannedLinks(dataWithVehicleNames);
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
      fetchUserScanHistoryData();
    }
  }, [user]);

  const handleVehicleClick = (vehicleId: string) => {
    router.push(`/biz/vehicles/${vehicleId}`);
  };

  const formatDateForSearch = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const filteredLinks = scannedLinks.filter((record) => {
    const searchLower = searchTerm.toLowerCase();
    const formattedDate = formatDateForSearch(record.scanned_at || '').toLowerCase();
    return (
      (record.vehicle_name?.toLowerCase() || '').includes(searchLower) ||
      formattedDate.includes(searchLower) ||
      (record.location?.toLowerCase() || '').includes(searchLower)
    );
  });

  return (
    <Card title="Your History" description="Search and view your history">
      {/* Search input */}
      <div className="mb-5 text-center">
        <Input
          type="text"
          className="border p-2 rounded-md w-full max-w-md"
          placeholder="Search by vehicle name, date, or location"
          value={searchTerm}
          onChange={(value: string) => setSearchTerm(value)}
        />
      </div>

      {/* Qr History list */}
      {filteredLinks.length > 0 ? (
        <ScrollArea className="h-[300px] rounded-md border p-4">
          <div className="grid grid-cols-1 gap-4">
            {filteredLinks.map((record) => (
              <div key={record.id} className="flex flex-col gap-2 border-b pb-2">
                <span
                  className="underline text-orange-500 cursor-pointer"
                  onClick={() => handleVehicleClick(record.vehicle_id)}
                >
                  Vehicle: {record.vehicle_name || 'Unknown Vehicle'}
                </span>
                <span>Scanned at: {formatDateForSearch(record.scanned_at)}</span>
                <span>Location: {record.location}</span>
                {record.latitude && record.longitude && (
                  <span>
                    Coordinates: {record.latitude.toFixed(6)}, {record.longitude.toFixed(6)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <p className="text-center text-gray-500">No results found.</p>
      )}
    </Card>
  );
};
