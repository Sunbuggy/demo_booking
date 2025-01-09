// import React from 'react';
// 

// import { User } from '@supabase/supabase-js';


//   return (
//     <Tabs defaultValue="AuditLog" className="w-[375px] md:w-full">
//       <TabsList>
//         <TabsTrigger value="AuditLog">AuditLog</TabsTrigger>
//         <TabsTrigger value="TableQueue">TableQueue</TabsTrigger>
//       </TabsList>
//       <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex ">
//         <div className="flex items-center justify-between space-y-2">
//           <div>
//             <h2 className="text-2xl font-bold tracking-tight">
//               Welcome back {userFullName.split(' ')[0]}!{' '}
//             </h2>
//             <p className="text-muted-foreground">
//             </p>
//           </div>
//           <div className="flex items-center space-x-2">

//           </div>
//         </div>
//         <TabsContent value="AuditLog">
//           <EmployeeTab />
//         </TabsContent>
//         <TabsContent value="TableQueue">
//           <CustomerTab />
//         </TabsContent>
//       </div>
//     </Tabs>
//   );
// };

// export default UsersTabsContainer;
import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import QueueTab from './queue/QueueTab';
 import LogTab from './log/LogTab';

 function AuditTabs() {
  return (
    <div>
        <Tabs defaultValue="AuditLog" className="w-[375px] md:w-full">
      <TabsList>
        <TabsTrigger value="AuditLog">AuditLog</TabsTrigger>
        <TabsTrigger value="TableQueue">TableQueue</TabsTrigger>
      </TabsList>
      <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex ">
        <TabsContent value="AuditLog">
          <LogTab />
        </TabsContent>
        <TabsContent value="TableQueue">
          <QueueTab />
        </TabsContent>
      </div>
    </Tabs>
    </div>
  )
}

export default AuditTabs