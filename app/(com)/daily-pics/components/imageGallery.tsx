'use client';
import Image from 'next/image';
import { ImageData } from '../[date]/page';
import { Card } from '@/components/ui/card';
import { useState, useEffect, useRef } from 'react';
import { Play } from 'lucide-react';
import { MdOutlineSlideshow } from "react-icons/md";
import { Button } from '@/components/ui/button';

interface ImageGalleryProps {
  images: ImageData[];
  formattedDate: string;
  loading: boolean;
}

export function ImageGallery({ images, formattedDate, loading }: ImageGalleryProps) {
  const [isSlideshowOpen, setIsSlideshowOpen] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isSlideshowOpen) {
      timeoutRef.current = setTimeout(() => {
        nextSlide();
      }, 6000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isSlideshowOpen, currentSlideIndex]);

  const openSlideshow = () => {
    setIsSlideshowOpen(true);
    setCurrentSlideIndex(0);
  };

  const closeSlideshow = () => {
    setIsSlideshowOpen(false);
  };

  const nextSlide = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-muted-foreground">No images found for {formattedDate}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold lg:p-2">
          Images for {formattedDate}
        </h2>
        {images.length > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={openSlideshow}
            className="flex items-center gap-2"
          >
            <MdOutlineSlideshow className="h-6 w-6" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((image) => (
          <Card key={image.key} className="relative group">
            <div className="relative aspect-square">
              <Image
                src={image.url}
                alt={`Group photo from ${image.groupName}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={false}
              />
            </div>
            <div className="p-3 space-y-2">
              <h3 className="font-medium">{image.groupName}</h3>
            </div>
          </Card>
        ))}
      </div>

      {/* Fullscreen Slideshow */}
      {isSlideshowOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
          onClick={closeSlideshow}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <Image
              src={images[currentSlideIndex].url}
              alt={`Slide ${currentSlideIndex + 1} of ${images.length}`}
              fill
              className="object-contain"
              priority
              quality={100}
              sizes="100vw"
            />
            
            {/* Navigation Arrows */}
            <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 hover:opacity-100 transition-opacity">
              <button 
                className="p-4 text-white bg-black bg-opacity-50 rounded-full hover:bg-opacity-75"
                onClick={(e) => {
                  e.stopPropagation();
                  prevSlide();
                }}
              >
                &larr;
              </button>
              <button 
                className="p-4 text-white bg-black bg-opacity-50 rounded-full hover:bg-opacity-75"
                onClick={(e) => {
                  e.stopPropagation();
                  nextSlide();
                }}
              >
                &rarr;
              </button>
            </div>

            {/* Slide Indicator */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <div className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-full">
                {currentSlideIndex + 1} / {images.length}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}