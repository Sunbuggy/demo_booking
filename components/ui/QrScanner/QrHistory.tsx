'use client'
import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { UserType } from '@/app/(biz)/biz/users/types';
import { useToast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import Input from '../Input';
import Card from '@/components/ui/Card';

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
    if (!/^https?:\/\//i.test(link)) {
      return `https://${link}`;
    }
    return link;
  };

  // Function to format the date for display and search
  const formatDateForSearch = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(); // search term
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
      {/* Search input */}
      <div className="mb-5 text-center">
        <Input
          type="text"
          className="border p-2 rounded-md w-full max-w-md"
          placeholder="Search by link, date, or location"
          value={searchTerm}
          onChange={(value: string) => setSearchTerm(value)}
        />
      </div>

      {/* Qr History list */}
      {filteredLinks.length > 0 ? (
        <ScrollArea className="h-[300px] rounded-md border p-4">
          <div className="grid grid-cols-1 gap-4">
            {filteredLinks.map((linkRecord) => (
              <div key={linkRecord.id} className="flex flex-col gap-2 border-b pb-2">
                <Link
                  className="underline text-orange-500"
                  href={formatLink(linkRecord.link)} 
                  target="_blank"
                >
                  {linkRecord.link}
                </Link>
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
    </Card>
  );
};
