
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