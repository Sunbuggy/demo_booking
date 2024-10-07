'use client';
import React from 'react';
import { Calendar, dayjsLocalizer, Views, View } from 'react-big-calendar';
import dayjs from 'dayjs';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import DialogFactory from '@/components/dialog-factory';
import SchedulePopup from './schedule-location-popup';
import { createClient } from '@/utils/supabase/client';
import { fetchVehicleFutureLocationForVehicle } from '@/utils/supabase/queries';
import { VehicleFutureLocationType } from '../../types';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
const localizer = dayjsLocalizer(dayjs);

type CustomEventsType = {
  title: string;
  allDay: boolean;
  start: Date;
  end: Date;
  desc: string;
};
dayjs.extend(utc);
dayjs.extend(timezone);

const LocationScheduling = ({
  vehicle_id,
  user_id
}: {
  user_id: string;
  vehicle_id: string;
}) => {
  const supabase = createClient();
  const views: View[] = [Views.MONTH, Views.AGENDA];
  const [view, setView] = React.useState<View>(Views.MONTH);
  const [date, setDate] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [isOpenDayDialog, setIsOpenDayDialog] = React.useState(false);
  const [futureLocations, setFutureLocations] = React.useState<
    VehicleFutureLocationType[]
  >([]);
  const [customEventsList, setCustomEventsList] = React.useState<
    CustomEventsType[]
  >([]);

  const fetchFutureLocations = React.useCallback(() => {
    fetchVehicleFutureLocationForVehicle(supabase, vehicle_id)
      .then((data) => {
        setFutureLocations(data);
      })
      .catch((error) => {
        console.error('Error fetching future locations', error);
      });
  }, [supabase, vehicle_id]);

  React.useEffect(() => {
    fetchFutureLocations();
  }, [fetchFutureLocations]);

  React.useEffect(() => {
    const channel = supabase
      .channel('realtime: location scheduling')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicle_future_location'
        },
        () => {
          fetchFutureLocations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchFutureLocations]);
  //   create calendarStyle where it styles past dates differently

  React.useEffect(() => {
    const customEvents = futureLocations.map((location) => {
      const futureDate = dayjs(location.future_date).tz(dayjs.tz.guess());
      return {
        title: location.future_location ?? '',
        allDay: true,
        start: futureDate.toDate(),
        end: futureDate.toDate(),
        desc: `
            Created At: ${location.created_at || 'Unknown'} - \n
            Created By: ${location.created_by || 'Unknown'} - \n
            Location: ${location.future_location || 'Unknown'}  \n
            Date: ${location.future_date || 'Unknown'}  \n
            `
      };
    });
    setCustomEventsList(customEvents);
  }, [futureLocations]);

  const handleSelectEvent = (event: any) => {
    setIsOpenDayDialog(true);
  };

  const handleSelectSlot = (slotInfo: any) => {
    setSelectedDate(slotInfo.start);
    const slotDate = new Date(slotInfo.start);
    if (slotDate < dayjs(new Date()).subtract(1, 'day').toDate()) {
      alert('Cannot select past dates');
      return;
    }
    setIsOpenDayDialog(true);
  };

  const handleDialogClose = () => {
    setIsOpenDayDialog(false);
    fetchFutureLocations();
  };

  //   Change color of past dates
  const isPastDay = (date: Date) => {
    return date < new Date();
  };

  // datecellwrapper typescript

  const DateCellWrapper = ({
    children,
    value
  }: {
    children: React.ReactElement;
    value: Date;
  }) => {
    const isPast = isPastDay(value);
    return React.cloneElement(React.Children.only(children), {
      style: {
        ...children.props.style,
        backgroundColor: isPast ? 'lightgray' : 'inherit'
      }
    });
  };

  return (
    <div>
      <Calendar
        localizer={localizer}
        events={customEventsList}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        views={views}
        view={view}
        onView={(view) => setView(view)}
        defaultView={view}
        defaultDate={new Date()}
        selectable
        date={date}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        onNavigate={(date) => {
          setDate(new Date(date));
        }}
        components={{
          dateCellWrapper: DateCellWrapper
        }}
        min={new Date()}
      />

      <DialogFactory
        title={'Assign Location Based On Date'}
        setIsDialogOpen={setIsOpenDayDialog}
        isDialogOpen={isOpenDayDialog}
        description=""
        children={
          <SchedulePopup
            vehicle_id={vehicle_id}
            user_id={user_id}
            date={selectedDate}
            onClose={handleDialogClose}
          />
        }
      />
    </div>
  );
};

export default LocationScheduling;
