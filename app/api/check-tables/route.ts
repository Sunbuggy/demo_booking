// import { createClient } from '@/utils/supabase/server';
// import { NextResponse } from 'next/server';

// // GET request handler
// export async function GET() {
//   // Disable this route in production


//   try {
//     // Initialize Supabase client during runtime
//     const supabase = createClient();

//     // Fetch tables to monitor from audit_table_queue
//     const { data: auditTableQueue, error: queueError } = await supabase
//       .from('audit_table_queue')
//       .select('table');

//     if (queueError) {
//       console.error('Error fetching audit_table_queue:', queueError);
//       return NextResponse.json({ error: 'Failed to fetch audit_table_queue' }, { status: 500 });
//     }

//     if (!auditTableQueue || auditTableQueue.length === 0) {
//       console.log('No tables in audit_table_queue');
//       return NextResponse.json({ message: 'No tables in audit_table_queue' });
//     }

//     // Set up realtime listeners for each table in audit_table_queue
//     auditTableQueue.forEach((queueItem) => {
//       const tableName = queueItem.table;

//       if (!tableName) return;

//       // Subscribe to changes in the table
//       const channel = supabase
//         .channel(`public:${tableName}`)
//         .on(
//           'postgres_changes',
//           {
//             event: '*', // Listen for INSERT, UPDATE, DELETE
//             schema: 'public',
//             table: tableName,
//           },
//           (payload) => {
//             console.log(`Change detected in table ${tableName}:`, payload);
//             handleTableChange(tableName, payload, supabase);
//           }
//         )
//         .subscribe();

//       console.log(`Listening for changes on table: ${tableName}`);
//     });

//     return NextResponse.json({ message: 'Realtime listeners initialized' });
//   } catch (error) {
//     console.error('Error initializing realtime listeners:', error);
//     return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
//   }
// }

// // Function to handle table changes
// function handleTableChange(tableName: string, payload: any, supabase: any) {
//   const action = payload.eventType; // 'INSERT', 'UPDATE', 'DELETE'
//   const userId = payload.new?.user_id || payload.old?.user_id; // Adjust based on your user identification logic
//   const rowData = JSON.stringify(payload.new || payload.old);

//   console.log(`Handling change for table ${tableName}:`, { action, userId, rowData });
//   logAudit(action, tableName, userId, rowData, supabase);
// }

// // Function to log changes to the audit_logs table
// async function logAudit(
//   action: string,
//   tableName: string,
//   userId: string | null,
//   rowData: string,
//   supabase: any
// ) {
//   const { data, error } = await supabase
//     .from('audit_logs')
//     .insert([
//       {
//         action,
//         table_name: tableName,
//         user_id: userId,
//         row: rowData,
//         created_at: new Date().toISOString(),
//       },
//     ])
//     .select(); // Use .select() to return the inserted data

//   if (error) {
//     console.error('Error logging audit:', error);
//   } else {
//     console.log(`Logged ${action} on table ${tableName}:`, data);
//   }
// }
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// console.log('Supabase Client:', supabase); // Log client for debugging