'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UnsettledCombinedData } from '../page';

interface ElegantTableProps {
  data: UnsettledCombinedData[];
}

export function ElegantTable({ data }: ElegantTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const filteredData = useMemo(() => {
    return data.filter((item) =>
      Object.values(item).some((value) => {
        if (value instanceof Date) {
          return value
            .toISOString()
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        }
        return value
          ?.toString()
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      })
    );
  }, [data, searchTerm]);

  const totalSettleAmount = useMemo(() => {
    return filteredData.reduce(
      (sum, item) => sum + (item.settleAmount || 0),
      0
    );
  }, [filteredData]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Transaction Data</CardTitle>
        <div className="flex justify-between items-center">
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <div className="text-lg font-semibold">
            Total Settle Amount: ${totalSettleAmount.toFixed(2)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice Number</TableHead>
                <TableHead>CC Name</TableHead>
                <TableHead>Booking Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Reservation Date</TableHead>
                <TableHead>Reservation Time</TableHead>
                <TableHead>Settle Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item, index) => (
                <TableRow
                  key={index}
                  className={'bg-gray-100 dark:bg-gray-800'}
                >
                  <TableCell>{item.invoiceNumber}</TableCell>
                  <TableCell>{`${item.firstName} ${item.lastName}`}</TableCell>
                  <TableCell>{`${item.Book_Name}`}</TableCell>
                  <TableCell>{item.Location}</TableCell>
                  <TableCell>
                    {item.Res_Date
                      ? new Date(item.Res_Date).toLocaleDateString()
                      : 'N/A'}
                  </TableCell>
                  <TableCell>{item.Res_Time || 'N/A'}</TableCell>
                  <TableCell>${item.settleAmount?.toFixed(2)}</TableCell>
                  <TableCell>{item.transactionStatus}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
