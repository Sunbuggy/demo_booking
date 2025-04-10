'use client';
import Image from 'next/image';
import { ImageData } from '../[date]/page';

interface ImageGalleryProps {
  images: ImageData[];
  formattedDate: string;
  loading: boolean;
}

export function ImageGallery({ images, formattedDate, loading }: ImageGalleryProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">
          No images found for {formattedDate}
        </h2>
        <p className="text-muted-foreground">
          Try selecting a different date or check back later
        </p>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-8'>
      <h2 className="text-xl font-semibold mb-6 text-center">
        Photos from {formattedDate}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {images.map((image) => (
          <ImageCard key={image.key} image={image} />
        ))}
      </div>
    </div>
  );
}

function ImageCard({ image }: { image: ImageData }) {
  return (
    <div className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative aspect-square">
        <Image
          src={image.url}
          alt={`Group photo from ${image.groupName} on ${image.date}`}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={false}
        />
      </div>
      <div className="p-3 bg-secondary">
        <p className="font-medium">{image.groupName}</p>
      </div>
    </div>
  );
}