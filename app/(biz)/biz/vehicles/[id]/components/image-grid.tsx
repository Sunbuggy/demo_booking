import React, { useState } from 'react';
import { VehiclePics } from '../../admin/tables/components/row-actions';
import ImageView from './image-view';

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
  const totalPages = Math.ceil(images.length / imagesPerPage);

  const handleNext = () => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages - 1));
  };

  const handlePrevious = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 0));
  };

  const startIndex = currentPage * imagesPerPage;
  const selectedImages = images.slice(startIndex, startIndex + imagesPerPage);

  return (
    <div className="flex flex-col items-center">
      {
        // if there are no images to display show a message
        images.length === 0 && <p>No images to display</p>
      }
      <div className="grid md:grid-cols-4 grid-cols-1 md:gap-4 gap-2">
        {selectedImages.map((pic, index) => (
          <div key={index}>
            <ImageView src={pic.url} height={height} width={width} />
          </div>
        ))}
      </div>
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
    </div>
  );
};

export default ImageGrid;
