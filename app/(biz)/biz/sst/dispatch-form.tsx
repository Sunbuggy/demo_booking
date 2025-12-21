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
const getLocationType = (lat: number, lon: number): 'CA' | 'NV' | 'MI' | null => {
  if (lat > 35.1 && lat < 35.9 && lon > -120.7 && lon < -120.5) return 'CA';
  if (lat > 36.1 && lat < 36.3 && lon > -115.2 && lon < -114.9) return 'NV';
  if (lat > 43.6 && lat < 43.8 && lon > -86.4 && lon < -86.2) return 'MI';
  return null;
};

const formatPhone = (phone: string): string => {
  const formatted = phone.replace(/\D/g, '');
  return formatted.length === 10 ? `+1${formatted}` : `+${formatted}`;
};

// Custom hook for SMS sending
const useSendSMS = (user: User, textLocation: 'CA' | 'NV' | 'MI' | null, location: VehicleLocation, dispatchNotes: string, customerName: string, resNumber: string, customerPhone: string) => {
  const { toast } = useToast();

  const sendSMS = async () => {
    if (!textLocation) {
      toast({
        title: 'Error',
        description: 'Invalid location for SMS dispatch.',
        variant: 'destructive',
      });
      return;
    }

    const supabase = createClient();
    try {
      // Get vehicle name
      let vehicleName = 'Unknown Vehicle';
      if (location.vehicle_id) {
        const { data: vehicle, error: vehicleError } = await supabase
          .from('vehicles')
          .select('name')
          .eq('id', location.vehicle_id)
          .single();

        if (!vehicleError && vehicle) {
          vehicleName = vehicle.name;
        }
      }

      // Get city if available
      let city = 'Unknown Location';
      if (location.city) {
        city = location.city;
      }

      // Create Google Maps link
      const googleMapsLink = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;

      // Construct the full SMS message
      const smsMessage = `
        SST Received - Map: ${googleMapsLink}
        Click to claim: ${process.env.NEXT_PUBLIC_SITE_URL}/biz/sst/cases
        Vehicle: ${vehicleName}
        Location: ${city}
        Customer: ${customerName}
        Reservation: ${resNumber}
        Phone: ${customerPhone}
        Notes: ${dispatchNotes}
        
      `.replace(/^\s+/gm, ''); // Remove leading whitespace

      const { data: userIds, error: userIdsError } = await supabase
        .from('dispatch_groups')
        .select('user')
        .in('location', [textLocation]);

      if (userIdsError) throw new Error(`Failed to fetch user IDs: ${userIdsError.message}`);
      if (!userIds) throw new Error('No user IDs found');

      const validUserIds = userIds
        .map((d) => d.user)
        .filter((user): user is string => user !== null);

      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('phone')
        .in('id', validUserIds);

      if (usersError) throw new Error(`Failed to fetch users: ${usersError.message}`);
      if (!users) throw new Error('No users found');

      const formattedPhones = Array.from(
        new Set(
          users
            .map((u) => formatPhone(u.phone || ''))
            .filter(phone => phone.length > 0)
        )
      );
      const options = {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          infer_country_code: false,
          user_id: user.id,
          text: smsMessage,
          to_numbers: formattedPhones,
        }),
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/send-sms`,
        options
      );

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(
          `Failed to send SMS: ${res.status} ${res.statusText} - ${errorText}`
        );
      } else {
        toast({
          title: 'SMS Sent',
          description: 'SMS sent successfully to dispatch team',
          variant: 'success',
        });
      }
    } catch (err) {
      console.error('Error in sendSMS:', err);
      toast({
        title: 'Error',
        description: `Failed to send SMS: ${(err as Error).message}`,
        variant: 'destructive',
      });
    }
  };

  return sendSMS;
};

export default function DispatchForm({
  todayData,
  location,
  user,
  dispatchId,
}: {
  todayData: VehicleLocation[];
  location: VehicleLocation;
  user: User;
  dispatchId?: string;
}) {
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [resNumber, setResNumber] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [textLocation, setTextLocation] = useState<'CA' | 'NV' | 'MI' | null>(null);
  const [oldTicketNumber, setOldTicketNumber] = useState<number | null>(null);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const todayDispatched = todayData.filter(
    (data) => data.dispatched_by !== null
  ).length;
  const { latitude: lat, longitude: lon } = location;

  const send_SMS = useSendSMS(user, textLocation, location, dispatchNotes, customerName, resNumber, customerPhone);

  React.useEffect(() => {
    if (dispatchId) {
      const supabase = createClient();
      const fetchDispatch = async () => {
        const { data: dispatch } = await supabase
          .from('vehicle_locations')
          .select('dispatch_notes, distress_ticket_number')
          .eq('id', dispatchId)
          .single();
        if (dispatch && dispatch.dispatch_notes) {
          const customerName = dispatch.dispatch_notes.match(
            /Customer Name: (.*?)\n/
          );
          if (customerName) {
            setCustomerName(customerName[1]);
          }
          const resNumber = dispatch.dispatch_notes.match(/Res Number: (.*?)\n/);
          if (resNumber) {
            setResNumber(resNumber[1]);
          }
          const customerPhone = dispatch.dispatch_notes.match(
            /Customer Phone: (.*?)$/
          );
          if (customerPhone) {
            setCustomerPhone(customerPhone[1]);
          }

          setDispatchNotes(dispatch.dispatch_notes.split('Customer Name')[0]);

          if (dispatch.distress_ticket_number) {
            setOldTicketNumber(dispatch.distress_ticket_number);
          }
        }
      };
      fetchDispatch();
    }
  }, [dispatchId]);

  useEffect(() => {
    if (lat && lon) {
      setTextLocation(getLocationType(lat, lon));
    }
  }, [lat, lon]);

  const onSubmit = async (e: React.FormEvent) => {
    setLoading(true);
    e.preventDefault();

    const data = {
      vehicle_id: location.vehicle_id,
      distress_ticket_number: oldTicketNumber || todayDispatched + 1,
      dispatch_notes: `${dispatchNotes}\nCustomer Name: ${customerName}\nRes Number: ${resNumber}\nCustomer Phone: ${customerPhone}`,
      dispatched_by: user.id,
      dispatch_status: 'open' as const,
      dispatched_at: new Date().toISOString(),
    };

    try {
      const supabase = await createClient();
      await updateVehicleLocation(supabase, data, location.id);

      if (textLocation) {
        await send_SMS();
      } else {
        console.log('SMS not sent: No valid location data');
      }

      toast({
        title: 'Dispatched',
        description: 'Dispatched successfully',
        variant: 'success',
      });
      window.location.reload();
    } catch (error) {
      setLoading(false);
      toast({
        title: 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  if (!lat || !lon) return <div>No location data</div>;

  return (
    <form
      onSubmit={onSubmit}
      className={`w-full mx-auto p-6 space-y-8 rounded-lg shadow-lg ${loading ? 'opacity-50 pointer-events-none' : ''}`}
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
              value={oldTicketNumber || todayDispatched + 1}
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
              required
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
              required
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
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full transition-colors hover:bg-blue-600 active:bg-blue-700"
          disabled={loading}
        >
          {loading ? 'Processing...' : (dispatchId ? 'Redispatch' : 'Submit Dispatch')}
        </Button>
      </div>
    </form>
  );
}