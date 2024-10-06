'use client';
import React from 'react';
import { Calendar, dayjsLocalizer, Views, View } from 'react-big-calendar';
import dayjs from 'dayjs';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import DialogFactory from '@/components/dialog-factory';
import SchedulePopup from './schedule-location-popup';

const localizer = dayjsLocalizer(dayjs);

const LocationScheduling = ({
  vehicle_id,
  user_id
}: {
  user_id: string;
  vehicle_id: string;
}) => {
  const views: View[] = [Views.MONTH, Views.AGENDA];
  const [view, setView] = React.useState<View>(Views.MONTH);
  const [date, setDate] = React.useState(new Date());
  const [isOpenDayDialog, setIsOpenDayDialog] = React.useState(false);

  const customEventsList = [
    {
      title: 'All Day Event very long title',
      allDay: true,
      start: new Date(2024, 10, 0),
      end: new Date(2024, 10, 1),
      desc: 'This is a very long description that should be truncated'
    }
  ];
  const handleSelectEvent = (event: any) => {
    setIsOpenDayDialog(true);
  };

  const handleSelectSlot = (slotInfo: any) => {
    setIsOpenDayDialog(true);
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
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        onNavigate={(date) => {
          setDate(new Date(date));
        }}
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
            date={date}
          />
        }
      />
    </div>
  );
};

export default LocationScheduling;
