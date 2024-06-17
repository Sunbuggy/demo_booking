import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function BookingTabs({ unblur }: { unblur: boolean }) {
  return (
    <div className={unblur ? 'blur-none' : 'blur-sm'}>
      <Tabs defaultValue="mb30" className="w-[400px]">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mb30">MB30</TabsTrigger>
          <TabsTrigger value="mb60">MB60</TabsTrigger>
          <TabsTrigger value="mb120">MB120</TabsTrigger>
        </TabsList>
        <TabsContent value="mb30">
          <Card>
            <CardHeader>
              <CardTitle>MiniBaja 30 minutes</CardTitle>
              <CardDescription>
                Chase in the dunes for 30 minutes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>MiniBaja 30 minutes content</p>
            </CardContent>
            <CardFooter className="w-full flex justify-end">
              <Button>Book</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="mb60">
          <Card>
            <CardHeader>
              <CardTitle>MB60</CardTitle>
              <CardDescription>60 mins</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">MB60 content</CardContent>
            <CardFooter className="w-full flex justify-end">
              <Button>Book</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="mb120">
          <Card>
            <CardHeader>
              <CardTitle>MB120</CardTitle>
              <CardDescription>120 mins</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">MB120 content</CardContent>
            <CardFooter className="w-full flex justify-end">
              <Button>Book</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
