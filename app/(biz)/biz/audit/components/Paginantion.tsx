import React from 'react';
import { Table } from '@tanstack/react-table';

interface DataTablePaginationProps {
  table: Table<any>;
}

export function DataTablePagination({ table }: DataTablePaginationProps) {
  return (
    <div className="flex justify-between items-center p-4">
      <button
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
        className="px-4 py-2 rounded "
      >
        Previous
      </button>
      <span>
        Page {table.getState().pagination.pageIndex + 1} of{' '}
        {table.getPageCount()}
      </span>
      <button
        onClick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
        className="px-4 py-2 rounded "
      >
        Next
      </button>
    </div>
  );
}
