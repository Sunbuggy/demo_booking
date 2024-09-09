'use client';

import React from 'react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { VehicleType } from '../../admin/page';
import { VehiclePics } from '../../admin/tables/components/row-actions';
import EditVehicle from '../../admin/tables/components/edit-vehicle';
import ImageView from './imageView';

interface VehicleClientComponentProps {
  id: string;
  initialVehicleInfo: VehicleType;
  initialImages: VehiclePics[];
}

const VehicleClientComponent: React.FC<VehicleClientComponentProps> = ({
  id,
  initialVehicleInfo,
  initialImages
}) => {
  const images = initialImages;
  const vehicleInfo = initialVehicleInfo;
  const [limit, setLimit] = React.useState(4);
  const [offset, setOffset] = React.useState(0);

  const paginatedImages = images.slice(offset, offset + limit);

  const handleNext = () => {
    if (offset + limit < images.length) {
      setOffset(offset + limit);
    }
  };

  const handlePrevious = () => {
    if (offset - limit >= 0) {
      setOffset(offset - limit);
    }
  };

  return (
    <div className="w-[800px] space-y-5">
      <div className="flex gap-2 justify-center">
        {paginatedImages.map((image) => (
          <div key={image.key} className="relative w-[180px] h-[80px]">
            <ImageView src={image.url} />
          </div>
        ))}
      </div>
      {images.length > 4 && (
        <div className="flex justify-center mt-5">
          <input
            type="number"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          />
          <button
            className="px-4 py-2 mx-2 bg-blue-500 text-white rounded"
            onClick={handlePrevious}
            disabled={offset === 0}
          >
            Previous
          </button>
          <button
            className="px-4 py-2 mx-2 bg-blue-500 text-white rounded"
            onClick={handleNext}
            disabled={offset + limit >= images.length}
          >
            Next
          </button>
        </div>
      )}
      <Card className="space-y-7 w-full">
        <CardTitle className="ml-5 pt-5">Edit {vehicleInfo.name} </CardTitle>
        <CardContent>
          <EditVehicle id={id} cols={2} />
        </CardContent>
      </Card>
    </div>
  );
};

export default VehicleClientComponent;
