'use client';
import { notFound, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import Head from 'next/head';
import { ImageGallery } from '../components/imageGallery';
import Link from 'next/link';

export interface ImageData {
  key: string;
  url: string;
  groupName: string;
  date: string;
}

export default function DateGalleryPage({ params }: { params: { date: string } }) {
  const [date, setDate] = useState<Date | undefined>();
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [userLevel, setUserLevel] = useState<number | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Check user level on mount
  useEffect(() => {
    const checkUserLevel = async () => {
      try {
        const response = await fetch('/api/auth/level');
        if (!response.ok) throw new Error('Failed to fetch user level');
        const { level } = await response.json();
        setUserLevel(level);
      } catch (error) {
        console.error('Error checking user level:', error);
      }
    };
    
    checkUserLevel();
  }, []);

  // Parse the date from URL
  useEffect(() => {
    try {
      const [year, month, day] = params.date.split('-').map(Number);
      const parsedDate = new Date(year, month - 1, day);
      if (isNaN(parsedDate.getTime())) throw new Error('Invalid date');
      setDate(parsedDate);
    } catch (error) {
      notFound();
    }
  }, [params.date]);

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
    if (date) {
      fetchImages();
    }
  }, [date]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return;
    setDate(selectedDate);
    setShowCalendar(false);
    
    // Update the URL when date changes
    const formattedDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    router.push(`/daily-pics/${formattedDate}`);
  };


  const formattedDate = date?.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  if (!date) return null;

  return (
    <>
    <Head>
        <title>Group Photos Gallery | {formattedDate}</title>
        <meta 
          name="description" 
          content={`Browse group photos from ${formattedDate}`} 
        />
      </Head>

      <div className="container mx-auto py-8"> 
        <h1 className="text-3xl font-bold text-center mb-2">Group Photos Gallery</h1>
        <p className="text-muted-foreground text-center mb-8">       
          <div>
            {userLevel !== null && userLevel >= 600 && (
              <Link 
                href='/biz/fetch_pics/admin'
                className='text-orange-500'>
                <i> Manage Images </i> 
              </Link>
            )}
          </div>  
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