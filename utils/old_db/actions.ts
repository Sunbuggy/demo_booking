'use server';
import { revalidateTag, revalidatePath } from 'next/cache';
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
  // Next.js 15 requires a second parameter for revalidateTag
  revalidateTag('old_mysql', '/');
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

// Type definitions for Supabase tables (adjust these based on your actual schema)
interface Group {
  id: string;
  group_name: string;
  group_date: string;
  created_by: string;
  lead?: string;
  sweep?: string;
  launched?: string | null;
}

interface GroupVehicle {
  id: string;
  group_id: string;
  old_booking_id: number;
  old_vehicle_name: string;
  quantity: number;
}

// Type-safe supabase operations
type SupabaseTables = {
  groups: Group;
  group_vehicles: GroupVehicle;
};

//group functions
export async function createGroups(
  group_name: string,
  group_date: string,
  created_by: string,
  lead?: string,
  sweep?: string
) {
  const supabase =  await createClient();
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

  const supabase = await createClient();
  try {
    // Type-safe insert with proper typing
    const insertData = {
      group_id,
      old_booking_id,
      old_vehicle_name,
      quantity
    };

    const { data, error } = await (supabase as any)
      .from('group_vehicles')
      .insert([insertData])
      .select()
      .single();

    return error ? handleSupabaseError(error, 'insertIntoGroupVehicles') : { data, error: null };
  } catch (error) {
    return handleSupabaseError(error, 'insertIntoGroupVehicles');
  }
}

