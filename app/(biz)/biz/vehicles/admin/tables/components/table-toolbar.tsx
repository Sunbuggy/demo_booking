import { Table } from '@tanstack/react-table';
import { DataTableViewOptions } from './table-view-options';
import { Button } from '@/components/ui/button';
import { Cross2Icon } from '@radix-ui/react-icons';
import { Input } from '@/components/ui/input';
import { DataTableFacetedFilter } from './faceted-filter';
import {
  BusIcon,
  CaravanIcon,
  CarFrontIcon,
  CarIcon,
  CarTaxiFrontIcon,
  ForkliftIcon,
  TractorIcon,
  TramFrontIcon,
  TruckIcon
} from 'lucide-react';
import AddVehicle from './add-vehicle';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export const vehicleTypes = [
  { value: 'buggy', label: 'Buggy', icon: CarFrontIcon },
  { value: 'atv', label: 'ATV', icon: TractorIcon },
  { value: 'utv', label: 'UTV', icon: CarTaxiFrontIcon },
  { value: 'sedan', label: 'Sedan', icon: CarIcon },
  { value: 'truck', label: 'Truck', icon: TruckIcon },
  { value: 'trailer', label: 'Trailer', icon: CaravanIcon },
  { value: 'tram', label: 'Tram', icon: TramFrontIcon },
  { value: 'forktruck', label: 'Forktruck', icon: ForkliftIcon },
  { value: 'shuttle', label: 'Shuttle', icon: BusIcon }
];

export function DataTableToolbar<TData>({
  table
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col items-center space-x-2">
        <div className="flex space-x-2">
          <Input
            placeholder="Search vehicles..."
            value={(table.getState().globalFilter as string) ?? ''}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
            className="h-8 w-[150px] lg:w-[250px]"
          />
          <DataTableFacetedFilter
            column={table.getColumn('type')}
            title="fleet type"
            options={vehicleTypes}
          />
        </div>

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
        <AddVehicle />
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
