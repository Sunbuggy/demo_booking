import { Card, CardContent, CardTitle } from '@/components/ui/card';
import React from 'react';

const TorchPanel = ({ full_name }: { full_name: string }) => {
  return (
    <Card>
      <CardTitle className="mt-3 text-center">Torch Panel</CardTitle>
      <CardContent>
        <p className="text-center text-lg m-2">
          Hello {full_name.split(' ')[0]}
        </p>
      </CardContent>
    </Card>
  );
};

export default TorchPanel;
