// app/api/pismo/pricing/route.ts

import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.LEGACY_MYSQL_HOST,
      user: process.env.LEGACY_MYSQL_USER,
      password: process.env.LEGACY_MYSQL_PASSWORD,
      database: process.env.LEGACY_MYSQL_DATABASE,
    });

    const [rows] = await connection.execute('SELECT * FROM pismo_pricing ORDER BY seats ASC, `1hr` ASC');

    return NextResponse.json(rows);
  } catch (error: any) {
    console.error('Legacy DB error:', error);
    return NextResponse.json({ error: 'Failed to load pricing from legacy system' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}