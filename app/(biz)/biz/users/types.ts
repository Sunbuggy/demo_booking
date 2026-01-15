export enum time_entry_status {
  clocked_in = 'clocked_in',
  clocked_out = 'clocked_out',
  on_break = 'on_break'
}

export type UserType = {
  id: string;
  full_name: string;
  avatar_url: string;
  user_level: number;
  time_entry_status: time_entry_status | null;
  email: string;
  
  // Optional fields used in Account Page
  stage_name?: string | null;
  phone?: string | null;
};