'use client';

import React, { useState } from 'react';
import ChooseAdventure from '@/app/(com)/choose-adventure/page';
import BizPage from '@/app/(biz)/biz/[date]/page';
import VehiclesManagementPage from '@/app/(biz)/biz/vehicles/admin/page';
import dayjs from 'dayjs';

interface AdminDashboardSelectorProps {
  defaultPage?: 'BizPage' | 'VehiclesManagementPage' | 'ChooseAdventure';
}

const PageSelect: React.FC<AdminDashboardSelectorProps> = ({
  defaultPage = 'BizPage',
}) => {
  const [selectedPage, setSelectedPage] = useState<'BizPage' | 'VehiclesManagementPage' | 'ChooseAdventure'>(defaultPage);
  const currentDate = dayjs().format('YYYY-MM-DD');

  const renderSelectedPage = () => {
    switch (selectedPage) {
      case 'BizPage':
        return <BizPage params={{ date: currentDate }} searchParams={{ dcos: false, torchc: false, admc: false }} />;
      case 'VehiclesManagementPage':
        return <VehiclesManagementPage />;
      case 'ChooseAdventure':
        return <ChooseAdventure />;
      default:
        return null;
    }
  };

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
      <div>{renderSelectedPage()}</div>
    </div>
  );
};

export default PageSelect;
