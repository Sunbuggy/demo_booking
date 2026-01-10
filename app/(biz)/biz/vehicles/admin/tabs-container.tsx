'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardVehicle } from '@/app/actions/fleet';

// --- IMPORTS ---
import VehiclesTab from './tables/fleet/vehicles-tab'; 
import VehiclesOverview from './tables/components/overview/vehicles-overview';
import DataStream from './tables/components/data-stream'; 

interface Props {
  vehicles: DashboardVehicle[];
  loggedInUser: any;
}

const VehiclesTabContainer = ({ vehicles, loggedInUser }: Props) => {
  // CHANGED: defaultValue is now "vehicles" (Fleet Grid)
  return (
    <Tabs defaultValue="vehicles" className="w-full">
      <div className="flex justify-between items-center mb-4">
        <TabsList>
          {/* TAB 1: GRID (Moved to First Position) */}
          <TabsTrigger value="vehicles">Fleet Grid</TabsTrigger>

          {/* TAB 2: STATUS REPORT */}
          <TabsTrigger value="status-report">Status Report</TabsTrigger>
          
          {/* TAB 3: DATA STREAM */}
          <TabsTrigger value="data-stream">Data Stream</TabsTrigger>
        </TabsList>
      </div>

      {/* CONTENT 1: GRID (Default) */}
      <TabsContent value="vehicles">
        <VehiclesTab vehicles={vehicles} />
      </TabsContent>

      {/* CONTENT 2: STATUS REPORT */}
      <TabsContent value="status-report">
        <VehiclesOverview vehicles={vehicles} />
      </TabsContent>
      
      {/* CONTENT 3: STREAM */}
      <TabsContent value="data-stream">
        <DataStream vehicles={vehicles} />
      </TabsContent>

    </Tabs>
  );
};

export default VehiclesTabContainer;