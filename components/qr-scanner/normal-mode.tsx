import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import Link from 'next/link';
import { DialogClose } from '../ui/dialog';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';

const NormalMode = ({
  scannedVehicleIds,
  scannedUrls
}: {
  scannedVehicleIds: {
    name: string;
    id: string;
    status: string;
    pet_name?: string;
  }[];
  scannedUrls: string[];
}) => {
  console.log('scanned Ids::::', scannedVehicleIds);
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = React.useState(true);
  const handleClick = (vehicleId: string) => {
    setIsDialogOpen(false); // Close the dialog
    router.push(`/biz/vehicles/${vehicleId}`); // Navigate to the new page
  };

  return (
    <Tabs defaultValue="new" className="w-[300px] mb-5">
      <TabsList className="w-full ">
        <TabsTrigger value="new">New</TabsTrigger>
        <TabsTrigger value="legacy">Legacy</TabsTrigger>
      </TabsList>
      <TabsContent value="new">
        <div className="w-[300px]">
          {scannedVehicleIds.length > 0 && (
            <ScrollArea className="h-[215px] ml-2  rounded-md border p-4">
              <h4 className="text-xl font mb-3">Scanned Vehicles:</h4>
              <div className="grid grid-cols-3">
                {scannedVehicleIds.map((v, i) => (
                  <span key={i}>
                    <DialogClose asChild>
                      <Button
                        className="large_button_circular relative"
                        onClick={() => handleClick(v.id)}
                      >
                        {v.pet_name ? (
                          <>
                            {v.pet_name}
                            <br />
                            {v.name}
                          </>
                        ) : (
                          v.name
                        )}{' '}
                        {v.status === 'broken' && (
                          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                        )}
                        {v.status === 'maintenance' && (
                          <span className="absolute top-0 right-0 w-2 h-2 bg-amber-500 rounded-full"></span>
                        )}
                        {v.status === 'fine' && (
                          <span className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full"></span>
                        )}
                      </Button>
                    </DialogClose>
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
