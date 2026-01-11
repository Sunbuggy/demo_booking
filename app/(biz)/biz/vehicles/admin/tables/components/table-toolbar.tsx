import { Table } from '@tanstack/react-table';
import { DataTableViewOptions } from './table-view-options';
import { Button } from '@/components/ui/button';
import { Cross2Icon } from '@radix-ui/react-icons';
import { Input } from '@/components/ui/input';
import { DataTableFacetedFilter } from './faceted-filter';
import AddVehicle from './add-vehicle';

// 1. REMOVED ALL LUCIDE ICON IMPORTS (CarFrontIcon, etc.) - We don't need them anymore!

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

// 2. CLEANED UP THE CONFIG OBJECT
// We only need value and label. The 'icon' prop is handled dynamically by FleetIcon now.
export const vehicleTypes = [
  { value: 'buggy', label: 'Buggy' },
  { value: 'atv', label: 'ATV' },
  { value: 'utv', label: 'UTV' },
  { value: 'sedan', label: 'Sedan' },
  { value: 'truck', label: 'Truck' },
  { value: 'trailer', label: 'Trailer' },
  { value: 'tram', label: 'Tram' },
  { value: 'forktruck', label: 'Forktruck' },
  { value: 'shuttle', label: 'Shuttle' }
];

export function DataTableToolbar<TData>({
  table
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  const handleGlobalFilterChange = (value: string) => {
    table.setGlobalFilter(value.toLowerCase());
  };

  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex gap-2">
          <Input
            placeholder="Search vehicles..."
            value={(table.getState().globalFilter as string) ?? ''}
            onChange={(event) => handleGlobalFilterChange(event.target.value)}
            className="h-8 w-full sm:w-[150px] lg:w-[250px]"
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