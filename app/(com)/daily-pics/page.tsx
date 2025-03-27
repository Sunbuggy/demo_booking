'use client';
import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { useToast } from '@/components/ui/use-toast';

interface ImageData {
  key: string;
  url: string;
  groupName: string;
  date: string;
}

export default function GalleryPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchImages = async () => {
    if (!date) return;

    setLoading(true);
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const prefix = `${year}/${month}/${day}/`;

      const response = await fetch(
        `/api/s3/upload?bucket=sb-group-pics&key=${prefix}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }

      const data = await response.json();
      const imageObjects = data.objects || [];

      // Extract group names from the keys and format the data
      const formattedImages = imageObjects.map((obj: { key: string; url: string }) => {
        const parts = obj.key.split('/');
        const groupName = parts[3]; 
        return {
          ...obj,
          groupName,
          date: `${year}-${month}-${day}`
        };
      });

      setImages(formattedImages);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load images',
        variant: 'destructive',
      });
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [date]);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Group Photos Gallery</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
              />
              <Button onClick={fetchImages} disabled={loading}>
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <p>Loading images...</p>
            </div>
          ) : images.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <p>No images found for selected date</p>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Images for {date?.toLocaleDateString()}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map((image) => (
                  <div key={image.key} className="border rounded-lg overflow-hidden">
                    <div className="relative aspect-square">
                      <Image
                        src={image.url}
                        alt={`Group photo from ${image.groupName}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                    <div className="p-2 bg-muted">
                      <p className="text-sm font-medium">{image.groupName}</p>
                      <p className="text-xs text-muted-foreground">{image.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}