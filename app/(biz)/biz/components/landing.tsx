import React from 'react';
import { Reservation } from '../types';
import HourCard from './cards/hour-card';
import { countPeople, vehiclesList } from '@/utils/old_db/helpers';
import ShaCreate from './shuttle-assignment/create';
import GroupShuttleAssignment from './shuttle-assignment/assign';

/**
 * Renders a landing component that displays reservation data.
 *
 * @param {Object} props - The component props.
 * @param {Record<string, Record<string, Reservation[]>>} props.data - The reservation data.
 * @returns {JSX.Element} The rendered landing component.
 */
const Landing = ({
  data,
  display_cost,
  role,
  date,
  full_name
}: {
  data: Record<string, Record<string, Reservation[]>>;
  display_cost: boolean;
  role: number | undefined;
  date: string;
  full_name: string;
}): JSX.Element => {
  if (data)
    return (
      <div className="flex flex-col gap-5 max-w-screen">
        <div className="daytotal">
          {role && role > 899 && display_cost && (
            <p>
              
              Total Today: $
              {
                // Sum of all reservation.total_cost for the given data
                Object.keys(data)
                  .reduce((acc, hr) => {
                    return (
                      acc +
                      Object.keys(data[hr]).reduce((acc, locationKey) => {
                        return (
                          acc +
                          data[hr][locationKey].reduce((acc, reservation) => {
                            return acc + Number(reservation.total_cost);
                          }, 0)
                        );
                      }, 0)
                    );
                  }, 0)
                  .toFixed(2)
              }
            </p>
          )}
          <p>
            Total People:{' '}
            {Object.keys(data).reduce((acc, hr) => {
              return (
                acc +
                Object.keys(data[hr]).reduce((acc, locationKey) => {
                  return (
                    acc +
                    data[hr][locationKey].reduce((acc, reservation) => {
                      return acc + countPeople(reservation);
                    }, 0)
                  );
                }, 0)
              );
            }, 0)}
          </p>
          <p>
            {/* Group and count vehicles for the given data. if same vehicle add
            count and display vehicle with count ignore if count is 0  for the whole data using vehiclesList*/}
            {vehiclesList
              .filter((key) => {
                return Object.keys(data).some((hr) => {
                  return Object.keys(data[hr]).some((locationKey) => {
                    return data[hr][locationKey].some(
                      (reservation) =>
                        Number(reservation[key as keyof typeof reservation]) > 0
                    );
                  });
                });
              })
              .map((key) => {
                const count = Object.keys(data).reduce((acc, hr) => {
                  return (
                    acc +
                    Object.keys(data[hr]).reduce((acc, locationKey) => {
                      return (
                        acc +
                        data[hr][locationKey].reduce((acc, reservation) => {
                          return (
                            acc +
                            Number(reservation[key as keyof typeof reservation])
                          );
                        }, 0)
                      );
                    }, 0)
                  );
                }, 0);
                return `${count}-${key}${count > 1 ? 's' : ''}`;
              })
              .join(', ')}
          </p>
          <p >
          <ShaCreate />
         <GroupShuttleAssignment date={date} />

        </p>
        </div>
        {Object.keys(data).map((key, idx) => {
          return (            
            <HourCard
              data={data}
              key={idx}
              hr={key}
              display_cost={display_cost}
              date={date}
              full_name={full_name}
            />
          );
        })}
        
      </div>
    );
  return <div>No data</div>;
};

export default Landing;
