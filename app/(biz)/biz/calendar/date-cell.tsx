'use client';
import { vehiclesList } from '@/utils/old_db/helpers';
import React from 'react';
import { Reservation } from '../types';
import dayjs, { Dayjs } from 'dayjs';
import { fetch_from_old_db } from '@/utils/old_db/actions';

const DateCell = ({ date_data }: { date_data: Reservation[] }) => {
  console.log(date_data);
  // const month = date.month() + 1;
  // const year = date.year();
  // const [date_data, setDateData] = React.useState<Reservation[]>([]);
  // const [month_data, setMonthData] = React.useState<Reservation[]>([]);
  // const formattedDate = date.format('YYYY-MM-DD');
  // const month_query = `SELECT * FROM reservations_modified WHERE SUBSTRING(sch_date, 1, 7) = '${year}-${month}' AND sch_date != '1980-01-01' AND sch_date != '1970-01-01'`;
  //  `WHERE SUBSTRING(sch_date, 1, 7) = '${year}-${month}' AND sch_date != '1980-01-01' AND sch_date != '1970-01-01'`
  // React.useEffect(() => {
  //   async function fetch_old_db(query: string) {
  //     const data = await fetch_from_old_db(query);
  //     return data;
  //   }
  //   fetch_old_db(month_query).then((data) => {
  //     setMonthData(data as Reservation[]);
  //   });
  // }, []);
  // React.useEffect(() => {
  //   const day_data = month_data.filter((reservation) => {
  //     return dayjs(reservation.sch_date).format('YYYY-MM-DD') === formattedDate;
  //   });
  //   setDateData(day_data);
  // }, [month_data]);

  // React.useEffect(() => {
  //   console.log(month_data);
  // }, []);

  // // Collect daily revenue adding up the total_cost of each reservation in date_data
  // const daily_revenue = date_data.reduce((acc, reservation) => {
  //   return acc + Number(reservation.total_cost);
  // }, 0);

  // // From date_data collect ppl_count and sum them up
  // const ppl_count = date_data.reduce((acc, reservation) => {
  //   return acc + Number(reservation.ppl_count);
  // }, 0);

  // // vehicleslist is the properties of the date_data. First identify which vehicle has a value greater than zero then extract them in an object with the name as their key and their quantity as their value.
  // const vehicle_init = date_data.map((reservation) => {
  //   return vehiclesList.reduce((acc, key) => {
  //     const count = Number(reservation[key as keyof typeof reservation]);
  //     if (count > 0) {
  //       return {
  //         ...acc,
  //         [key]: count
  //       };
  //     }
  //     return acc;
  //   }, {});
  // });
  // // Flatten the array of objects and sum up the values of the same key to get the total count of each vehicle.
  // const vehicle_count = vehicle_init.reduce(
  //   (acc: { [key: string]: number }, obj) => {
  //     return Object.entries(obj).reduce((acc, [key, value]) => {
  //       return {
  //         ...acc,
  //         [key]: (acc[key] || 0) + Number(value)
  //       };
  //     }, acc);
  //   },
  //   {}
  // );
  // // Get the total count of all vehicles by summing up the values of the total_vehicle_count object.
  // const total_vehicle_count = Object.values(vehicle_count).reduce(
  //   (acc, value) => Number(acc) + Number(value),
  //   0
  // );
  return (
    <>Hello</>
    // <div>
    //   {!total_vehicle_count ? (
    //     <div>
    //       <span className="text-red-600">No data</span>
    //     </div>
    //   ) : (
    //     <>
    //       <span className="text-green-600">
    //         $: {daily_revenue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
    //       </span>
    //       <div className="flex gap-2">
    //         <div className="flex flex-col">
    //           <span className="text-orange-400">
    //             F: {total_vehicle_count as number}
    //           </span>
    //           <span className="text-lime-400">P: {ppl_count as number}</span>
    //         </div>
    //         <div className="text-xs flex flex-col justify-end">
    //           {Object.entries(vehicle_count).map(([key, value]) => {
    //             return (
    //               <div className="flex gap-2" key={key}>
    //                 {key.toLowerCase()}- {String(value)}
    //               </div>
    //             );
    //           })}
    //         </div>
    //       </div>
    //     </>
    //   )}
    // </div>
  );
};

export default DateCell;
