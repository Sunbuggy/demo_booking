'use client';

import { Row } from '@tanstack/react-table';
import React from 'react';

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}
export interface VehiclePdf {
  file_name?: string;
  url: string;
  [key: string]: any; 
}

export function DataTableRowActions<TData>({
  row
}: DataTableRowActionsProps<TData>) {
  return <></>;
}
