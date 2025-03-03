import { Table } from '@tanstack/react-table';
// import { DataTableViewOptions } from './table-view-options';
import { Button } from '@/components/ui/button';
import { Cross2Icon } from '@radix-ui/react-icons';
import { Input } from '@/components/ui/input';
// import { DataTableFacetedFilter } from './faceted-filter';
import { Coffee, TimerOff, UserCheck } from 'lucide-react';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  tableName: string;
}

export const statuses = [
  { value: 'clocked_in', label: 'clocked in', icon: UserCheck },
  // { value: 'on_break', label: 'on break', icon: Coffee },
  { value: 'clocked_out', label: 'clocked out', icon: TimerOff }
];

export function DataTableToolbar<TData>({
  table,
  tableName
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Search users..."
          value={
            (table.getColumn('full_name')?.getFilterValue() as string) ?? ''
          }
          onChange={(event) =>
            table.getColumn('full_name')?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {/* {tableName === 'employees'
          ? table.getColumn('time_entry_status') && (
              // <DataTableFacetedFilter
              //   column={table.getColumn('time_entry_status')}
              //   title="time entry status"
              //   options={statuses}
              // />
            )
          : ''} */}
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
      </div>
      {/* <DataTableViewOptions table={table} /> */}
    </div>
  );
}
