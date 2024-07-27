'use server';

import { revalidateTag } from 'next/cache';
import mysql from 'mysql2/promise';
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
