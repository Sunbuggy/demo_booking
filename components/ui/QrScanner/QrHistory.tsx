'use client'
import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { UserType } from '@/app/(biz)/biz/users/types';
import { useToast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';

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
  const { toast } = useToast();

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

  const formatLink = (link: string) => {
    // Ensure the link starts with 'http://' or 'https://'
    if (!/^https?:\/\//i.test(link)) {
      return `https://${link}`;
    }
    return link;
  };

  return (
    <div className="p-5">
      <h1 className="text-xl font-bold text-center mb-5">Your Scan History</h1>
      {scannedLinks.length > 0 ? (
        <ScrollArea className="h-[300px] rounded-md border p-4">
          <div className="grid grid-cols-1 gap-4">
            {scannedLinks.map((linkRecord) => (
              <div key={linkRecord.id} className="flex flex-col gap-2 border-b pb-2">
                <Link
                  className="underline text-blue-500"
                  href={formatLink(linkRecord.link)} // Use the formatted link
                  target="_blank"
                >
                  {linkRecord.link}
                </Link>
                <span>Scanned at: {new Date(linkRecord.scanned_at).toLocaleString()}</span>
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
        <p className="text-center text-gray-500">Your scan history is empty.</p>
      )}
    </div>
  );
};
