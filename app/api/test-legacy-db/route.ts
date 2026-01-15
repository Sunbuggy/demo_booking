// app/api/test-legacy-db/route.ts - Simple connection test

import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.OLD2_MYSQL_DB_HOST,
      user: process.env.OLD2_MYSQL_DB_USER,
      password: process.env.OLD2_MYSQL_DB_PASSWORD,
      database: process.env.OLD2_MYSQL_DB_NAME,
      port: Number(process.env.OLD2_MYSQL_DB_PORT) || 3306,
    });

    // Simple query to test connection
    const [rows] = await connection.execute('SELECT "Connection successful!" AS message');

    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    console.error('Legacy DB connection test failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        code: error.code, // e.g., 'ECONNREFUSED', 'ER_ACCESS_DENIED_ERROR'
        errno: error.errno 
      },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}
