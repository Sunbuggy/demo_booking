import { Card, CardContent, CardTitle } from '@/components/ui/card';
import React from 'react';
import LocationCard from './location-card';
import { Reservation } from '../types';
export const vehiclesList = [
  'QA',
  'QB',
  'QU',
  'QL',
  'SB1',
  'SB2',
  'SB4',
  'SB5',
  'SB6',
  'twoSeat4wd',
  'UZ2',
  'UZ4',
  'RWG',
  'GoKartplus',
  'GoKart'
];

const HourCard = ({
  hr,
  data
}: {
  hr: string;
  data: Record<string, Record<string, Reservation[]>>;
}) => {
  const getVehicleCount = (reservation: Reservation): number => {
    return vehiclesList.reduce((acc, key) => {
      return acc + Number(reservation[key as keyof typeof reservation]);
    }, 0);
  };
  const countPeople = (reservation: Reservation): number => {
    return reservation.ppl_count;
  };
  return (
    <Card key={hr} className="p-0 w-96 md:min-w-96">
      <CardTitle className="my-3 ml-4">
        {hr}{' '}
        <span className="text-base">
          {' '}
          - [F-
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
          ] [P-
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
          ]{' '}
          <span className="text-xs font-light italic">
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
        </span>
      </CardTitle>
      <CardContent className="flex flex-col gap-5 p-3">
        {Object.keys(data[hr]).map((locationKey) => {
          return (
            <LocationCard
              key={locationKey}
              id={hr}
              data={data}
              locationKey={locationKey}
            />
          );
        })}
      </CardContent>
    </Card>
  );
};

export default HourCard;
