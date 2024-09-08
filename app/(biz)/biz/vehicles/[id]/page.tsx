'use client';
import React from 'react';
import EditVehicle from '../admin/tables/components/edit-vehicle';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { createClient } from '@/utils/supabase/client';
import { VehiclePics } from '../admin/tables/components/row-actions';
import { Gallery, Image } from 'react-grid-gallery';
import Lightbox from 'yet-another-react-lightbox';
export interface CustomImage extends Image {
  original: string;
}

const Vehicle = ({ params }: { params: { id: string } }) => {
  const id = params.id;
  const [images, setImages] = React.useState<VehiclePics[]>([]);
  const [imagesData, setImagesData] = React.useState<CustomImage[]>([]);
  const supabase = createClient();
  const [index, setIndex] = React.useState(-1);
  const handleClick = (index: number, item: CustomImage) => setIndex(index);

  React.useEffect(() => {
    //  bucket, maindir, and subdir from this id
    const bucket = 'sb-fleet';
    const mainDir = 'vehicles';
    const subDir = id;
    const fetchVehicle = async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/s3/upload/?bucket=${bucket}&mainDir=${mainDir}&subDir=${subDir}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const { objects } = (await response.json()) as {
        objects: VehiclePics[];
      };
      if (response.ok) {
        setImages(objects);
      } else {
        console.error(objects);
      }
    };
    fetchVehicle();
  }, [id]);
  React.useEffect(() => {
    setImagesData(
      images.map((image) => ({
        src: image.url,
        original: image.url,
        width: 320,
        height: 174,
        tags: [{ value: 'vehicle', title: 'Nature' }],
        caption: 'Vehicle here'
      }))
    );
  }, [images]);

  const slides = imagesData.map(({ original, width, height }) => ({
    src: original,
    width,
    height
  }));
  return (
    <div className="w-[800px]">
      {/* Using a library for displaying images display images */}
      <div>
        <Gallery
          images={imagesData}
          onClick={handleClick}
          enableImageSelection={false}
        />
        <Lightbox
          slides={slides}
          open={index >= 0}
          index={index}
          close={() => setIndex(-1)}
        />
      </div>
      <Card className="space-y-7 w-full">
        <CardTitle className="ml-5 pt-5">Edit Vehicle</CardTitle>
        <CardContent>
          <EditVehicle id={id} cols={2} />
        </CardContent>
      </Card>
    </div>
  );
};

export default Vehicle;
