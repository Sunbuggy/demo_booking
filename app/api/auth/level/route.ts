import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getUserDetails } from '@/utils/supabase/queries';

export async function GET() {
  const supabase = await await createClient();
  
  try {
    const userDetails = await getUserDetails(supabase);
    
    if (!userDetails || userDetails.length === 0) {
      return NextResponse.json({ level: 0 }, { status: 200 });
    }

    const userLevel = userDetails[0]?.user_level || 0;
    return NextResponse.json({ level: userLevel }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching user level:', error);
    return NextResponse.json({ level: 0 }, { status: 500 });
  }
}