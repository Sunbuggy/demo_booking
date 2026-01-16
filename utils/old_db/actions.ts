'use server';
import { revalidateTag, revalidatePath } from 'next/cache';
import mysql from 'mysql2/promise';
import { createClient } from '../supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js'; // <--- NEW ADMIN IMPORT
import { Reservation } from '@/app/(biz)/biz/types';
import { vehiclesList } from './helpers'; // Imported for migration logic
import { v4 as uuidv4 } from 'uuid'; // Imported for UUID generation

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

// Type definitions for Supabase tables
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

// ============================================================================
// NEW MIGRATION LOGIC (Unified 3-Layer Architecture)
// ============================================================================

// Define the Real Legacy Shape (Must match your MySQL query output + dynamic columns)
interface LegacyReservation {
  res_id: number;
  customer_name: string;
  email: string | null;
  phone: string | null;
  ppl_count: number; 
  tour_date: string; // ISO String or Date object
  time: string;      // "08:00"
  status: string;    // "Confirmed", "Pending"
  location: string;  // "Nellis", "Valley"
  [key: string]: any; // Allow dynamic vehicle columns (SB1, QA, etc)
}

// Validated Vegas ID (from your checks)
const VEGAS_LOCATION_ID = 'c29cdc8e-8f16-4bc4-987c-e869dcebd6e3'; 

/**
 * Helper: Maps Legacy Status strings to our new Enum
 */
function mapLegacyStatus(status: string): string {
  const s = (status || '').toLowerCase();
  if (s.includes('confirm') || s.includes('paid')) return 'CONFIRMED';
  if (s.includes('cancel')) return 'CANCELLED';
  if (s.includes('pending')) return 'PENDING';
  return 'CONFIRMED'; // Default to confirmed for legacy imports
}

/**
 * Helper: Maps Legacy Vehicle Columns (SB1, QA) to New Resource Types
 */
function mapLegacyColumnToNewType(column: string): string {
  const map: Record<string, string> = {
    'SB1': 'BUGGY_1_SEATER',
    'SB2': 'BUGGY_2_SEATER',
    'SB4': 'BUGGY_4_SEATER',
    'SB5': 'BUGGY_5_SEATER',
    'SB6': 'BUGGY_6_SEATER',
    'QA': 'ATV_STANDARD',
    'QB': 'ATV_LARGE',
    'QU': 'UTV_UNKNOWN',
    'GoKart': 'GOKART_STD',
    'GoKartplus': 'GOKART_PLUS',
    'twoSeat4wd': 'UTV_2_SEATER',
    'UZ2': 'RZR_2_SEATER',
    'UZ4': 'RZR_4_SEATER',
    'RWG': 'RIDE_ALONG'
  };
  return map[column] || 'UNKNOWN_LEGACY_RESOURCE';
}

/**
 * MAIN MIGRATION FUNCTION:
 * Takes a Legacy Reservation and explodes it into the 3-Layer Schema.
 * Includes User Pre-Seeding Logic (Level 50).
 */
