'use server';

import { revalidateTag } from 'next/cache';

export default async function revalidateOldMysql() {
  revalidateTag('old_mysql');
}
