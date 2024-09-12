'use client';

import React from 'react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { VehicleType } from '../../admin/page';
import EditVehicle from '../../admin/tables/components/edit-vehicle';
import ImageView from './imageView';
import Link from 'next/link';
import { ArrowBigLeftIcon } from 'lucide-react';
import { VehiclePics } from '../../admin/tables/components/row-actions';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
interface VehicleClientComponentProps {
  id: string;
  initialVehicleInfo: VehicleType;
  images: VehiclePics[];
  profilePic?: string;
}

const VehicleClientComponent: React.FC<VehicleClientComponentProps> = ({
  id,
  initialVehicleInfo,
  profilePic,
  images
}) => {
  const vehicleInfo = initialVehicleInfo;

  if (vehicleInfo)
    return (
      <div className="w-[800px] space-y-5">
        <Link
          href={'/biz/vehicles/admin'}
          className="flex gap-2 hover:cursor-pointer text-pink-500 underline"
        >
          <ArrowBigLeftIcon /> Back to Vehicles
        </Link>

        <Card className="space-y-7 w-full">
          <div>
            <div className="flex justify-center">
              {<ImageView src={profilePic || ''} />}
            </div>
            <div className="flex justify-center">
              {!profilePic && (
                <Button variant={'link'}>Upload Profile Pic</Button>
              )}
            </div>
          </div>
          <CardTitle className="text-center">
            Sunbuggy Fleet{' '}
            <span className="text-orange-500">[{vehicleInfo.name}]</span>
          </CardTitle>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="edit-vehicle">
                <AccordionTrigger>Edit Vehicle</AccordionTrigger>
                <AccordionContent>
                  <EditVehicle id={id} cols={2} />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="show-normal-images">
                <AccordionTrigger>Show Normal Images</AccordionTrigger>
                <AccordionContent>
                  Placeholder for showing normal images
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="show-damage-pics">
                <AccordionTrigger>Show Damage Pics</AccordionTrigger>
                <AccordionContent>
                  Placeholder for showing damage pics
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="add-tag">
                <AccordionTrigger>Add Tag</AccordionTrigger>
                <AccordionContent>Placeholder for adding tags</AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    );
};

export default VehicleClientComponent;
