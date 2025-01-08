// import { NextApiRequest, NextApiResponse } from 'next';
// import { createClient } from '@supabase/supabase-js';

// // Initialize Supabase client
// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL || '',
//   process.env.SUPABASE_SERVICE_ROLE_KEY || '' // Ensure to use the service role key
// );

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== 'GET') {
//     res.setHeader('Allow', ['GET']);
//     return res.status(405).json({ error: 'Method not allowed' });
//   }

//   try {
//     // Fetch audit log entries
//     const { data, error } = await supabase
//       .from('audit_log')
//       .select('*')
//       .order('created_at', { ascending: false });

//     if (error) throw error;

//     res.status(200).json({ auditLogs: data });
//   } catch (error: any) {
//     res.status(500).json({ error: error.message });
//   }
// }
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'API is working!' });
}
