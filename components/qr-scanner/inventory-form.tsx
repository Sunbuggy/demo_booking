import React from 'react';
import { Button } from '../ui/button';

const InventoryForm = ({
  setBay,
  setLevel,
  bay,
  level,
  handleSubmit
}: {
  setBay: (value: React.SetStateAction<string>) => void;
  setLevel: (value: React.SetStateAction<string>) => void;
  bay: string;
  level: string;
  handleSubmit: () => void;
}) => {
  return (
    <div className="mb-14">
      <div className="w-full flex flex-col justify-center items-center my-3 gap-1 border rounded-lg p-3 text-sm">
        <h1 className="text-sm font-bold">Add Selected Fleet to Inventory</h1>

        <div className="flex flex-col my-5">
          <label className="mb-2">Bay</label>
          <input
            type="text"
            value={bay}
            onChange={(e) => setBay(e.target.value)}
            className="input w-full"
          />
          <label className="mt-3 mb-2">Level</label>
          <input
            type="text"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="input w-full"
          />
        </div>

        <Button variant={'positive'} className="w-full" onClick={handleSubmit}>
          +Add
        </Button>
      </div>
    </div>
  );
};

export default InventoryForm;