export async function deleteFromGroupVehicles(id: string) {
  if (!id) return { data: null, error: 'No id provided.' };

  const supabase = await createClient();
  try {
    const { data, error } = await (supabase as any)
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

  const supabase = await createClient();
  try {
    const { data, error } = await (supabase as any)
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

  const supabase = await createClient();
  try {
    const { data, error } = await (supabase as any)
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

  const supabase = await createClient();
  try {
    let timestampz = null;
    if (status) {
      timestampz = new Date().toISOString();
    }

    const { data, error } = await (supabase as any)
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
  const supabase = await createClient();
  try {
    const { data: existingGroup, error: fetchError } = await (supabase as any)
      .from('groups')
      .select('group_date')
      .eq('id', groupId)
      .single();

    if (fetchError) throw fetchError;

    const { data: conflictGroup, error: conflictError } = await (supabase as any)
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
    const { data, error } = await (supabase as any)
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
  const query = `SELECT *, CAST(total_cost AS FLOAT) AS total_cost FROM reservations_modified WHERE Res_ID = ${res_id}`;
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

export async function updateFullReservation(
  res_id: number,
  updates: Partial<Reservation>
) {
  try {
    // Format time to 12-hour format without leading zeros
    const formatTimeTo12Hour = (time: string): string => {
      if (!time) return '';
      
      if (time.includes('am') || time.includes('pm')) {
        const timePart = time.split(' ')[0];
        const hasColon = timePart.includes(':');
        return hasColon ? timePart : `${timePart}:00`;
      }
      
      if (time.includes(':')) {
        const [hours, minutes] = time.split(':');
        let hour = parseInt(hours, 10);
        const period = hour >= 12 ? 'pm' : 'am';
        
        hour = hour % 12 || 12;
        
        return `${hour}:${minutes || '00'}`;
      }
      
      return time;
    };

    // Split full name into first and last name
    const splitName = (fullName: string): { fname: string, lname: string } => {
      if (!fullName) return { fname: '', lname: '' };
      
      const names = fullName.trim().split(' ');
      if (names.length === 1) {
        return { fname: names[0], lname: '' };
      }
      
      const fname = names[0];
      const lname = names.slice(1).join(' ');
      return { fname, lname };
    };

    // Format the time and split the name
    const formattedTime = formatTimeTo12Hour(updates.sch_time || '');
    const { fname, lname } = splitName(updates.full_name || '');

    // Add formatted fields to updates
    const processedUpdates = {
      ...updates,
      sch_time: formattedTime,
      fname,
      lname
    };

    // Build the SET clause for SQL
    const setClause = Object.entries(processedUpdates)
      .map(([key, value]) => {
        if (value === undefined || value === null) return null;
        
        // Map field names to database columns
        const fieldMapping: Record<string, string> = {
          full_name: 'Renter',
          sch_date: 'Res_Date',
          sch_time: 'Res_Time',
          agent: 'Book_Name',
          location: 'Location',
          occasion: 'occasion',
          ppl_count: 'Res_Group',
          phone: 'Cell_Ph',
          email: 'Email',
          hotel: 'Hotel',
          notes: 'Notes',
          fname: 'fname',
          lname: 'lname',
          QA: 'ATV_2wd',
          QB: 'ATVs',
          QU: 'med_ATV_2wd',
          QL: 'LuxuryATV',
          SB1: 'OneSeaters',
          SB2: 'TwoSeaters',
          SB4: 'FourSeaters',
          SB5: 'FiveSeaters',
          SB6: 'Sixseaters',
          twoSeat4wd: 'TwoSeat_4wd',
          UZ2: 'TwoSeatrzr',
          UZ4: 'FourSeatrzr',
          RWG: 'RideGuide',
          GoKartplus: 'GoKartAdd',
          GoKart: 'GoKart',
          total_cost: 'Cost'
        };

        const dbColumn = fieldMapping[key] || key;
        
        if (typeof value === 'string') {
          return `\`${dbColumn}\` = '${value.replace(/'/g, "''")}'`;
        }
        
        if (value instanceof Date) {
          return `\`${dbColumn}\` = '${value.toISOString().split('T')[0]}'`;
        }
        
        return `\`${dbColumn}\` = ${value}`;
      })
      .filter(Boolean)
      .join(', ');

    if (!setClause) {
      throw new Error('No valid fields to update');
    }

    const query = `UPDATE Reservations SET ${setClause} WHERE Res_ID = ${res_id}`;
    console.log('Updating reservation with query:', query);
    
    const result = await fetch_from_old_db(query);
    
    return { success: true, result };
  } catch (error) {
    console.error('Error updating reservation:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function createReservation(updates: Partial<Reservation>) {
  try {
    // Format time to 12-hour format without leading zeros
    const formatTimeTo12Hour = (time: string): string => {
      if (!time) return '';
      
      if (time.includes('am') || time.includes('pm')) {
        const timePart = time.split(' ')[0];
        const hasColon = timePart.includes(':');
        return hasColon ? timePart : `${timePart}:00`;
      }
      
      if (time.includes(':')) {
        const [hours, minutes] = time.split(':');
        let hour = parseInt(hours, 10);
        const period = hour >= 12 ? 'pm' : 'am';
        
        hour = hour % 12 || 12;
        
        return `${hour}:${minutes || '00'}`;
      }
      
      return time;
    };

    // Split full name into first and last name
    const splitName = (fullName: string): { fname: string, lname: string } => {
      if (!fullName) return { fname: '', lname: '' };
      
      const names = fullName.trim().split(' ');
      if (names.length === 1) {
        return { fname: names[0], lname: '' };
      }
      
      const fname = names[0];
      const lname = names.slice(1).join(' ');
      return { fname, lname };
    };

    // Format the time
    const formattedTime = formatTimeTo12Hour(updates.sch_time || '');
    
    // Split the name
    const { fname, lname } = splitName(updates.full_name || '');

    // Build the INSERT query for the Reservations table
    const columns: string[] = [];
    const values: any[] = [];
    const placeholders: string[] = [];

    // Map our form fields to the actual database columns
    const fieldMapping: Record<string, string> = {
      full_name: 'Renter',
      sch_date: 'Res_Date', // User-selected booking date goes here
      sch_time: 'Res_Time',
      agent: 'Book_Name',
      location: 'Location',
      occasion: 'occasion',
      ppl_count: 'Res_Group',
      phone: 'Cell_Ph',
      email: 'Email',
      hotel: 'Hotel',
      notes: 'Notes',
      fname: 'fname',
      lname: 'lname',
      // Vehicle mappings
      QA: 'ATV_2wd',
      QB: 'ATVs',
      QU: 'med_ATV_2wd',
      QL: 'LuxuryATV',
      SB1: 'OneSeaters',
      SB2: 'TwoSeaters',
      SB4: 'FourSeaters',
      SB5: 'FiveSeaters',
      SB6: 'Sixseaters',
      twoSeat4wd: 'TwoSeat_4wd',
      UZ2: 'TwoSeatrzr',
      UZ4: 'FourSeatrzr',
      RWG: 'RideGuide',
      GoKartplus: 'GoKartAdd',
      GoKart: 'GoKart',
      total_cost: 'Cost'
    };

    // Add current date/time for booking (Book_Date and Book_Time) - this is when the booking was created
    const now = new Date();
    columns.push('Book_Date', 'Book_Time');
    placeholders.push('?', '?');
    values.push(now.toISOString().split('T')[0]); // Current date as YYYY-MM-DD for Book_Date
    values.push(now.toTimeString().split(' ')[0].substring(0, 8)); // Current time as HH:MM:SS for Book_Time

    // Process each field from updates
    const processedUpdates = {
      ...updates,
      sch_time: formattedTime, // Use formatted time
      fname, // Add first name
      lname  // Add last name
    };

    console.log('=== DATABASE INSERTION DEBUG ===');
    console.log('User selected booking date (Res_Date):', updates.sch_date);
    console.log('Creation date (Book_Date):', now.toISOString().split('T')[0]);

    Object.entries(processedUpdates).forEach(([key, value]) => {
      const dbColumn = fieldMapping[key];
      if (dbColumn && value !== undefined && value !== null) {
        columns.push(`\`${dbColumn}\``);
        placeholders.push('?');
        
        // Handle different value types
        if (value instanceof Date) {
          // CRITICAL: Store the selected booking date as Res_Date in YYYY-MM-DD format
          const dateString = value.toISOString().split('T')[0];
          console.log(`Setting ${dbColumn} to:`, dateString);
          values.push(dateString);
        } else if (typeof value === 'string') {
          values.push(value);
        } else {
          values.push(value);
        }
      }
    });

    if (columns.length === 0) {
      throw new Error('No valid fields to insert');
    }

    const query = `INSERT INTO Reservations (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;
    
    console.log('Final SQL Query:', query);
    console.log('Final Values:', values);
    console.log('=== END DEBUG ===');

    // Use your existing database connection
    const result = await withDatabaseConnection(async (connection) => {
      const [rows] = await connection.execute(query, values);
      return rows;
    });

    // Get the inserted ID
    const insertId = (result as any).insertId;
    
    if (!insertId) {
      throw new Error('Failed to get reservation ID after insertion');
    }

    return { 
      success: true, 
      reservationId: insertId,
      error: null 
    };
  } catch (error) {
    console.error('Error creating reservation:', error);
    return { 
      success: false, 
      reservationId: null,
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export const launchGroup = async (group_id: string) => {
  return await updateGroupStatus(group_id, true);
};

export const unLaunchGroup = async (group_id: string) => {
  return await updateGroupStatus(group_id, false);
};