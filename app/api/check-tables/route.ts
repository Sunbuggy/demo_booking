// import { NextResponse } from 'next/server';
// import { createClient } from '@/utils/supabase/server';

// // Initialize Supabase client
// const supabase = createClient();

// // POST method handler
// export async function POST(req: Request) {
//   try {
//     // Authenticate the logged-in user
//     const {
//       data: { user },
//       error: authError,
//     } = await supabase.auth.getUser();

//     if (authError || !user) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const userId = user.id;

//     // Parse the incoming event data
//     const body = await req.json();
//     const { tableName, action, row } = body;

//     if (!tableName || !action || !row) {
//       return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
//     }

//     // Validate that the table is either "qr_history" or "vehicle_tag"
//     const validTables = ['qr_history', 'vehicle_tag'];
//     if (!validTables.includes(tableName)) {
//       return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
//     }

//     // Insert an audit log entry
//     const auditLog = {
//       action,
//       table_name: tableName,
//       row: JSON.stringify(row),
//       user_id: userId,
//       created_at: new Date().toISOString(),
//     };

//     const { data, error } = await supabase
//       .from('audit_logs')
//       .insert(auditLog)
//       .select();

//     if (error) {
//       console.error('Error inserting audit log:', error);
//       return NextResponse.json({ error: 'Failed to insert audit log' }, { status: 500 });
//     }

//     return NextResponse.json({ message: 'Audit log added', auditLog: data }, { status: 200 });
//   } catch (err) {
//     console.error('Error in handler:', err);
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
//   }
// }
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

console.log('Supabase Client:', supabase); // Log client for debugging
