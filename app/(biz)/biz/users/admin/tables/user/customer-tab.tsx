import React from 'react';
import { UserType } from '../../../types';
import { columns } from './columns';
import { DataTable } from '../components/data-table';

const CustomerTab = ({ users }: { users: UserType[] }) => {
  const customers = users?.filter((user) => user.user_level < 250);
  return (
    <div>
      <DataTable data={customers} columns={columns} tableName={'customers'} />
    </div>
  );
};

export default CustomerTab;
