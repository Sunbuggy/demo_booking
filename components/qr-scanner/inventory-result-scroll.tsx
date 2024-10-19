import React from 'react';
import { ScrollArea } from '../ui/scroll-area';

const InventoryModeScroll = ({
  scannedVehicleIds,
  handleCheckboxChange,
  selectedForInventory
}: {
  scannedVehicleIds: {
    name: string;
    id: string;
    status: string;
  }[];

  handleCheckboxChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  selectedForInventory: {
    [key: string]: boolean;
  };
}) => {
  return (
    <ScrollArea className="h-[215px]  rounded-md border p-4 w-full">
      <div className="ml-5">
        <h4>Scanned Items</h4>
        {scannedVehicleIds.map((v, i) => (
          <span key={i} className="flex gap-2 items-center">
            <input
              type="checkbox"
              id={v.id}
              name={v.name}
              value={v.id as string}
              onChange={handleCheckboxChange}
              checked={!!selectedForInventory[v.id]} // Ensure boolean value
            />
            <label
              className={
                v.status === 'broken'
                  ? 'text-red-500'
                  : v.status === 'maintenance'
                    ? 'text-amber-500'
                    : v.status === 'fine'
                      ? `text-green-500`
                      : ''
              }
              htmlFor={v.id}
            >
              {v.name}
            </label>
          </span>
        ))}
      </div>
    </ScrollArea>
  );
};

export default InventoryModeScroll;
