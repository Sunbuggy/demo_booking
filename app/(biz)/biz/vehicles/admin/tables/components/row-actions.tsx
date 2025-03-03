'use client';

import { Row } from '@tanstack/react-table';
import React from 'react';

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}
export interface VehiclePics {
  key: string;
  url: string;
}


export function DataTableRowActions<TData>({
  row
}: DataTableRowActionsProps<TData>) {
  return <></>;
}
