import { Card, CardContent, CardTitle } from '@/components/ui/card';
import React from 'react';
import LocationCard from './location-card';
import { Reservation } from '../../types';
import MainGroups from '../groups/main';
import HourCardTitle from './hour-card-title';

const HourCard = async ({
  hr,
  data,
  display_cost,
  date,
  full_name
}: {
  hr: string;
  data: Record<string, Record<string, Reservation[]>>;
  display_cost: boolean;
  date: string;
  full_name: string;
}) => {
  const reservationsDataInLocation = Object.keys(data[hr]).map(
    (locationKey) => {
      return data[hr][locationKey];
    }
  );
  const groupHr = hr.split(':')[0];
  return (
    <Card key={hr} className="p-0 w-96 md:min-w-96">
      <HourCardTitle hr={hr} data={data} display_cost={display_cost} />
      <MainGroups
        date={date}
        full_name={full_name}
        groupHr={groupHr}
        reservationsDataInLocation={reservationsDataInLocation}
      />
      <CardContent className="flex flex-col gap-5 p-3">
        {Object.keys(data[hr]).map((locationKey) => {
          return (
            <LocationCard
              key={locationKey}
              id={hr}
              data={data}
              locationKey={locationKey}
              display_cost={display_cost}
            />
          );
        })}
      </CardContent>
    </Card>
  );
};

export default HourCard;
