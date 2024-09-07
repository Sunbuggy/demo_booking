'use client';
import React from 'react';
import EditVehicle from '../admin/tables/components/edit-vehicle';
import { Card, CardContent, CardTitle } from '@/components/ui/card';

const Vehicle = ({ params }: { params: { id: string } }) => {
  const id = params.id;
  return (
    <div className="w-[800px]">
      images here....
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
