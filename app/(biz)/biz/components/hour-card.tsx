import { Card, CardContent, CardTitle } from '@/components/ui/card';
import React from 'react';
import LocationCard from './location-card';
import { Reservation } from '../types';
import {
  countPeople,
  getVehicleCount,
  vehiclesList
} from '@/utils/old_db/helpers';
import { Button } from '@/components/ui/button';

const HourCard = ({
  hr,
  data,
  display_cost
}: {
  hr: string;
  data: Record<string, Record<string, Reservation[]>>;
  display_cost: boolean;
}) => {
  return (
    <Card key={hr} className="p-0 w-96 md:min-w-96">
      <CardTitle className="my-3 ml-4 flex gap-3 items-start">
        {hr}{' '}
        <span className="text-base flex gap-3">
          <span className="text-orange-500">
            F-
            {
              // map through the data and get the total count of vehicles by  adding up every location found and return the sum
              Object.keys(data[hr]).reduce((acc, locationKey) => {
                return (
                  acc +
                  data[hr][locationKey].reduce((acc, reservation) => {
                    return acc + getVehicleCount(reservation);
                  }, 0)
                );
              }, 0)
            }
          </span>
          <span className="text-lime-500">
            P-
            {
              // map through the data and get the total count of people by  adding up every location found and return the sum
              Object.keys(data[hr]).reduce((acc, locationKey) => {
                return (
                  acc +
                  data[hr][locationKey].reduce((acc, reservation) => {
                    return acc + countPeople(reservation);
                  }, 0)
                );
              }, 0)
            }
          </span>{' '}
          <span className="text-base font-light italic">
            ({' '}
            {
              // Group and count vehicles for the given data. if same vehicle add count and display vehicle with count ignore if count is 0
              vehiclesList
                .filter((key) => {
                  return Object.keys(data[hr]).some((locationKey) => {
                    return data[hr][locationKey].some(
                      (reservation) =>
                        Number(reservation[key as keyof typeof reservation]) > 0
                    );
                  });
                })
                .map((key) => {
                  const count = Object.keys(data[hr]).reduce(
                    (acc, locationKey) => {
                      return (
                        acc +
                        data[hr][locationKey].reduce((acc, reservation) => {
                          return (
                            acc +
                            Number(reservation[key as keyof typeof reservation])
                          );
                        }, 0)
                      );
                    },
                    0
                  );
                  return `${count}-${key}${count > 1 ? 's' : ''}`;
                })
                .join(', ')
            }
            )
          </span>
          {/* <span>
            <Button variant="link" size="sm" className="p-0 m-0">
              Launch
            </Button>
          </span> */}
        </span>
        {display_cost && (
          <div className="font-light text-sm text-green-600">
            $
            {
              //  Sum of all reservation.total_cost for the given data
              Object.keys(data[hr])
                .reduce((acc, locationKey) => {
                  return (
                    acc +
                    data[hr][locationKey].reduce((acc, reservation) => {
                      return acc + Number(reservation.total_cost);
                    }, 0)
                  );
                }, 0)
                .toFixed(2)
            }
          </div>
        )}
      </CardTitle>
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