export async function migrateReservationToSupabase(legacyRes: any) {
  // 1. SETUP ADMIN CLIENT (Required to create users and bypass RLS)
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, 
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  console.log("--> Starting Migration for Legacy ID:", legacyRes.Res_ID || legacyRes.res_id);

  // --- 1. DATA NORMALIZATION ---
  const RES_ID = legacyRes.Res_ID || legacyRes.res_id;
  
  // Improved Name Logic (Checks full_name first)
  const CUSTOMER_NAME = legacyRes.full_name || legacyRes.Renter || legacyRes.customer_name || `${legacyRes.fname} ${legacyRes.lname}` || 'Unknown Renter';
  
  const EMAIL = legacyRes.Email || legacyRes.email; 
  const PHONE = legacyRes.Phone || legacyRes.phone;
  const PAX_COUNT = Number(legacyRes.Res_Group || legacyRes.ppl_count || 1);
  
  // Date Handling
  const rawDate = legacyRes.Res_Date || legacyRes.tour_date || legacyRes.sch_date;
  const rawTime = legacyRes.Res_Time || legacyRes.time || legacyRes.sch_time || '08:00';
  
  const dateStr = rawDate instanceof Date 
    ? rawDate.toISOString().split('T')[0] 
    : String(rawDate).split('T')[0];

  const formatTime = (t: string) => {
    if (!t) return '00:00';
    const clean = t.split(' ')[0];
    return clean.includes(':') 
      ? (clean.length === 4 ? `0${clean}` : clean) 
      : `${clean}:00`;
  };
  const timeStr = formatTime(rawTime);
  const startAt = new Date(`${dateStr}T${timeStr}:00`); 
  const endAt = new Date(startAt.getTime() + 2 * 60 * 60 * 1000); 

  // --- 2. IDENTITY (THE NEW "LEVEL 50" LOGIC) ---
  let userId: string | null = null;
  
  if (EMAIL && EMAIL.includes('@')) {
    // A. Check if user already exists
    // We check the public table via Admin to ensure we find them
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', EMAIL)
      .maybeSingle();

    if (existingUser) {
      console.log(`   User found: ${EMAIL} (${existingUser.id})`);
      userId = existingUser.id;
    } else {
      // B. Create NEW User (Level 50)
      console.log(`   Creating NEW User for: ${EMAIL}`);
      
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: EMAIL,
        email_confirm: true, // Auto-verify so they can login immediately
        user_metadata: {
          full_name: CUSTOMER_NAME,
          phone: PHONE
        }
      });

      if (createError) {
        console.error("   Failed to create user:", createError.message);
        // Fallback: Continue as Guest (don't crash the migration)
        userId = null; 
      } else if (newUser.user) {
        userId = newUser.user.id;
        
        // C. Force Update Level to 50 (Pre-Seeded User)
        // We wait a tiny bit to ensure the Trigger created the public profile
        await new Promise(r => setTimeout(r, 500)); 
        
        await supabaseAdmin
          .from('users')
          .update({ 
            user_level: 50, // "Legacy Customer"
            full_name: CUSTOMER_NAME, // Ensure name is synced
            phone: PHONE
          })
          .eq('id', userId);
      }
    }
  }

  // --- 3. LAYER 1: BOOKING HEADER ---
  // Note: We use 'supabaseAdmin' here too to bypass RLS policies during migration
  const { data: booking, error } = await supabaseAdmin
    .from('bookings')
    .upsert({
      location_id: VEGAS_LOCATION_ID, 
      customer_id: userId, // Now linked to the real (or new) account!
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      legacy_id: RES_ID,
      status: mapLegacyStatus(legacyRes.Status || legacyRes.status),
      group_name: CUSTOMER_NAME,
      total_pax_count: PAX_COUNT,
      operational_metadata: {
        migrated_from_legacy: true,
        legacy_tour_code: legacyRes.Location || legacyRes.location,
        legacy_notes: legacyRes.Notes || legacyRes.notes
      }
    }, { onConflict: 'legacy_id' })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create booking header: ${error.message}`);
  }

  // --- 4. LAYER 2: PARTICIPANTS ---
  await supabaseAdmin.from('booking_participants').delete().eq('booking_id', booking.id);

  const participants = [];
  
  // A. Primary Renter (Linked to User ID now)
  participants.push({
    booking_id: booking.id,
    user_id: userId, // Linked!
    role: 'PRIMARY_RENTER',
    check_in_status: 'EXPECTED',
    temp_name: CUSTOMER_NAME // Keep temp_name as backup
  });

  // B. Guests
  const guestCount = Math.max(0, PAX_COUNT - 1);
  for (let i = 0; i < guestCount; i++) {
    participants.push({
      booking_id: booking.id,
      role: 'GUEST', // Changed to GUEST from PASSENGER
      check_in_status: 'EXPECTED',
      temp_name: `Guest ${i + 1} of ${CUSTOMER_NAME}`
    });
  }

  if (participants.length > 0) {
    await supabaseAdmin.from('booking_participants').insert(participants);
  }

  // --- 5. LAYER 3: RESOURCES ---
  await supabaseAdmin.from('booking_resources').delete().eq('booking_id', booking.id);
  
  const resources = [];
  
  // Iterate strictly through the known vehicle columns
  for (const vKey of vehiclesList) {
    const count = Number(legacyRes[vKey] || 0);
    if (count > 0) {
      for (let k = 0; k < count; k++) {
        resources.push({
          booking_id: booking.id,
          vehicle_type_id: mapLegacyColumnToNewType(vKey),
        });
      }
    }
  }

  if (resources.length > 0) {
    await supabaseAdmin.from('booking_resources').insert(resources);
  }

  return booking.id;
}