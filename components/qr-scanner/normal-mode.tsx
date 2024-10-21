import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { DrawerClose } from '../ui/drawer';
import Link from 'next/link';

const NormalMode = ({
  scannedVehicleIds,
  scannedUrls
}: {
  scannedVehicleIds: {
    name: string;
    id: string;
    status: string;
  }[];
  scannedUrls: string[];
}) => {
  return (
    <Tabs defaultValue="new" className="w-[200px] mb-5">
      <TabsList className="w-full ">
        <TabsTrigger value="new">New</TabsTrigger>
        <TabsTrigger value="legacy">Legacy</TabsTrigger>
      </TabsList>
      <TabsContent value="new">
        <div className="w-[200px]">
          {scannedVehicleIds.length > 0 && (
            <ScrollArea className="h-[215px] ml-2  rounded-md border p-4">
              <h4 className="text-xl font mb-3">Scanned Vehicles:</h4>
              <div className="grid grid-cols-3">
                {scannedVehicleIds.map((v, i) => (
                  <span key={i}>
                    <DrawerClose asChild>
                      <div className="relative">
                        <Link
                          className="normal_button_small"
                          href={`/biz/vehicles/${v.id}`}
                        >
                          {v.name}
                        </Link>
                        {v.status === 'broken' && (
                          <span className="absolute top-0 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        )}
                        {v.status === 'maintenance' && (
                          <span className="absolute top-0 right-1 w-2 h-2 bg-amber-500 rounded-full"></span>
                        )}
                        {v.status === 'fine' && (
                          <span className="absolute top-0 right-1 w-2 h-2 bg-green-500 rounded-full"></span>
                        )}
                      </div>
                    </DrawerClose>
                  </span>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </TabsContent>
      <TabsContent value="legacy">
        <div className="w-[200px]">
          {scannedUrls.length > 0 && (
            <ScrollArea className="h-[200px] rounded-md border p-4">
              <h1 className="mb-2">On the old site:</h1>
              <ul className="flex flex-col gap-6">
                {scannedUrls.map((url, i) => (
                  <li key={i}>
                    <Link
                      className=" underline text-pink-500"
                      href={`https://${url}`}
                      target="_blank"
                    >
                      Open
                      {url.replace('sunbuggy.com/', '/')}
                    </Link>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default NormalMode;
