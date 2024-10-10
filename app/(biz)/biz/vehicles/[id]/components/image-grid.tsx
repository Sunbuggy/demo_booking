'use client';
import React, { useState } from 'react';
import { VehiclePics } from '../../admin/tables/components/row-actions';
import { VehicleGifs } from '../../admin/tables/components/row-actions-gif';
import ImageView from './image-view';
import { Trash2Icon } from 'lucide-react';
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

type Media = VehiclePics | VehicleGifs;

const ImageGrid = ({
  images,
  gifs,
  width,
  height
}: {
  images: VehiclePics[];
  gifs: VehicleGifs[];
  width: number;
  height: number;
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const mediaArray = [...images, ...gifs]; 
  const [media, setMedia] = useState<Media[]>(mediaArray);
  const imagesPerPage = 4;
  const totalPages = Math.ceil(media.length / imagesPerPage);

  const handleNext = () => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages - 1));
  };

  const handlePrevious = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 0));
  };

  const startIndex = currentPage * imagesPerPage;
  const selectedMedia = media.slice(startIndex, startIndex + imagesPerPage);

  const removeMedia = async (item: Media) => {
    await fetch(`/api/s3/upload?bucket=sb-fleet&key=${item.key}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then((res) => res.json())
      .then((data) => {
        // remove item from the media array
        setMedia((prev) => prev.filter((mediaItem) => mediaItem.key !== item.key));
      })
      .catch((error) => {
        console.error(error);
      });
  };

  return (
    <div className="flex flex-col items-center">
      {
        // if there are no media items to display, show a message
        media.length === 0 && <p>No media to display</p>
      }
      <div className="grid md:grid-cols-4 grid-cols-1 md:gap-4 gap-2">
        {selectedMedia.map((item, index) => (
          <div className="space-y-2" key={index}>
            {item.url.endsWith('.gif') ? (
              <img src={item.url} alt="GIF" width={width} height={height} />
            ) : (
              <ImageView src={item.url} height={height} width={width} />
            )}
            <Popover>
              <PopoverTrigger
                className="w-8 flex items-start text-red-500 p-0 m-0"
                asChild
              >
                <Trash2Icon className="cursor-pointer" />
              </PopoverTrigger>
              <PopoverContent>
                <div className="flex flex-col gap-4">
                  <p>Are you sure you want to delete this item?</p>
                  <div className="flex justify-between">
                    <PopoverClose asChild>
                      <Button
                        onClick={() => removeMedia(item)}
                        variant={'destructive'}
                      >
                        Yes
                      </Button>
                    </PopoverClose>
                    <PopoverClose asChild>
                      <Button>No</Button>
                    </PopoverClose>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        ))}
      </div>
      {media.length > 0 && (
        <div className="flex justify-between mt-4 w-full">
          <button
            onClick={handlePrevious}
            disabled={currentPage === 0}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages - 1}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageGrid;
