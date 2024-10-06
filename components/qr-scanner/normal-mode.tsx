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
              <div className="flex flex-col gap-2 items-center">
                <h4 className="text-xl font mb-3">Scanned Vehicles:</h4>
                {scannedVehicleIds.map((v, i) => (
                  <span key={i}>
                    <DrawerClose asChild>
                      <Link
                        className="green_button"
                        href={`/biz/vehicles/${v.id}`}
                      >
                        {v.name}
                      </Link>
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
