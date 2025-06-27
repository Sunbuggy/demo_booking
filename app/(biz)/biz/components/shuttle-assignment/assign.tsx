'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useState } from 'react';

interface ShuttleAssignmentButtonProps {
  reservation: {
    res_id: string;
    full_name: string;
    ppl_count: number;
    group_name?: string;
  };
  onAssignment: (shuttleName: string) => void;
}

export function ShuttleAssignmentButton({ 
  reservation, 
  onAssignment 
}: ShuttleAssignmentButtonProps) {
  const [open, setOpen] = useState(false);
  const [selectedShuttle, setSelectedShuttle] = useState<string | null>(null);

  // Mock shuttle data - replace with your actual data source
  const shuttles = [
    { id: 'sh001', name: 'Shuttle 1' },
    { id: 'sh002', name: 'Shuttle 2' },
    { id: 'sh003', name: 'Shuttle 3' },
  ];

  const handleSelect = (shuttle: string) => {
    setSelectedShuttle(shuttle);
    onAssignment(shuttle);
    setOpen(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-2"
          >
            {selectedShuttle 
              ? `SH-${reservation.group_name || 'GRP'}-${reservation.ppl_count}` 
              : 'Assign'}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Shuttle for {reservation.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Group: {reservation.group_name || 'No Group'}</h3>
              <p>People: {reservation.ppl_count}</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Available Shuttles:</h4>
              <div className="grid grid-cols-2 gap-2">
                {shuttles.map(shuttle => (
                  <Button
                    key={shuttle.id}
                    variant={selectedShuttle === shuttle.id ? 'default' : 'outline'}
                    onClick={() => handleSelect(shuttle.id)}
                  >
                    {shuttle.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}