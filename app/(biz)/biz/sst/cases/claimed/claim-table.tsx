'use client';

import React, { useState, useTransition } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { updateSSTClaimed } from './actions';
import { VehicleLocation } from '../../../vehicles/types';

const CasesTable = ({
  initialSsts,
  userMap,
  vehicleMap,
  userId,
  userPhone
}: {
  initialSsts: VehicleLocation[];
  userMap: Map<string, string | null>;
  vehicleMap: Map<string, string | null>;
  userId: string;
  userPhone: string;
}) => {
  const [ssts, setSsts] = useState(initialSsts);
  const [isPending, startTransition] = useTransition();

  const handleClaimSST = (sstId: string) => {
    startTransition(async () => {
      try {
        await updateSSTClaimed(sstId, userId, userPhone);
        setSsts((prevSsts) =>
          prevSsts.map((sst) =>
            sst.id === sstId
              ? { ...sst, dispatch_status: 'claimed', claimed_by: userId }
              : sst
          )
        );
        window.location.reload();
      } catch (error) {
        console.error('Failed to claim SST:', error);
        // Here you could also set some state to show an error message to the user
      }
    });
  };

  const renderClaimButton = (sst: VehicleLocation) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className="mt-2 w-full sm:w-auto sm:ml-3 green_button_small"
          disabled={isPending}
        >
          Claim
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <p>Are you sure you want to claim this ticket?</p>
        <div className="flex gap-5 mt-4">
          <Button
            onClick={() => handleClaimSST(sst.id || '')}
            disabled={isPending}
          >
            Yes
          </Button>
          <Button>No</Button>
        </div>
      </PopoverContent>
    </Popover>
  );

  const renderCloseButton = (sst: VehicleLocation) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className="mt-2 w-full sm:w-auto sm:ml-3 green_button_small"
          disabled={isPending}
        >
          Close
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <p>Are you sure you want to Close this ticket?</p>
        <div className="flex gap-5 mt-4">
          <Button
            onClick={() => handleClaimSST(sst.id || '')}
            disabled={isPending}
          >
            Yes
          </Button>
          <Button>No</Button>
        </div>
      </PopoverContent>
    </Popover>
  );

  const renderMobileCard = (sst: VehicleLocation) => (
    <Card
      key={sst.id}
      className={`mb-4 ${
        sst.dispatch_status === 'open'
          ? 'bg-red-500/20'
          : sst.dispatch_status === 'claimed'
            ? 'bg-purple-500/20'
            : sst.dispatch_status === 'closed'
              ? 'bg-green-500/20'
              : ''
      }`}
    >
      <CardHeader>
        <CardTitle>Ticket: {sst.distress_ticket_number}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>
          <strong>Location:</strong> {sst.city}
        </p>
        <p>
          <strong>Created At:</strong>{' '}
          {new Date(sst.created_at).toLocaleTimeString()}
        </p>
        <p>
          <strong>Dispatch Notes:</strong> {sst.dispatch_notes}
        </p>
        <p>
          <strong>Dispatched At:</strong>{' '}
          {sst.dispatched_at &&
            new Date(sst.dispatched_at).toLocaleTimeString()}
        </p>
        <p>
          <strong>Dispatched By:</strong>{' '}
          {userMap.get(sst.dispatched_by || '') || sst.dispatched_by}
        </p>
        <p>
          <strong>Vehicle Name:</strong>{' '}
          {vehicleMap.get(sst.vehicle_id || '') || sst.vehicle_id}
        </p>
        <p>
          <strong>Dispatch Status:</strong> {sst.dispatch_status}
        </p>
        {sst.dispatch_status === 'open' && renderClaimButton(sst)}
        {sst.dispatch_status === 'claimed' && (
          <div>
            <p>
              Claimed by: {userMap.get(sst.claimed_by || '') || sst.claimed_by}
            </p>
            {sst.claimed_at && (
              <p>at {new Date(sst.claimed_at).toLocaleTimeString()}</p>
            )}
            {renderCloseButton(sst)}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div>
      {/* Mobile view */}
      <div className="md:hidden">
        {ssts
          .sort((a, b) =>
            (String(a.distress_ticket_number) || '').localeCompare(
              String(b.distress_ticket_number) || ''
            )
          )
          .map(renderMobileCard)}
      </div>

      {/* Desktop view */}
      <div className="hidden md:block">
        <Table className="w-full border-collapse border border-gray-200">
          <TableHeader>
            <TableRow className="border border-gray-200">
              <TableHead className="border border-gray-200">
                Ticket Number
              </TableHead>
              <TableHead className="border border-gray-200">Location</TableHead>
              <TableHead className="border border-gray-200">
                Created At
              </TableHead>
              <TableHead className="border border-gray-200">
                Dispatch Notes
              </TableHead>
              <TableHead className="border border-gray-200">
                Dispatched At
              </TableHead>
              <TableHead className="border border-gray-200">
                Dispatched By
              </TableHead>
              <TableHead className="border border-gray-200">
                Vehicle Name
              </TableHead>
              <TableHead className="border border-gray-200">
                Dispatch Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ssts
              .sort((a, b) =>
                (String(a.distress_ticket_number) || '').localeCompare(
                  String(b.distress_ticket_number) || ''
                )
              )
              .map((sst) => (
                <TableRow
                  key={sst.id}
                  className={`border border-gray-200 ${
                    sst.dispatch_status === 'open'
                      ? 'bg-red-500/20'
                      : sst.dispatch_status === 'claimed'
                        ? 'bg-purple-500/20'
                        : sst.dispatch_status === 'closed'
                          ? 'bg-green-500/20'
                          : ''
                  }`}
                >
                  <TableCell className="border border-gray-200">
                    {sst.distress_ticket_number}
                  </TableCell>
                  <TableCell className="border border-gray-200">
                    {sst.city}
                  </TableCell>
                  <TableCell className="border border-gray-200">
                    {new Date(sst.created_at).toLocaleTimeString()}
                  </TableCell>
                  <TableCell
                    className="border border-gray-200"
                    style={{
                      maxWidth: '150px',
                      whiteSpace: 'normal',
                      wordWrap: 'break-word'
                    }}
                  >
                    {sst.dispatch_notes}
                  </TableCell>
                  <TableCell className="border border-gray-200">
                    {sst.dispatched_at &&
                      new Date(sst.dispatched_at).toLocaleTimeString()}
                  </TableCell>
                  <TableCell className="border border-gray-200">
                    {userMap.get(sst.dispatched_by || '') || sst.dispatched_by}
                  </TableCell>
                  <TableCell className="border border-gray-200">
                    {vehicleMap.get(sst.vehicle_id || '') || sst.vehicle_id}
                  </TableCell>
                  <TableCell className="border border-gray-200">
                    {sst.dispatch_status}
                    {sst.dispatch_status === 'open' && renderClaimButton(sst)}
                    {sst.dispatch_status === 'claimed' && (
                      <div className="flex flex-col">
                        <span>
                          {userMap.get(sst.claimed_by || '') || sst.claimed_by}
                        </span>
                        {sst.claimed_at && (
                          <span>
                            {' '}
                            at {new Date(sst.claimed_at).toLocaleTimeString()}
                            {renderCloseButton(sst)}
                          </span>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CasesTable;
