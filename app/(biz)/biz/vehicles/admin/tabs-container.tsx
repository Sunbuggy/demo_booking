'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardVehicle } from '@/app/actions/fleet';

// --- IMPORTS ---
import VehiclesTab from './tables/fleet/vehicles-tab'; 
import VehiclesOverview from './tables/components/overview/vehicles-overview'; // The Dashboard with Map
import DataStream from './tables/components/data-stream'; // The List Feed

interface Props {
  vehicles: DashboardVehicle[];
  loggedInUser: any;
}

const VehiclesTabContainer = ({ vehicles, loggedInUser }: Props) => {
  return (
    <Tabs defaultValue="status-report" className="w-full">
      <div className="flex justify-between items-center mb-4">
        <TabsList>
          {/* TAB 1: STATUS REPORT (Dashboard) */}
          <TabsTrigger value="status-report">Status Report</TabsTrigger>
          
          {/* TAB 2: DATA STREAM (Feed) */}
          <TabsTrigger value="data-stream">Data Stream</TabsTrigger>
          
          {/* TAB 3: GRID */}
          <TabsTrigger value="vehicles">Fleet Grid</TabsTrigger>
        </TabsList>
      </div>

      {/* CONTENT: STATUS REPORT (Map + Stats) */}
      <TabsContent value="status-report">
        <VehiclesOverview vehicles={vehicles} />
      </TabsContent>
      
      {/* CONTENT: STREAM (Feed List) */}
      <TabsContent value="data-stream">
        <DataStream vehicles={vehicles} />
      </TabsContent>

      {/* CONTENT: GRID (Raw Table) */}
      <TabsContent value="vehicles">
        <VehiclesTab vehicles={vehicles} />
      </TabsContent>
    </Tabs>
  );
};

export default VehiclesTabContainer;