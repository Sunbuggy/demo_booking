import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

interface VehicleBySeatCountTableProps {
  title: string;
  vehiclesBySeatCount: Record<
    string,
    {
      operational: number;
      broken: number;
      operationalIds: string[];
      brokenIds: string[];
    }
  >;
  handleOverviewDialogOpen: (
    list: string[],
    type: 'total' | 'operational' | 'broken'
  ) => void;
}

export function VehicleBySeatCountTable({
  title,
  vehiclesBySeatCount,
  handleOverviewDialogOpen
}: VehicleBySeatCountTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead colSpan={4}>{title}</TableHead>
        </TableRow>
        <TableRow>
          <TableHead>Seats</TableHead>
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
        {Object.entries(vehiclesBySeatCount).map(
          ([seats, { operational, broken, brokenIds, operationalIds }]) => {
            const totalIds = operationalIds.concat(brokenIds);
            return (
              <TableRow key={seats}>
                <TableCell>{seats}</TableCell>
                <TableCell>
                  <button
                    className="cursor-pointer underline hover:text-blue-500"
                    onClick={() => handleOverviewDialogOpen(totalIds, 'total')}
                    aria-label={`View all ${seats}-seat vehicles`}
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
                    aria-label={`View operational ${seats}-seat vehicles`}
                  >
                    {operational}
                  </button>
                  {' / '}
                  <button
                    className="cursor-pointer text-red-500 font-bold underline hover:text-red-700"
                    onClick={() =>
                      handleOverviewDialogOpen(brokenIds, 'broken')
                    }
                    aria-label={`View broken ${seats}-seat vehicles`}
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
                    aria-label={`View ${operational / (operational + broken) > 0.7 ? 'operational' : 'broken'} ${seats}-seat vehicles`}
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
