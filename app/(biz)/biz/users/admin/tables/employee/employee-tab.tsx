import React from 'react';
import { transformEmplyees } from '@/utils/old_db/helpers';
import { UserType } from '../../../types';
import { DataTable } from '../components/data-table';
import { columns } from './columns';

const EmployeeTab = ({ users }: { users: UserType[] }) => {
  const employees = transformEmplyees(users);
  return (
    <DataTable data={employees} columns={columns} tableName={'employees'} />
  );
};

export default EmployeeTab;
