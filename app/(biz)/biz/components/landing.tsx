import React from 'react';
import { Reservation } from '../types';
import HourCard from './hour-card';

/**
 * Renders a landing component that displays reservation data.
 *
 * @param {Object} props - The component props.
 * @param {Record<string, Record<string, Reservation[]>>} props.data - The reservation data.
 * @returns {JSX.Element} The rendered landing component.
 */
const Landing = ({
  data
}: {
  data: Record<string, Record<string, Reservation[]>>;
}): JSX.Element => {
  if (data)
    return (
      <div className="flex flex-col gap-5">
        {/* $
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
        } */}
        {Object.keys(data).map((key) => {
          return <HourCard data={data} key={key} hr={key} />;
        })}
      </div>
    );
  return <div>No data</div>;
};

export default Landing;
