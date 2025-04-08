'use client';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function DailyPicsPage() {
  useEffect(() => {
    // Redirect to today's date on initial load
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    redirect(`/daily-pics/${formattedDate}`);
  }, []);

  return null; // This will immediately redirect
}