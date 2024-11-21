import React, { useState } from 'react';
import PdfView from './pdf-view';
import { Trash2Icon } from 'lucide-react';
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

type Media = {
  url: string;
  key: string;
};

const PdfGrid = ({
  media = [],
  width,
  height
}: {
  media: Media[];
  width: number;
  height: number;
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const pdfMedia = media.filter((item) => item.url.endsWith('.pdf'));
  const imagesPerPage = 4;
  const totalPages = Math.ceil(pdfMedia.length / imagesPerPage);
  const startIndex = currentPage * imagesPerPage;
  const selectedMedia = pdfMedia.slice(startIndex, startIndex + imagesPerPage);

  const handleNext = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
  const handlePrevious = () => setCurrentPage((prev) => Math.max(prev - 1, 0));

  const removeMedia = async (item: Media) => {
    await fetch(`/api/s3/upload?bucket=sb-fleet&key=${item.key}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(() => {
        setMedia((prev: any[]) => prev.filter((mediaItem) => mediaItem.key !== item.key));
      })
      .catch((error) => console.error(error));
  };

  return (
    <div className="flex flex-col items-center">
      {pdfMedia.length === 0 && <p>No PDF files to display</p>}
      <div className="grid md:grid-cols-4 grid-cols-1 md:gap-4 gap-2">
        {selectedMedia.map((item, index) => (
          <div className="space-y-2" key={index}>
            {/* <PdfView src={item.url} height={height} width={width} /> */}
            <Popover>
              <PopoverTrigger className="w-8 flex items-start text-red-500 p-0 m-0" asChild>
                <Trash2Icon className="cursor-pointer" />
              </PopoverTrigger>
              <PopoverContent>
                <div className="flex flex-col gap-4">
                  <p>Are you sure you want to delete this item?</p>
                  <div className="flex justify-between">
                    <PopoverClose asChild>
                      <Button onClick={() => removeMedia(item)} variant={'destructive'}>
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
      {pdfMedia.length > 0 && (
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

export default PdfGrid;
function setMedia(arg0: (prev: any) => any) {
    throw new Error('Function not implemented.');
}

