'use server';
import { revalidateTag } from 'next/cache';
import mysql from 'mysql2/promise';
import { createClient } from '../supabase/server';
export default async function revalidateOldMysql() {
  revalidateTag('old_mysql');
}
export async function fetch_from_old_db(query: string) {
  const connection = await mysql.createConnection({
    host: process.env.OLD_MYSQL_DB_HOST,
    user: process.env.OLD_MYSQL_DB_USER,
    database: process.env.OLD_MYSQL_DB_NAME,
    password: process.env.OLD_MYSQL_DB_PASSWORD
  });
  try {
    const [rows] = await connection.query(query);
    return rows;
  } catch (error) {
    console.error('An error occurred while fetching data:', error);
    return [];
  }
}

export async function createGroups(
  group_name: string,
  group_date: string,
  created_by: string
) {
  const supabase = createClient();
  // Throw Error if same group_name and group_date already exists
  const { data: existingGroups, error: existingGroupsError } = await supabase
    .from('groups')
    .select()
    .eq('group_name', group_name)
    .eq('group_date', group_date);
  if (existingGroups?.length) {
    return { data: null, error: 'Group already exists.' };
  }
  const { data, error } = await supabase
    .from('groups')
    .insert([{ group_name, group_date, created_by }]);
  return { data, error };
}

export async function insertIntoGroupVehicles(
  group_id: string,
  old_booking_id: number,
  old_vehicle_name: string,
  quantity: number
) {
  if (quantity > 10) {
    return { data: null, error: 'Quantity cannot be more than 10.' };
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from('group_vehicles')
    .insert([{ group_id, old_booking_id, old_vehicle_name, quantity }]);
  return { data, error };
}

export async function deleteFromGroupVehicles(id: string) {
  const supabase = createClient();
  if (!id) {
    return { data: null, error: 'No id provided.' };
  }
  const { data, error } = await supabase
    .from('group_vehicles')
    .delete()
    .eq('id', id);
  return { data, error };
}

export async function updateGroupVehicleQuantity(id: string, quantity: number) {
  const supabase = createClient();
  if (!id) {
    return { data: null, error: 'No id provided.' };
  }
  const { data, error } = await supabase
    .from('group_vehicles')
    .update({ quantity })
    .eq('id', id);
  return { data, error };
}
