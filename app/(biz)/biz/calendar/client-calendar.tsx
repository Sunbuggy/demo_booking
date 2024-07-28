'use client';
import React from 'react';
import type { CalendarProps } from 'antd';
import { Calendar, ConfigProvider } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { fetch_from_old_db } from '@/utils/old_db/actions';
import { Reservation } from '../types';
import LoadingModal from '../components/loading-modal';
import DateCell from './date-cell';
import { useTheme } from 'next-themes';
import { SelectInfo } from 'antd/es/calendar/generateCalendar';
import { useRouter } from 'next/navigation';
import { Card, CardTitle } from '@/components/ui/card';
import { vehiclesList } from '@/utils/old_db/helpers';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

type ClientCalendarProps = {
  role: number;
};

const ClientCalendar: React.FC<ClientCalendarProps> = ({ role }) => {
  const [year, setYear] = React.useState<string>(dayjs().format('YYYY'));
  const [month, setMonth] = React.useState<string>(dayjs().format('MM'));
  const [date, setDate] = React.useState<string>(dayjs().format('DD'));
  const [loading, setLoading] = React.useState<boolean>(false);
  const [switch_to_year, setSwitchToYear] = React.useState<boolean>(false);
  const [yearData, setYearData] = React.useState<Reservation[]>([]);
  const [monthData, setMonthData] = React.useState<Reservation[]>([]);
  const [yearTotal, setYearTotal] = React.useState<number>(0);
  const [monthTotal, setMonthTotal] = React.useState<number>(0);
  const [year_ppl_total, setYearPplTotal] = React.useState<number>(0);
  const [monthly_ppl_total, setMonthlyPplTotal] = React.useState<number>(0);
  const [showRevenue, setShowRevenue] = React.useState<boolean>(false);
  const [monthyl_vehicles, setMonthlyVehicles] = React.useState<{}>({});
  const [total_monthly_vehicle_count, setTotalMonthlyVehicleCount] =
    React.useState<number>(0);
  const [key, setKey] = React.useState<string>(`${year}-${month}`);
  const [locations, setLocations] = React.useState<{
    [x: string]: number;
  }>({});
  const { systemTheme, theme } = useTheme();
  const router = useRouter();
  const month_query = `SELECT * FROM reservations_modified WHERE SUBSTRING(sch_date, 1, 7) = '${year}-${month}' AND sch_date != '1980-01-01' AND sch_date != '1970-01-01'`;
  const year_query = `SELECT * FROM reservations_modified WHERE SUBSTRING(sch_date, 1, 4) = '${year}' AND sch_date != '1980-01-01' AND sch_date != '1970-01-01'`;
  React.useEffect(() => {
    async function fetch_old_db(query: string) {
      setLoading(true);
      try {
        const data = await fetch_from_old_db(query);
        if (switch_to_year) {
          setYearData(data as Reservation[]);
        } else {
          setMonthData(data as Reservation[]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetch_old_db(month_query);
  }, [year, month, switch_to_year]);
  React.useEffect(() => {
    // Collect daily revenue adding up the total_cost of each reservation in monthData
    const month_revenue = monthData.reduce((acc, reservation) => {
      return acc + Number(reservation.total_cost);
    }, 0);

    setMonthTotal(month_revenue);
    const monthly_ppl_total = monthData.reduce((acc, reservation) => {
      return acc + Number(reservation.ppl_count);
    }, 0);
    setMonthlyPplTotal(monthly_ppl_total);

    // vehicleslist is the properties of the monthData. First identify which vehicle has a value greater than zero then extract them in an object with the name as their key and their quantity as their value.
    const vehicle_init = monthData.map((reservation) => {
      return vehiclesList.reduce((acc, key) => {
        const count = Number(reservation[key as keyof typeof reservation]);
        if (count > 0) {
          return {
            ...acc,
            [key]: count
          };
        }
        return acc;
      }, {});
    });
    // Flatten the array of objects and sum up the values of the same key to get the total count of each vehicle.
    const vehicle_count = vehicle_init.reduce(
      (acc: { [key: string]: number }, obj) => {
        return Object.entries(obj).reduce((acc, [key, value]) => {
          return {
            ...acc,
            [key]: (acc[key] || 0) + Number(value)
          };
        }, acc);
      },
      {}
    );
    // Get the total count of all vehicles by summing up the values of the total_vehicle_count object.
    const total_vehicle_count = Object.values(vehicle_count).reduce(
      (acc, value) => Number(acc) + Number(value),
      0
    );
    setMonthlyVehicles(vehicle_count);
    setTotalMonthlyVehicleCount(Number(total_vehicle_count));
    // from the monthData collect location and sum them up to get the total count of each location.
    const total_locations = monthData.reduce(
      (acc: { [key: string]: number }, reservation) => {
        const location = reservation.location;
        return {
          ...acc,
          [location]: (acc[location] || 0) + 1
        };
      },
      {}
    );
    setLocations(total_locations);
  }, [monthData, yearData]);

  React.useEffect(() => {
    setKey(`${year}-${month}`);
  }, [year, month]);
  // React.useEffect(() => {
  // }, [monthyl_vehicles]);
  const getMonthData = (value: Dayjs) => {
    if (value.month() === 8) {
      return 1394;
    }
  };
  const monthCellRender = (value: Dayjs) => {
    setSwitchToYear(true);
    const num = getMonthData(value);
    return num ? (
      <div className="notes-month">
        <section>{num}</section>
        <span>Backlog number</span>
      </div>
    ) : null;
  };

  const handleDateClick = (value: Dayjs, selectInfo: SelectInfo) => {
    setLoading(true);
    setYear(value.format('YYYY'));
    const month = String(value.month() + 1);
    setDate(value.format('DD'));
    month.length === 1 ? setMonth(`0${month}`) : setMonth(month);
    if (selectInfo.source === 'date') {
      router.push(`/biz/${value.format('YYYY-MM-DD')}`);
    }
  };

  const dateCellRender = (value: Dayjs) => {
    setSwitchToYear(false);
    const date_data = monthData.filter(
      (reservation) =>
        dayjs(reservation.sch_date).format('YYYY-MM-DD') ===
        value.format('YYYY-MM-DD')
    );
    return (
      <DateCell date_data={date_data} role={role} showRevenue={showRevenue} />
    );
  };

  const cellRender: CalendarProps<Dayjs>['cellRender'] = (current, info) => {
    if (info.type === 'date') return dateCellRender(current);
    if (info.type === 'month') return monthCellRender(current);
    return info.originNode;
  };

  const currentTheme = theme === 'system' ? systemTheme : theme;

  return (
    <>
      <div className="overflow-auto min-h-screen">
        {loading ? (
          <LoadingModal />
        ) : (
          <>
            <ConfigProvider
              theme={{
                components: {
                  Calendar: {
                    fullPanelBg: `${currentTheme === 'dark' ? '#2b2a2a' : 'light' ? '#ffffff' : '#2b2a2a'}`,
                    fullBg: `${currentTheme === 'dark' ? '#2b2a2a' : 'light' ? '#ffffff' : '#2b2a2a'}`,
                    itemActiveBg: '#FFC47E',
                    colorText: `${currentTheme === 'dark' ? '#ffffff' : 'light' ? '#000000' : '#ffffff'}`
                  }
                }
              }}
            >
              <Calendar
                key={key} // Use key prop to force re-render
                cellRender={cellRender}
                className="min-w-[900px]"
                onSelect={handleDateClick}
                value={dayjs(`${year}-${month}-${date}`)}
              />
            </ConfigProvider>
            <div className="flex items-center space-x-2 m-5">
              <Switch
                onCheckedChange={(checked) => setShowRevenue(checked)}
                id="show-revenue"
              />
              <Label htmlFor="show-revenue">Show Revenue</Label>
            </div>
            {monthTotal > 0 && role && role > 899 && (
              <div className="m-5">
                <Card className=" p-2">
                  <CardTitle className="flex justify-between">
                    <span className="text-lime-600">
                      Customers Total :{' '}
                      {monthly_ppl_total
                        .toFixed(0)
                        .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    </span>
                    {showRevenue ? (
                      <span className="text-green-600 ">
                        Total : $
                        {monthTotal
                          .toFixed(2)
                          .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      </span>
                    ) : (
                      ''
                    )}
                  </CardTitle>
                </Card>
                <Card>
                  <div>
                    <CardTitle className="text-orange-600 text-center">
                      Vehicles
                    </CardTitle>
                    <div className="flex  gap-5 text-white justify-center">
                      {Object.entries(monthyl_vehicles).map(([key, value]) => {
                        return (
                          <div>
                            {key}: {Number(value)}
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-center text-orange-500">
                      Total Vehicles: {total_monthly_vehicle_count}
                    </div>
                  </div>
                </Card>
                <Card>
                  <div>
                    <CardTitle className="text-lime-600 text-center">
                      Locations
                    </CardTitle>
                    <div className="grid gap-5 md:grid-cols-3 grid-cols-1  text-white justify-center">
                      {Object.entries(locations).map(([key, value]) => {
                        return (
                          <div>
                            {key}: {Number(value)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default ClientCalendar;
