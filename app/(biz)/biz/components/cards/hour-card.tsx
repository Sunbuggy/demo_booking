import { Card, CardContent, CardTitle } from '@/components/ui/card';
import React from 'react';
import LocationCard from './location-card';
import { Reservation } from '../../types';
import MainGroups from '../groups/main';
import HourCardTitle from './hour-card-title';
import GroupSheet from '../groups/group-sheet';
import CreateGroupWizard from '../groups/create-group-wizard';
import PicForm from '../pictures/pic-upload-form';

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
    <Card key={hr} className="p-0 HourCardStyle">
      <HourCardTitle hr={hr} data={data} display_cost={display_cost} />
      <MainGroups
        date={date}
        groupHr={groupHr}
        reservationsDataInLocation={reservationsDataInLocation}
      />
      <div className="flex items-center ml-5">
        <div>
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
        <div className="ml-4">
          <PicForm />
        </div>
      </div>
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
