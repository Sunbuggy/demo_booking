'use client';
import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import Head from 'next/head';
import { ImageGallery } from './components/imageGallery';

export interface ImageData {
  key: string;
  url: string;
  groupName: string;
  date: string;
}

export default function GalleryPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
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

      const formattedImages = imageObjects.map((obj: { key: string; url: string }) => {
        const parts = obj.key.split('/');
        const groupName = parts[3] || 'Unknown Group'; 
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

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    setShowCalendar(false);
  };

  const formattedDate = date?.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  return (
    <>
      <Head>
        <title>Group Photos Gallery | View Daily Group Pictures</title>
        <meta 
          name="description" 
          content="Browse our collection of group photos organized by date. Find pictures from your group events and activities." 
        />
        <meta property="og:title" content="Group Photos Gallery" />
        <meta 
          property="og:description" 
          content="View and browse group photos from various events and activities." 
        />
        <meta property="og:type" content="website" />
      </Head>

      <div className="">
        <h1 className="text-3xl font-bold text-center mb-2">Group Photos Gallery</h1>
        <p className="text-muted-foreground text-center mb-8">
          Browse photos from our group events and activities
        </p>
        
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <Button 
              variant="outline"
              onClick={() => setShowCalendar(!showCalendar)}
              className="text-lg px-6 py-3"
            >
              {formattedDate || 'Select a date'}
              <svg 
                className="ml-2 h-4 w-4" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M19 9l-7 7-7-7" 
                />
              </svg>
            </Button>
            
            {showCalendar && (
              <div className="absolute z-10 mt-2 bg-background text-foreground shadow-lg rounded-md border border-border">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleDateSelect}
                  className="rounded-md"
                />
              </div>
            )}
          </div>
        </div>

        <ImageGallery 
          images={images} 
          formattedDate={formattedDate || ''} 
          loading={loading} 
        />
      </div>
    </>
  );
}