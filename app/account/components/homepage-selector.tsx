'use client';

import React, { useState } from 'react';

interface PageSelectProps {
  currentDate: string;
}

const PageSelect: React.FC<PageSelectProps> = ({ currentDate }) => {
  const [selectedPage, setSelectedPage] = useState<'BizPage' | 'VehiclesManagementPage' | 'ChooseAdventure'>('BizPage');

  return (
    <div className="min-h-screen p-4">
      <h1 className="text-3xl font-bold text-center mb-4">Admin Page Selector</h1>
      <label className="block text-lg font-medium text-center mb-4">
        Select your homepage:
        <select
          className="block w-1/2 mx-auto mt-2 p-2 border rounded-md"
          value={selectedPage}
          onChange={(e) => setSelectedPage(e.target.value as 'BizPage' | 'VehiclesManagementPage' | 'ChooseAdventure')}
        >
          <option value="BizPage">BizPage</option>
          <option value="VehiclesManagementPage">Vehicles Management</option>
          <option value="ChooseAdventure">Choose Adventure</option>
        </select>
      </label>
      <div className="mt-6 text-center">
        {selectedPage === 'BizPage' && <div>BizPage content here. Current Date: {currentDate}</div>}
        {selectedPage === 'VehiclesManagementPage' && <div>Vehicles Management content here.</div>}
        {selectedPage === 'ChooseAdventure' && <div>Choose Adventure content here.</div>}
      </div>
    </div>
  );
};

export default PageSelect;
