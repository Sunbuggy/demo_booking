import { redirect } from 'next/navigation';

export async function GET() {
  const currentDate = new Date()
    .toLocaleString('en-CA', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
    .split(',')[0]
    .replace(/-/g, '-');

  redirect(`/biz/${currentDate}`);
}
