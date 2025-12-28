import React from 'react';
import { Reservation } from '../types';
import HourCard from './cards/hour-card';
import { countPeople, vehiclesList } from '@/utils/old_db/helpers';
import ShaCreate from './shuttle-assignment/create';
import GroupShuttleAssignment from './shuttle-assignment/assign';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

/**
 * Renders a landing component that displays reservation data.
 * Refactored to use horizontal layout for the header stats to save vertical space.
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
      <div className="flex flex-col gap-5 w-full max-w-full">
        {/* HEADER: Flex row for compact stats */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm p-2 bg-slate-900/50 rounded-md border border-slate-800">
          
          {/* 1. Total Cost (Admin only) */}
          {role && role > 899 && display_cost && (
            <div className="font-semibold text-green-400">
              Total: $
              {Object.keys(data)
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
                .toFixed(2)}
            </div>
          )}

          {/* 2. Total People */}
          <div className="font-medium text-slate-200">
            Total People:{' '}
            <span className="text-white font-bold">
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
            </span>
          </div>

          {/* 3. Vehicle Counts (Comma separated list) */}
          <div className="flex-1 text-slate-300 min-w-[200px]">
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
          </div>

          {/* 4. Action Buttons (Aligned to the right) */}
          <div className="flex items-center gap-2 ml-auto">
            <ShaCreate />
            <GroupShuttleAssignment date={date} />
            <Button asChild size="sm" variant="secondary">
              <Link href="/biz/reservations/new">Create Reservation</Link>
            </Button>
          </div>
        </div>

        {/* HOUR CARDS */}
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

  return <div className="p-8 text-center text-gray-500">No data available</div>;
};

export default Landing;