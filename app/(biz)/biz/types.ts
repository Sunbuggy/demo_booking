export interface Reservation {
  res_id: number;
  full_name?: string;
  sch_date: Date;
  sch_time?: string;
  agent?: string;
  created_date?: Date;
  location: string;
  occasion?: string;
  ppl_count: number;
  fname?: string;
  lname?: string;
  total_cost?: string;
  phone?: string;
  email?: string;
  hotel?: string;
  created_time?: string;
  is_special_event?: number;
  notes?: string;
  QA?: number;
  QB?: number;
  QU?: number;
  QL?: number;
  SB1?: number;
  SB2?: number;
  SB4?: number;
  SB5?: number;
  SB6?: number;
  twoSeat4wd?: number;
  UZ2?: number;
  UZ4?: number;
  RWG?: number;
  GoKartplus?: number;
  GoKart?: number;
  custom_cost?: number;
}

export interface OldDbVehicle {
  QA?: number;
  QB?: number;
  QU?: number;
  QL?: number;
  SB1?: number;
  SB2?: number;
  SB4?: number;
  SB5?: number;
  SB6?: number;
  twoSeat4wd?: number;
  UZ2?: number;
  UZ4?: number;
  RWG?: number;
  GoKartplus?: number;
  GoKart?: number;
}
export interface GroupsType {
  launch_time: string | undefined;
  id: string;
  group_name: string;
  created_at: string;
  created_by: string;
  group_date: string;
  lead?: string;
  sweep?: string;
  launched: string | null;
}
interface GroupType {
  group_name: string;
  group_date: string;
}

export interface GroupVehiclesType {
  id: string;
  quantity: string;
  old_vehicle_name: string;
  old_booking_id: string;
  groups: GroupType | GroupType[]; // groups can be a single object or an array of objects
}
