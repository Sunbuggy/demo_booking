// 'use client'
// import React, { useEffect, useState } from 'react';
// import { createClient as createSupabaseClient } from '@supabase/supabase-js'; // Use @supabase/supabase-js for client-side
// import { UserType } from '@/app/(biz)/biz/users/types';

// // Environment variables for Supabase (make sure these are defined in .env)
// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// // Initialize client-side Supabase
// const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

// export default function QrHistory({ user }: { user: UserType }) {
//   const [qrHistory, setQrHistory] = useState<string[]>([]);

//   useEffect(() => {
//     const fetchQrHistory = async () => {
//       if (!user?.id) return;

//       const { data, error } = await supabase
//         .from('qr_history')
//         .select('link')
//         .eq('user', user.id);

//       if (error) {
//         console.error('Error fetching QR history:', error.message);
//         return;
//       }

//       if (data) {
//         // Filter out items with null links and map over the ones with valid links
//         setQrHistory(data.map((item: { link: string | null }) => item.link || ''));
//       }
//     };

//     if (user) {
//       fetchQrHistory();
//     }
//   }, [user]);

//   return (
//     <div className="qr-history">
//       <h1>Scanned QR Code History</h1>
//       {qrHistory.length > 0 ? (
//         <ul>
//           {qrHistory.map((result, index) => (
//             <li key={index}>
//               <a
//                 href={result.startsWith('http') ? result : `http://${result}`}
//                 rel="noopener noreferrer"
//                 target="_blank"
//               >
//                 {result}
//               </a>
//             </li>
//           ))}
//         </ul>
//       ) : (
//         <p>No QR codes scanned yet.</p>
//       )}
//     </div>
//   );
// }
import React from 'react'

function QrHistory() {
  return (
    <div>QrHistory</div>
  )
}

export default QrHistory