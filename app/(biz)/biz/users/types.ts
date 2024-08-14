export type UserType = {
  id: string;
  full_name: string;
  avatar_url: string;
  user_level: number;
  time_entry_status: time_entry_status | null;
  email: string;
};

export enum time_entry_status {
  clocked_in = 'clocked_in',
  clocked_out = 'clocked_out',
  on_break = 'on_break'
}
