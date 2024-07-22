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
        {Object.keys(data).map((key) => {
          return <HourCard data={data} key={key} hr={key} />;
        })}
      </div>
    );
  return <div>No data</div>;
};

export default Landing;
