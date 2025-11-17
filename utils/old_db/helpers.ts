import { Reservation } from '@/app/(biz)/biz/types';
import { UserType } from '@/app/(biz)/biz/users/types';

export async function getTimeSortedData(data: Reservation[]) {
  if (data.length > 0) {
    const data_with_location = changeLocation(data);

    const transform_sch_time = (sch_time: string) => {
      // Format of sch_time is 'hh:mm'
      // if sch_time is '12:00' till '6:00', return '12:00 PM' till '6:00 PM'
      // if sch_time is '8:00' till '11:00', return '8:00 AM' till '11:00 AM'
      const hour = Number(sch_time.split(':')[0]);
      const minute = sch_time.split(':')[1];
      if (hour === 12) {
        return `${hour}:${minute} PM`;
      } else if (hour >= 1 && hour <= 6) {
        return `${hour}:${minute} PM`;
      } else {
        return `${hour}:${minute} AM`;
      }
    };
    //   sch_time transformed data
    const sch_time_transformed_data = data_with_location?.map((reservation) => {
      return {
        ...reservation,
        sch_time: transform_sch_time(String(reservation?.sch_time))
      };
    });
    // Group the data by sch_time and return the grouped data
    const grouped_data_by_sch_time = sch_time_transformed_data.reduce(
      (acc, reservation) => {
        const key = reservation.sch_time;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(reservation);
        return acc;
      },
      {} as Record<string, Reservation[]>
    );

    //   Function to further sort the grouped data by sch_time
    const sort_order = [
      '7:00 AM',
      '8:00 AM',
      '9:00 AM',
      '10:00 AM',
      '11:00 AM',
      '12:00 PM',
      '1:00 PM',
      '2:00 PM',
      '3:00 PM',
      '4:00 PM',
      '5:00 PM',
      '6:00 PM'
    ];
    const sorted_grouped_data = Object.keys(grouped_data_by_sch_time)
      .sort((a, b) => sort_order.indexOf(a) - sort_order.indexOf(b))
      .reduce(
        (acc, key) => {
          acc[key] = grouped_data_by_sch_time[key];
          return acc;
        },
        {} as Record<string, Reservation[]>
      );

    // Function to further group the data of grouped_data_by_sch_time by location
    const grouped_data_by_location = Object.keys(sorted_grouped_data).reduce(
      (acc, key) => {
        const grouped_data = grouped_data_by_sch_time[key];
        const location_grouped_data = grouped_data.reduce(
          (acc, reservation) => {
            const key = reservation.location;
            if (!acc[key]) {
              acc[key] = [];
            }
            acc[key].push(reservation);
            return acc;
          },
          {} as Record<string, Reservation[]>
        );
        acc[key] = location_grouped_data;
        return acc;
      },
      {} as Record<string, Record<string, Reservation[]>>
    );
    return grouped_data_by_location;
  }
}

function changeLocation(data: Reservation[]) {
  const with_location = data?.map((itm) => {
    let location = itm.location;
    switch (location) {
      case 'Nellis30':
        location = 'Mini Baja X (30 min)';
        break;
      case 'Nellis60':
        location = 'Mini Baja XX (60 min)';
        break;
      case 'Nellis':
        location = 'Mini Baja (90 min)';
        break;
      case 'NellisDX':
        location = 'Mini Baja XXX (120 min)';
        break;
      case 'FamilyFun':
        location = 'Family Fun XX';
        break;
      case 'NellisTram60':
        location = 'Nellis Tram XX (60 min)';
        break;
      case 'DunesRZR30':
        location = 'Dunes RZR X (30 min)';
        break;
      case 'DunesRZR':
        location = 'Dunes RZR XX (60 min)';
        break;
      case 'DunesATV30':
        location = 'Dunes ATV X (30 min)';
        break;
      case 'DunesATV':
        location = 'Dunes ATV XX (60 min)';
        break;
      case 'DuneATVpack':
        location = 'ATV XL pack (60 min)';
        break;
      case 'DuneATVpack30':
        location = 'ATV XL Intro pack (30 min)';
        break;
      case 'DunesUTV30':
        location = 'Dunes UTV X (30 min)';
        break;
      case 'Dakar':
        location = 'Mini-Dakar XX';
        break;
      case 'Amargosa':
        location = 'Amargosa';
        break;
      case 'Valley':
        location = 'Valley Of Fire';
        break;
      case 'TerraDrift':
        location = 'Terra Drift';
        break;
      case 'DuneDrift':
        location = 'Dune-n-Drift';
        break;
      case 'NellisDunes30':
        location = 'Nellis Dunes X (30 min)';
        break;
      case 'NellisDunes60':
        location = 'Nellis Dunes XX (60 min)';
        break;
      case 'NellisDunes':
        location = 'Nellis Dunes XXX (90 min)';
        break;
      case 'NellisAD30':
        location = 'Mini Baja AD X (30 min)';
        break;
      case 'RZR_valley':
        location = 'RZR Valley';
        break;
      case 'TrackBaja1':
        location = 'Track-n-Baja XX (60 min)';
        break;
      case 'TrackBaja2':
        location = 'Track-n-Baja (120 min)';
        break;
      case 'TrackBaja3':
        location = 'Track-n-Baja (180 min)';
        break;
      case 'TrackBaja4':
        location = 'Track-n-Baja (240 min)';
        break;
      case 'GoKart':
        location = 'Go Karts (10 min)';
        break;
      case 'TrashPatrol':
        location = 'Trash Patrol (120 min)';
        break;
      case 'comboBajaATV':
        location = 'Dunes Combos (ATV 60min + m.baja 30min)';
        break;
      case 'DunesATVFR':
          location = 'Dunes ATV Free Roam XX';
          break;

      default:
        break;
    }
    return {
      ...itm,
      location
    };
  });
  return with_location;
}
export const vehiclesList = [
  'QA',
  'QB',
  'QU',
  'QL',
  'SB1',
  'SB2',
  'SB4',
  'SB5',
  'SB6',
  'twoSeat4wd',
  'UZ2',
  'UZ4',
  'RWG',
  'GoKartplus',
  'GoKart'
];
export const getVehicleCount = (reservation: Reservation): number => {
  return vehiclesList.reduce((acc, key) => {
    return acc + Number(reservation[key as keyof typeof reservation]);
  }, 0);
};
export const countPeople = (reservation: Reservation): number => {
  return reservation.ppl_count;
};
export function transformEmplyees(users: UserType[]) {
  const employees = users.filter((user) => user.user_level > 249);
  employees.forEach((user) => {
    if (user.id === 'e27026d4-79ef-4efd-a9e9-a9a12c0edbd8') {
      user.user_level = 900;
    }
  });
  return employees;
}
