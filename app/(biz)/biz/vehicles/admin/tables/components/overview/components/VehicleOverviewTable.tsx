import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { VehicleType } from '../../../../page';

interface VehicleOverviewTableProps {
  vehicles: VehicleType[];
  vehicleTypes: ReturnType<
    typeof import('../utils/vehicleUtils').groupVehicles
  >;
  handleOverviewDialogOpen: (
    list: string[],
    type: 'total' | 'operational' | 'broken'
  ) => void;
}

export function VehicleOverviewTable({
  vehicles,
  vehicleTypes,
  handleOverviewDialogOpen
}: VehicleOverviewTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Category</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>
            <span className="text-green-500">Operational</span>/
            <span className="text-red-500">Broken</span>
          </TableHead>
          <TableHead>
            <span className="text-green-500">Percentage</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>All Vehicles</TableCell>
          <TableCell>{vehicles.length}</TableCell>
          <TableCell>
            <span className="text-green-500 font-bold">
              {vehicles.filter((v) => v.vehicle_status !== 'broken').length}
            </span>
            {' / '}
            <span className="text-red-500 font-bold">
              {vehicles.filter((v) => v.vehicle_status === 'broken').length}
            </span>
          </TableCell>
          <TableCell>-</TableCell>
        </TableRow>
        {Object.entries(vehicleTypes).map(
          ([type, { operational, broken, operationalIds, brokenIds }]) => {
            const totalIds = operationalIds.concat(brokenIds);
            return (
              <TableRow key={type}>
                <TableCell className="capitalize">{type}s</TableCell>
                <TableCell>
                  <button
                    className="cursor-pointer underline hover:text-blue-500"
                    onClick={() => handleOverviewDialogOpen(totalIds, 'total')}
                    aria-label={`View all ${type}s`}
                  >
                    {operational + broken}
                  </button>
                </TableCell>
                <TableCell>
                  <button
                    className="cursor-pointer text-green-500 font-bold underline hover:text-green-700"
                    onClick={() =>
                      handleOverviewDialogOpen(operationalIds, 'operational')
                    }
                    aria-label={`View operational ${type}s`}
                  >
                    {operational}
                  </button>
                  {' / '}
                  <button
                    className="cursor-pointer text-red-500 font-bold underline hover:text-red-700"
                    onClick={() =>
                      handleOverviewDialogOpen(brokenIds, 'broken')
                    }
                    aria-label={`View broken ${type}s`}
                  >
                    {broken}
                  </button>
                </TableCell>
                <TableCell>
                  <button
                    className={`${
                      operational / (operational + broken) > 0.7
                        ? 'text-green-500'
                        : 'text-red-500'
                    } font-bold cursor-pointer underline hover:text-blue-500`}
                    onClick={
                      operational / (operational + broken) > 0.7
                        ? () =>
                            handleOverviewDialogOpen(
                              operationalIds,
                              'operational'
                            )
                        : () => handleOverviewDialogOpen(brokenIds, 'broken')
                    }
                    aria-label={`View ${operational / (operational + broken) > 0.7 ? 'operational' : 'broken'} ${type}s`}
                  >
                    {Math.round((operational / (operational + broken)) * 100)}%
                    running
                  </button>
                </TableCell>
              </TableRow>
            );
          }
        )}
      </TableBody>
    </Table>
  );
}
