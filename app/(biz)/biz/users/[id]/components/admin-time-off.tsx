'use client';

import React from 'react';
// Import the shared component
import TimeOffManager from '@/app/account/components/time-off-manager';

export default function AdminTimeOff({ userId, requests }: { userId: string, requests: any[] }) {
  return (
    <div className="space-y-4">
      <TimeOffManager requests={requests} userId={userId} />
    </div>
  );
}