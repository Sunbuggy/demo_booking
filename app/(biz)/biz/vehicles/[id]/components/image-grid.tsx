'use client';
import React, { useState } from 'react';
import { VehiclePics } from '../../admin/tables/components/row-actions';
import ImageView from './image-view';
import { Trash2Icon } from 'lucide-react';
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

const ImageGrid = ({
  images,
  width,
  height
}: {
  images: VehiclePics[];
  width: number;
  height: number;
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const imagesPerPage = 4;
  const [imagesArray, setImagesArray] = useState(images);
  const totalPages = Math.ceil(imagesArray.length / imagesPerPage);

  const handleNext = () => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages - 1));
  };

  const handlePrevious = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 0));
  };

  const startIndex = currentPage * imagesPerPage;
  const selectedImages = imagesArray.slice(
    startIndex,
    startIndex + imagesPerPage
  );

  const removePic = async (pic: VehiclePics) => {
    await fetch(`/api/s3/upload?bucket=sb-fleet&key=${pic.key}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then((res) => res.json())
      .then((data) => {
        // remove pic from the images array
        setImagesArray((prev) => prev.filter((image) => image.key !== pic.key));
      })
      .catch((error) => {
        console.error(error);
      });
  };

  return (
    <div className="flex flex-col items-center">
      {
        // if there are no images to display show a message
        imagesArray.length === 0 && <p>No images to display</p>
      }
      <div className="grid md:grid-cols-4 grid-cols-1 md:gap-4 gap-2">
        {selectedImages.map((pic, index) => (
          <div className="space-y-2" key={index}>
            <ImageView src={pic.url} height={height} width={width} />
            <Popover>
              <PopoverTrigger
                className="w-8 flex items-start text-red-500 p-0 m-0"
                asChild
              >
                <Trash2Icon className="cursor-pointer" />
              </PopoverTrigger>
              <PopoverContent>
                <div className="flex flex-col gap-4">
                  <p>Are you sure you want to delete this image?</p>
                  <div className="flex justify-between">
                    <PopoverClose asChild>
                      <Button
                        onClick={() => removePic(pic)}
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
      {imagesArray.length > 0 && (
        <div className="flex justify-between mt-4  w-full">
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
