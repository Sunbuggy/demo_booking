import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BackwardFilled } from '@ant-design/icons';

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
    <div className="space-y-4 w-[375px] md:w-full flex flex-col items-center">
      
      <h2 className="text-xl font-semibold">Select a Report:</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tables.map((table) => (
          <Button
            key={table.name}
            onClick={() => handleSelect(table)}
            variant={selectedTable === table.name ? 'positive' : 'outline'}
            className="w-[300px]"
          >
            {table.name}
          </Button>
        ))}
      </div>
      <div className="flex gap-5">
        <Link href={'/biz/reports/authorizenet/settled'}>
          <Button variant={'outline'} size={'sm'} className="text-xs">
            Authorize.net Settled transactions (old)
          </Button>
        </Link>
        <Link href={'/biz/reports/authorizenet/unsettled'}>
          <Button variant={'outline'} size={'sm'} className="text-xs">
            Authorize.net Unsettled transactions (old)
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default TableSelector;
