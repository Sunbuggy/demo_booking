'use server';
import { revalidateTag } from 'next/cache';
import mysql from 'mysql2/promise';
import { createClient } from '../supabase/server';
import { Reservation } from '@/app/(biz)/biz/types';

// Create a MySQL connection pool instead of individual connections
const mysqlPool = mysql.createPool({
  host: process.env.OLD_MYSQL_DB_HOST,
  user: process.env.OLD_MYSQL_DB_USER,
  database: process.env.OLD_MYSQL_DB_NAME,
  password: process.env.OLD_MYSQL_DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000, // 10 seconds timeout
});

async function withDatabaseConnection<T>(fn: (connection: mysql.PoolConnection) => Promise<T>) {
  let connection: mysql.PoolConnection | null = null;
  const maxRetries = 3;
  let lastError: Error = new Error('Unknown database error');

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      connection = await mysqlPool.getConnection();
      const result = await fn(connection);
      connection.release();
      return result;
    } catch (error) {
      lastError = error as Error;
      if (connection) connection.release();
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        continue;
      }
    }
  }
  
  lastError.message = `Database operation failed after ${maxRetries} attempts: ${lastError.message}`;
  throw lastError;
}

export default async function revalidateOldMysql() {
  revalidateTag('old_mysql');
}

export async function fetch_from_old_db(query: string) {
  return withDatabaseConnection(async (connection) => {
    const [rows] = await connection.query(query);
    return rows;
  }).catch(error => {
    console.error('Database operation failed:', error);
    return [];
  });
}

function handleSupabaseError(error: any, context: string) {
  console.error(`Supabase error in ${context}:`, error);
  return { data: null, error: error.message };
}

//group functions
export async function createGroups(
  group_name: string,
  group_date: string,
  created_by: string,
  lead?: string,
  sweep?: string
) {
  const supabase = createClient();
  try {
    const { data: existingGroups, error } = await supabase
      .from('groups')
      .select()
      .eq('group_name', group_name)
      .eq('group_date', group_date)
      .maybeSingle();

    if (error) throw error;
    if (existingGroups) return { data: null, error: 'Group already exists.' };

    const { data, error: createError } = await supabase
      .from('groups')
      .insert([{ group_name, group_date, created_by, lead, sweep }])
      .select()
      .single();

    return createError ? handleSupabaseError(createError, 'createGroups') : { data, error: null };
  } catch (error) {
    return handleSupabaseError(error, 'createGroups');
  }
}

export async function insertIntoGroupVehicles(
  group_id: string,
  old_booking_id: number,
  old_vehicle_name: string,
  quantity: number
) {
  if (quantity > 10) return { data: null, error: 'Quantity cannot be more than 10.' };
  if (!group_id) return { data: null, error: 'Invalid group ID' };

  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('group_vehicles')
      .insert([{ group_id, old_booking_id, old_vehicle_name, quantity }])
      .select()
      .single();

    return error ? handleSupabaseError(error, 'insertIntoGroupVehicles') : { data, error: null };
  } catch (error) {
    return handleSupabaseError(error, 'insertIntoGroupVehicles');
  }
}

export async function deleteFromGroupVehicles(id: string) {
  if (!id) return { data: null, error: 'No id provided.' };

  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('group_vehicles')
      .delete()
      .eq('id', id)
      .select()
      .single();

    return error ? handleSupabaseError(error, 'deleteFromGroupVehicles') : { data, error: null };
  } catch (error) {
    return handleSupabaseError(error, 'deleteFromGroupVehicles');
  }
}

export async function updateGroupVehicleQuantity(
  id: string,
  quantity: number
) {
  if (!id) return { data: null, error: 'No id provided.' };

  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('group_vehicles')
      .update({ quantity })
      .eq('id', id)
      .select()
      .single();

    return error ? handleSupabaseError(error, 'updateGroupVehicleQuantity') : { data, error: null };
  } catch (error) {
    return handleSupabaseError(error, 'updateGroupVehicleQuantity');
  }
}

export async function deleteGroup(group_id: string) {
  if (!group_id) return { data: null, error: 'No id provided.' };

  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('groups')
      .delete()
      .eq('id', group_id)
      .select()
      .single();

    return error ? handleSupabaseError(error, 'deleteGroup') : { data, error: null };
  } catch (error) {
    return handleSupabaseError(error, 'deleteGroup');
  }
}

async function updateGroupStatus(group_id: string, status: boolean) {
  if (!group_id) return { data: null, error: 'No id provided.' };

  const supabase = createClient();
  try {
    let timestampz = null;
    if (status) {
      timestampz = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('groups')
      .update({ launched: timestampz })
      .eq('id', group_id)
      .select()
      .single();

    return error ? handleSupabaseError(error, 'updateGroupStatus') : { data, error: null };
  } catch (error) {
    return handleSupabaseError(error, 'updateGroupStatus');
  }
}

export async function updateGroupName(groupId: string, newGroupName: string) {
  const supabase = createClient();
  try {
    const { data: existingGroup, error: fetchError } = await supabase
      .from('groups')
      .select('group_date')
      .eq('id', groupId)
      .single();

    if (fetchError) throw fetchError;

    const { data: conflictGroup, error: conflictError } = await supabase
      .from('groups')
      .select('id')
      .eq('group_name', newGroupName)
      .eq('group_date', existingGroup.group_date)
      .maybeSingle();

    if (conflictError) throw conflictError;
    if (conflictGroup) {
      return { data: null, error: 'Group name already exists for this date.' };
    }

    // Update the group name
    const { data, error } = await supabase
      .from('groups')
      .update({ group_name: newGroupName })
      .eq('id', groupId)
      .select()
      .single();

    return error ? handleSupabaseError(error, 'updateGroupName') : { data, error: null };
  } catch (error) {
    return handleSupabaseError(error, 'updateGroupName');
  }
}

export async function getReservationById(res_id: string): Promise<Reservation | null> {
  const query = `SELECT * FROM reservations_modified WHERE Res_ID = ${res_id}`;
  const data = await fetch_from_old_db(query) as Reservation[];
  return data.length > 0 ? data[0] : null;
}


export async function updateReservation(res_id: number, updates: Partial<Reservation>) {
  try {
    // Build the SET clause for SQL
    const setClause = Object.entries(updates)
      .map(([key, value]) => {
        // Handle different value types
        if (value === undefined || value === null) return null;
        
        if (typeof value === 'string') {
          return `\`${key}\` = '${value.replace(/'/g, "''")}'`;
        }
        
        if (value instanceof Date) {
          return `\`${key}\` = '${value.toISOString().split('T')[0]}'`;
        }
        
        return `\`${key}\` = ${value}`;
      })
      .filter(Boolean)
      .join(', ');

    if (!setClause) {
      throw new Error('No valid fields to update');
    }

    const query = `UPDATE reservations_modified SET ${setClause} WHERE Res_ID = ${res_id}`;
    const result = await fetch_from_old_db(query);
    
    return { success: true, result };
  } catch (error) {
    console.error('Error updating reservation:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export const launchGroup = (group_id: string) => updateGroupStatus(group_id, true);
export const unLaunchGroup = (group_id: string) => updateGroupStatus(group_id, false);