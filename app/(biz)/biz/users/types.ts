export type UserType = {
  id: string;
  full_name: string;
  avatar_url: string;
  user_level: number;
  time_entry_status: time_entry_status | null;
  email: string;
};

export enum time_entry_status {
  CLOCKED_IN = 'CLOCKED_IN',
  CLOCKED_OUT = 'CLOCKED_OUT',
  ON_BREAK = 'ON_BREAK'
}
