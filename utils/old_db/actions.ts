'use server';
import { revalidateTag } from 'next/cache';
import mysql from 'mysql2/promise';
import { createClient } from '../supabase/server';

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

// Reusable database connection handler with retry logic
async function withDatabaseConnection<T>(fn: (connection: mysql.PoolConnection) => Promise<T>) {
  let connection: mysql.PoolConnection | null = null;
  const maxRetries = 3;
  let lastError: Error = new Error('Unknown database error'); // Initialize with default error

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
  
  // Add explicit error information if all retries failed
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

// Reusable Supabase client handler with error management
function handleSupabaseError(error: any, context: string) {
  console.error(`Supabase error in ${context}:`, error);
  return { data: null, error: error.message };
}

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

// Updated insert function with better validation
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

// Improved delete function with existence check
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

// Updated quantity update function
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

// Enhanced group deletion
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

// Improved launch/unlaunch with transaction safety
async function updateGroupStatus(group_id: string, status: boolean) {
  if (!group_id) return { data: null, error: 'No id provided.' };

  const supabase = createClient();
  try {
    const timestampz = status ? new Date().toISOString() : null;
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

export const launchGroup = (group_id: string) => updateGroupStatus(group_id, true);
export const unLaunchGroup = (group_id: string) => updateGroupStatus(group_id, false);