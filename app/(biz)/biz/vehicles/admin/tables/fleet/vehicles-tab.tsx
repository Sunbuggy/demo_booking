import React from 'react';
import { DataTable } from '../components/data-table';
import { columns } from './columns';
import { VehicleType } from '../../page';

const VehiclesTab = ({ vehicles }: { vehicles: VehicleType[] }) => {
  return <DataTable data={vehicles} columns={columns} />;
};

export default VehiclesTab;
