import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Table {
  name: string;
  data: any[];
}

interface TableSelectorProps {
  tables: Table[];
  onSelect: (table: Table) => void;
}

const TableSelector: React.FC<TableSelectorProps> = ({ tables, onSelect }) => {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  const handleSelect = (table: Table) => {
    setSelectedTable(table.name);
    onSelect(table);
  };

  return (
    <div className="space-y-6 w-full flex flex-col items-center md:items-start">
      
      <h2 className="text-xl font-semibold text-foreground">Select a Report:</h2>
      
      {/* Grid adapts to screen size */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
        {tables.map((table) => (
          <Button
            key={table.name}
            onClick={() => handleSelect(table)}
            // Use 'default' (primary color) for selected, 'outline' for unselected.
            // This relies on your global theme configuration.
            variant={selectedTable === table.name ? 'default' : 'outline'}
            className="w-full justify-start"
          >
            {table.name}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 pt-4 border-t border-border w-full">
        <Link href={'/biz/reports/authorizenet/settled'}>
          <Button variant={'ghost'} size={'sm'} className="text-xs text-muted-foreground hover:text-foreground">
            Authorize.net Settled (Legacy)
          </Button>
        </Link>
        <Link href={'/biz/reports/authorizenet/unsettled'}>
          <Button variant={'ghost'} size={'sm'} className="text-xs text-muted-foreground hover:text-foreground">
            Authorize.net Unsettled (Legacy)
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default TableSelector;