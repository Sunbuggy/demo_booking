// app/api/pismo/legacy-pricing/route.ts - READ-ONLY from legacy pismo_pricing table

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

    const [rows] = await connection.execute(`
      SELECT 
        buggyID AS id,
        name AS buggyName,
        seats,
        price_1 AS \`1hr\`,
        price_15 AS \`1.5hr\`,
        price_2 AS \`2hr\`,
        price_25 AS \`2.5hr\`,
        price_3 AS \`3hr\`,
        price_35 AS \`3.5hr\`,
        price_4 AS \`4hr\`,
        enable_online AS onlineOrdering,
        enable_phone AS phoneOrdering,
        type AS typeVehicle,
        search_term AS searchTerm,
        belt,
        insurance AS damageWaiver,
        dep AS deposit
      FROM pismo_pricing 
      ORDER BY seats ASC, price_1 ASC
    `);

    return NextResponse.json(rows);
  } catch (error: any) {
    console.error('Legacy pricing load error:', error);
    return NextResponse.json(
      { error: 'Failed to load pricing from legacy database', details: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}

// No POST handler — write disabled