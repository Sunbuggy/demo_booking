'use client';
import React from 'react';
import type { CalendarProps } from 'antd';
import { Calendar } from 'antd';
import type { Dayjs } from 'dayjs';
import DateCell from './date-cell';
import { fetch_from_old_db } from '@/utils/old_db/actions';
import { Reservation } from '../types';
import dayjs from 'dayjs';

const getMonthData = (value: Dayjs) => {
  if (value.month() === 8) {
    return 1394;
  }
};

const ClientCalendar: React.FC = () => {
  const [monthData, setMonthData] = React.useState<Reservation[]>([]);
  const monthCellRender = (value: Dayjs) => {
    const num = getMonthData(value);
    return num ? (
      <div className="notes-month">
        <section>{num}</section>
        <span>Backlog number</span>
      </div>
    ) : null;
  };

  const cellRender: CalendarProps<Dayjs>['cellRender'] = async (
    current,
    info
  ) => {
    const year = current.year();
    const month = current.month() + 1;
    const month_query = `SELECT * FROM reservations_modified WHERE SUBSTRING(sch_date, 1, 7) = '${year}-${month}' AND sch_date != '1980-01-01' AND sch_date != '1970-01-01'`;
    await fetch_from_old_db(month_query).then((data) => {
      setMonthData(data as Reservation[]);
    });

    const date_data = monthData.filter((reservation) => {
      return (
        dayjs(reservation.sch_date).format('YYYY-MM-DD') ===
        current.format('YYYY-MM-DD')
      );
    });

    // if (info.type === 'date') return DateCell({ date_data });
    if (info.type === 'month') return monthCellRender(current);
    return info.originNode;
  };

  return (
    <>
      <Calendar cellRender={cellRender} />
    </>
  );
};

export default ClientCalendar;
