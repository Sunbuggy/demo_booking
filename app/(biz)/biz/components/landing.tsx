'use client';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import React from 'react';
import { Reservation } from '../types';

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
}) => {
  return (
    <>
      {Object.keys(data).map((key) => {
        return (
          <Card key={key}>
            <CardTitle>{key}</CardTitle>
            <CardContent>
              {Object.keys(data[key]).map((innerKey) => {
                return (
                  <Card key={innerKey}>
                    <CardTitle>{innerKey}</CardTitle>{' '}
                    <CardContent>
                      {data[key][innerKey].map((reservation) => {
                        return (
                          <Card key={reservation.res_id}>
                            <CardTitle>{reservation.full_name}</CardTitle>
                            <CardContent>
                              <div>{reservation.occasion?.toLowerCase()}</div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </CardContent>
                  </Card>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </>
  );
};

export default Landing;
