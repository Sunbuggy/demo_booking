'use client';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function DailyPicsPage() {
  useEffect(() => {
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    redirect(`/daily-pics/${formattedDate}`);
  }, []);

  return null;
}