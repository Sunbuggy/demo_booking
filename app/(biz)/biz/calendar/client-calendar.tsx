'use client';

import React from 'react';
import type { CalendarProps } from 'antd';
import { Calendar, ConfigProvider } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { fetch_from_old_db } from '@/utils/old_db/actions';
import { Reservation } from '../types';
import LoadingModal from '../vegas/components/loading-modal';
import DateCell from './date-cell';
import { useTheme } from 'next-themes';
import { SelectInfo } from 'antd/es/calendar/generateCalendar';
import { useRouter } from 'next/navigation';
import { Card, CardTitle, CardContent, CardHeader } from '@/components/ui/card';
import { vehiclesList } from '@/utils/old_db/helpers';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import MonthCell from './month-cell';
import Loading from './loading';

type ClientCalendarProps = {
  role: number;
};

const ClientCalendar: React.FC<ClientCalendarProps> = ({ role }) => {
  const [year, setYear] = React.useState<string>(dayjs().format('YYYY'));
  const [month, setMonth] = React.useState<string>(dayjs().format('MM'));
  const [date, setDate] = React.useState<string>(dayjs().format('DD'));
  const [loading, setLoading] = React.useState<boolean>(true);
  const [switch_to_year, setSwitchToYear] = React.useState<boolean>(false);
  const [yearData, setYearData] = React.useState<Reservation[]>([]);
  const [monthData, setMonthData] = React.useState<Reservation[]>([]);
  const [yearTotal, setYearTotal] = React.useState<number>(0);
  const [monthTotal, setMonthTotal] = React.useState<number>(0);
  const [year_ppl_total, setYearPplTotal] = React.useState<number>(0);
  const [monthly_ppl_total, setMonthlyPplTotal] = React.useState<number>(0);
  const [currentMode, setCurrentMode] = React.useState<'year' | 'month'>(
    'month'
  );
  const [yearly_vehicles, setYearlyVehicles] = React.useState<{}>({});
  const [total_yearly_vehicle_count, setTotalYearlyVehicleCount] =
    React.useState<number>(0);
  const [showRevenue, setShowRevenue] = React.useState<boolean>(false);
  const [monthly_vehicles, setMonthlyVehicles] = React.useState<{}>({});
  const [month_total_location_cost, setMonthTotalLocationCost] =
    React.useState<{ [x: string]: number }>({});
  const [year_total_location_cost, setYearTotalLocationCost] = React.useState<{
    [x: string]: number;
  }>({});
  const [total_monthly_vehicle_count, setTotalMonthlyVehicleCount] =
    React.useState<number>(0);
  const [month_locations, setMonthLocations] = React.useState<{
    [x: string]: number;
  }>({});
  const [year_locations, setYearLocations] = React.useState<{
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
    if (switch_to_year) {
      fetch_old_db(year_query);
    } else {
      fetch_old_db(month_query);
    }
  }, [year, month, switch_to_year]);

  React.useEffect(() => {
    // Collect daily revenue adding up the total_cost of each reservation in monthData
    const month_revenue = monthData.reduce((acc, reservation) => {
      return acc + Number(reservation.total_cost);
    }, 0);
    const year_revenue = yearData.reduce((acc, reservation) => {
      return acc + Number(reservation.total_cost);
    }, 0);

    setMonthTotal(month_revenue);
    setYearTotal(year_revenue);
    const monthly_ppl_total = monthData.reduce((acc, reservation) => {
      return acc + Number(reservation.ppl_count);
    }, 0);
    const yearly_ppl_total = yearData.reduce((acc, reservation) => {
      return acc + Number(reservation.ppl_count);
    }, 0);
    setMonthlyPplTotal(monthly_ppl_total);
    setYearPplTotal(yearly_ppl_total);

    // vehicleslist logic
    const vehicle_init_month = monthData.map((reservation) => {
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
    const vehicle_init_year = yearData.map((reservation) => {
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
    
    const vehicle_count_month = vehicle_init_month.reduce(
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
    const vehicle_count_year = vehicle_init_year.reduce(
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
    
    const total_vehicle_count_month = Object.values(vehicle_count_month).reduce(
      (acc, value) => Number(acc) + Number(value),
      0
    );
    const total_vehicle_count_year = Object.values(vehicle_count_year).reduce(
      (acc, value) => Number(acc) + Number(value),
      0
    );

    setMonthlyVehicles(vehicle_count_month);
    setTotalMonthlyVehicleCount(Number(total_vehicle_count_month));
    setYearlyVehicles(vehicle_count_year);
    setTotalYearlyVehicleCount(Number(total_vehicle_count_year));

    // Location Logic
    const total_locations_month = monthData.reduce(
      (acc: { [key: string]: number }, reservation) => {
        const location = reservation.location;
        return {
          ...acc,
          [location]: (acc[location] || 0) + 1
        };
      },
      {}
    );
    const total_locations_year = yearData.reduce(
      (acc: { [key: string]: number }, reservation) => {
        const location = reservation.location;
        return {
          ...acc,
          [location]: (acc[location] || 0) + 1
        };
      },
      {}
    );
    
    const total_cost_per_location_month = monthData.reduce(
      (acc: { [key: string]: number }, reservation) => {
        const location = reservation.location;
        return {
          ...acc,
          [location]: (acc[location] || 0) + Number(reservation.total_cost)
        };
      },
      {}
    );
    setMonthTotalLocationCost(total_cost_per_location_month);

    const total_cost_per_location_year = yearData.reduce(
      (acc: { [key: string]: number }, reservation) => {
        const location = reservation.location;
        return {
          ...acc,
          [location]: (acc[location] || 0) + Number(reservation.total_cost)
        };
      },
      {}
    );
    setYearTotalLocationCost(total_cost_per_location_year);

    setMonthLocations(total_locations_month);
    setYearLocations(total_locations_year);
  }, [monthData, yearData]);

  React.useEffect(() => {
    setSwitchToYear(currentMode === 'year');
  }, [currentMode]);

  const monthCellRender = (value: Dayjs) => {
    const month_data = yearData.filter(
      (reservation) =>
        dayjs(reservation.sch_date).format('YYYY-MM') ===
        value.format('YYYY-MM')
    );
    if (switch_to_year)
      return (
        <>
          <MonthCell
            month_data={month_data}
            role={role}
            showRevenue={showRevenue}
          />
        </>
      );
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
    if (selectInfo.source === 'month') {
      setCurrentMode('month');
    }
  };

  const dateCellRender = (value: Dayjs) => {
    const date_data = monthData.filter(
      (reservation) =>
        dayjs(reservation.sch_date)
        .add(process.env.NODE_ENV === 'production' ? 1 : 0, 'day')
        .format('YYYY-MM-DD') ===
        value.format('YYYY-MM-DD')
    );
    return (
      <DateCell date_data={date_data} role={role} showRevenue={showRevenue} />
    );
  };

  const cellRender: CalendarProps<Dayjs>['cellRender'] = (current, info) => {
    if (info.type === 'date') return dateCellRender(current);
    if (info.type === 'month') {
      return monthCellRender(current);
    }
    return info.originNode;
  };

  const currentTheme = theme === 'system' ? systemTheme : theme;

  // SEMANTIC COLOR MAPS for Ant Design ConfigProvider
  // Matches globals.css variables: Dark = #09090b (approx), Light = #ffffff
  const antThemeColors = {
    dark: {
      bg: '#09090b', // Matches --background in dark mode
      text: '#fafafa', // Matches --foreground in dark mode
      itemActiveBg: '#ea580c', // Orange-600 approx for selection
    },
    light: {
      bg: '#ffffff',
      text: '#09090b',
      itemActiveBg: '#FFC47E',
    }
  };

  const activeColors = currentTheme === 'dark' ? antThemeColors.dark : antThemeColors.light;

  if (monthData.length || yearData.length) {
    return (
      <div className="overflow-auto min-h-screen bg-background text-foreground animate-in fade-in duration-300">
        {loading ? (
          <LoadingModal />
        ) : (
          <>
            <ConfigProvider
              theme={{
                components: {
                  Calendar: {
                    fullPanelBg: activeColors.bg,
                    fullBg: activeColors.bg,
                    itemActiveBg: activeColors.itemActiveBg,
                    colorText: activeColors.text
                  }
                }
              }}
            >
              <Calendar
                mode={currentMode}
                cellRender={cellRender}
                onSelect={handleDateClick}
                value={dayjs(`${year}-${month}-${date}`)}
                onPanelChange={(value, mode) => {
                  setCurrentMode(mode);
                }}
              />
            </ConfigProvider>
            
            {role > 899 && (
              <div className="flex items-center space-x-2 m-5 p-2 bg-card rounded-md border border-border shadow-sm w-fit">
                <Switch
                  onCheckedChange={(checked) => setShowRevenue(checked)}
                  id="show-revenue"
                />
                <Label htmlFor="show-revenue" className="cursor-pointer text-foreground font-medium">Show Revenue</Label>
              </div>
            )}
            
            {!switch_to_year ? (
              // MONTH VIEW STATS
              <div className="p-5 space-y-4">
                {monthTotal > 0 && role && role > 899 && (
                  <>
                    <Card className="bg-card text-card-foreground border-border shadow-md">
                      <CardHeader className="p-4">
                         <CardTitle className="flex justify-between items-center text-lg">
                           <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                             Customers Total: {' '}
                             {monthly_ppl_total
                               .toFixed(0)
                               .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                           </span>
                           {showRevenue && (
                             <span className="text-green-600 dark:text-green-400 font-bold">
                               Total: ${monthTotal
                                 .toFixed(2)
                                 .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                             </span>
                           )}
                         </CardTitle>
                      </CardHeader>
                    </Card>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card className="bg-card text-card-foreground border-border shadow-md">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-orange-600 dark:text-orange-400 text-center uppercase tracking-wide">
                              Vehicles
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-4 text-foreground justify-center text-sm font-medium">
                              {Object.entries(monthly_vehicles).map(
                                ([key, value], idx) => (
                                  <div key={idx} className="bg-muted px-2 py-1 rounded-md">
                                    {key}: {Number(value)}
                                  </div>
                                )
                              )}
                            </div>
                            <div className="text-center text-orange-500 dark:text-orange-400 mt-4 font-bold border-t border-border pt-2">
                              Total Vehicles: {total_monthly_vehicle_count}
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-card text-card-foreground border-border shadow-md">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lime-600 dark:text-lime-400 text-center uppercase tracking-wide">
                              Locations
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid gap-2 md:grid-cols-2 text-foreground text-sm">
                              {Object.entries(month_locations).map(
                                ([key, value], idx) => (
                                  <div key={idx} className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                                    <span className="font-semibold">{key}: {Number(value)}</span>
                                    {showRevenue && (
                                      <span className="text-green-600 dark:text-green-400 font-mono">
                                        ${month_total_location_cost[key]
                                          .toFixed(2)
                                          .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                      </span>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          </CardContent>
                        </Card>
                    </div>
                  </>
                )}
              </div>
            ) : (
              // YEAR VIEW STATS
              <div className="p-5 space-y-4">
                {yearTotal > 0 && role && role > 899 && (
                  <>
                    <Card className="bg-card text-card-foreground border-border shadow-md">
                      <CardHeader className="p-4">
                         <CardTitle className="flex justify-between items-center text-lg">
                           <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                             Customers Total: {' '}
                             {year_ppl_total
                               .toFixed(0)
                               .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                           </span>
                           {showRevenue && (
                             <span className="text-green-600 dark:text-green-400 font-bold">
                               Total: ${yearTotal
                                 .toFixed(2)
                                 .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                             </span>
                           )}
                         </CardTitle>
                      </CardHeader>
                    </Card>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card className="bg-card text-card-foreground border-border shadow-md">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-orange-600 dark:text-orange-400 text-center uppercase tracking-wide">
                              Vehicles
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-4 text-foreground justify-center text-sm font-medium">
                              {Object.entries(yearly_vehicles).map(
                                ([key, value], idx) => (
                                  <div key={idx} className="bg-muted px-2 py-1 rounded-md">
                                    {key}: {Number(value)}
                                  </div>
                                )
                              )}
                            </div>
                            <div className="text-center text-orange-500 dark:text-orange-400 mt-4 font-bold border-t border-border pt-2">
                              Total Vehicles: {total_yearly_vehicle_count}
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-card text-card-foreground border-border shadow-md">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lime-600 dark:text-lime-400 text-center uppercase tracking-wide">
                              Locations
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid gap-2 md:grid-cols-2 text-foreground text-sm">
                              {Object.entries(year_locations).map(
                                ([key, value], idx) => (
                                  <div key={idx} className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                                    <span className="font-semibold">{key}: {Number(value)}</span>
                                    {showRevenue && (
                                      <span className="text-green-600 dark:text-green-400 font-mono">
                                        ${year_total_location_cost[key]
                                          .toFixed(2)
                                          .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                      </span>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          </CardContent>
                        </Card>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  } else {
    return <Loading />;
  }
};

export default ClientCalendar;