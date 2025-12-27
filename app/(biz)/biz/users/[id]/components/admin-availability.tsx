'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import AvailabilityManager, { AvailabilityRule } from '@/app/account/components/availability-manager';

export default function AdminAvailability({ 
  userId, 
  existingPattern 
}: { 
  userId: string, 
  existingPattern: any 
}) {
  // ensure existingPattern is always an array to prevent crashes
  const rulesList: AvailabilityRule[] = Array.isArray(existingPattern) ? existingPattern : [];

  return (
    <div className="space-y-6">
       {/* We reuse the AvailabilityManager. 
          By passing 'userId', the component knows to switch into "Admin Mode" 
          and save changes for THIS user, not the logged-in admin.
       */}
       <AvailabilityManager 
          existingRules={rulesList} 
          userId={userId} 
       />
    </div>
  );
}