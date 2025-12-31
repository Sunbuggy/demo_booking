// app/(biz)/biz/components/cards/hour-card.tsx

import { Card, CardContent } from '@/components/ui/card';
import React from 'react';
import LocationCard from './location-card';
import { Reservation } from '../../types';
import MainGroups from '../groups/main';
import HourCardTitle from './hour-card-title';
import GroupSheet from '../groups/group-sheet';
import CreateGroupWizard from '../groups/create-group-wizard';

/**
 * HourCard Component
 * Displays all reservations for a specific hour (e.g., 8:00 AM).
 * * UPDATES:
 * - Now accepts `activeFleet`, `reservationStatusMap`, and `hourlyUtilization`.
 * - Prop-drills these down to <LocationCard /> so the rows can access them.
 */
const HourCard = async ({
  hr,
  data,
  display_cost,
  date,
  full_name,
  // --- NEW SHUTTLE PROPS ---
  activeFleet,
  reservationStatusMap,
  hourlyUtilization
}: {
  hr: string;
  data: Record<string, Record<string, Reservation[]>>;
  display_cost: boolean;
  date: string;
  full_name: string;
  activeFleet: any[];        // Passed from Landing
  reservationStatusMap: any; // Passed from Landing
  hourlyUtilization: any;    // Passed from Landing
}) => {
  
  // Extract all reservations for this hour (flattening locations) for the Groups component
  const reservationsDataInLocation = Object.keys(data[hr]).map(
    (locationKey) => {
      return data[hr][locationKey];
    }
  );

  // Get the simple hour string (e.g., "08:00:00" -> "08")
  const groupHr = hr.split(':')[0];

  return (
    <Card key={hr} className="p-0 HourCardStyle">
      {/* Title Bar (Time + Summary Stats) */}
      <div className="flex items-center justify-between p-2">
        <HourCardTitle hr={hr} data={data} display_cost={display_cost} />
      </div>
      
      {/* Group Management Section (unchanged) */}
      <MainGroups
        date={date}
        groupHr={groupHr}
        reservationsDataInLocation={reservationsDataInLocation}
      />
      <div className="ml-5">
        <GroupSheet
          trigger="+Add"
          hr={groupHr}
          CreateGroupWizard={
            <CreateGroupWizard
              hour={groupHr}
              group_date={date}
              full_name={full_name}
            />
          }
        /> 
      </div>

      {/* Reservation Rows (Grouped by Location) */}
      <CardContent className="flex flex-col gap-5 p-3">
        {Object.keys(data[hr]).map((locationKey) => {
          return (
            <LocationCard
              key={locationKey}
              id={hr}
              data={data}
              locationKey={locationKey}
              display_cost={display_cost}
              
              // --- PASSING DOWN DATA ---
              // We pass the fleet info + the specific hour context
              activeFleet={activeFleet}
              reservationStatusMap={reservationStatusMap}
              hourlyUtilization={hourlyUtilization}
              hourContext={groupHr} // Useful for the row to know "I am in the 8am block"
            /> 
          );
        })}
      </CardContent>
    </Card>
  );
};

export default HourCard;