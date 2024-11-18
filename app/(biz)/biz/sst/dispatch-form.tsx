'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast, useToast } from '@/components/ui/use-toast';
import { VehicleLocation } from '../vehicles/types';
import { User } from '@supabase/supabase-js';
import { updateVehicleLocation } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/client';

// Utility functions
const getLocationType = (lat: number, lon: number) => {
  if (lat > 35.1 && lat < 35.9 && lon > -120.7 && lon < -120.5) return 'CA';
  if (lat > 36.1 && lat < 36.3 && lon > -115.2 && lon < -114.9) return 'NV';
  if (lat > 43.6 && lat < 43.8 && lon > -86.4 && lon < -86.2) return 'MI';
  return 'Unknown';
};

const formatPhone = (phone: string) => {
  const formatted = phone.replace(/\D/g, '');
  return formatted.length === 10 ? `+1${formatted}` : formatted;
};

// Custom hook for SMS sending
const useSendSMS = (
  user: User,
  textLocation: string,
  lat: number,
  lon: number
) => {
  const { toast } = useToast();

  const sendSMS = async () => {
    const supabase = createClient();
    const { data: userIds } = await supabase
      .from('dispatch_groups')
      .select('user')
      .in('location', [textLocation]);

    if (!userIds) return;

    const { data: users } = await supabase
      .from('users')
      .select('phone')
      .in(
        'id',
        userIds.map((d) => d.user)
      );

    if (!users) return;

    const formattedPhones = Array.from(
      new Set(users.map((u) => formatPhone(u.phone || '')))
    );

    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        infer_country_code: false,
        user_id: user.id,
        text: `SST Recieved click link to claim, ${process.env.NEXT_PUBLIC_SITE_URL}/biz/sst/cases`,
        to_numbers: formattedPhones
      })
    };

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/send-sms`,
        options
      );
      if (!res.ok) throw new Error('Failed to send SMS');
      toast({
        title: 'SMS Sent',
        description: 'SMS sent successfully',
        variant: 'success'
      });
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to send SMS',
        variant: 'destructive'
      });
    }
  };

  return sendSMS;
};

export default function DispatchForm({
  todayData,
  location,
  user
}: {
  todayData: VehicleLocation[];
  location: VehicleLocation;
  user: User;
}) {
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [resNumber, setResNumber] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [textLocation, setTextLocation] = useState('');
  const { toast } = useToast();

  const todayDispatched = todayData.filter(
    (data) => data.dispatched_by !== null
  ).length;
  const { latitude: lat, longitude: lon } = location;

  const sendSMS = lat && lon ? useSendSMS(user, textLocation, lat, lon) : null;

  useEffect(() => {
    if (lat && lon) {
      setTextLocation(getLocationType(lat, lon));
    }
  }, [lat, lon]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      vehicle_id: location.vehicle_id,
      distress_ticket_number: todayDispatched + 1,
      dispatch_notes: `${dispatchNotes}\nCustomer Name: ${customerName}\nRes Number: ${resNumber}\nCustomer Phone: ${customerPhone}`,
      dispatched_by: user.id,
      dispatch_status: 'open' as const,
      dispatched_at: new Date().toISOString()
    };

    try {
      const supabase = createClient();
      await updateVehicleLocation(supabase, data, location.id);
      if (sendSMS) {
        await sendSMS();
      }
      toast({
        title: 'Dispatched',
        description: 'Dispatched successfully',
        variant: 'success'
      });
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message,
        variant: 'destructive'
      });
    }
  };

  if (!lat || !lon) return <div>No location data</div>;

  return (
    <form
      onSubmit={onSubmit}
      className="w-full mx-auto p-6 space-y-8 rounded-lg shadow-lg"
    >
      <div className="space-y-6">
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label
              htmlFor="ticket_number"
              className="text-sm font-medium text-gray-700"
            >
              Ticket Number
            </Label>
            <Input
              type="text"
              name="ticket_number"
              value={todayDispatched + 1}
              readOnly
              className="bg-gray-50"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="customer_name"
              className="text-sm font-medium text-gray-700"
            >
              Customer Name
            </Label>
            <Input
              type="text"
              name="customer_name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="res_no"
              className="text-sm font-medium text-gray-700"
            >
              Reservation Number
            </Label>
            <Input
              type="text"
              name="res_no"
              value={resNumber}
              onChange={(e) => setResNumber(e.target.value)}
              className="focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cell" className="text-sm font-medium text-gray-700">
              Customer Phone
            </Label>
            <Input
              type="tel"
              name="cell"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="focus:ring-2 focus:ring-blue-500"
              placeholder="(xxx) xxx-xxxx"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="dispatch_notes"
              className="text-sm font-medium text-gray-700"
            >
              Dispatch Notes
            </Label>
            <Textarea
              name="dispatch_notes"
              value={dispatchNotes}
              onChange={(e) => setDispatchNotes(e.target.value)}
              className="min-h-[120px] focus:ring-2 focus:ring-blue-500"
              placeholder="Enter situation details..."
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full transition-colors hover:bg-blue-600 active:bg-blue-700"
        >
          Submit Dispatch
        </Button>
      </div>
    </form>
  );
}
