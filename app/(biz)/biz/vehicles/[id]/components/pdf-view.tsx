import React, { useState } from 'react';
import { VehicleReg } from '../../admin/tables/components/row-action-reg';
import { Trash2Icon } from 'lucide-react';
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface RegistrationPDFProps {
  registrationPdf: VehicleReg[];
}

const RegistrationPDFList: React.FC<RegistrationPDFProps> = ({ registrationPdf }) => {
  const [pdfs, setPdfs] = useState<VehicleReg[]>(registrationPdf);

  const deletePdf = async (pdf: VehicleReg) => {
    try {
      // Make the DELETE API request
      const response = await fetch(`/api/s3/upload?bucket=sb-fleet&key=${pdf.key}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        // Remove the deleted PDF from the state
        setPdfs((prev) => prev.filter((item) => item.key !== pdf.key));
      } else {
        console.error('Failed to delete the file:', result.message);
      }
    } catch (error) {
      console.error('Error deleting the file:', error);
    }
  };

  if (!pdfs || pdfs.length === 0) {
    return <p>No registration documents available.</p>;
  }

  return (
    <div>
      <h3>Registration Documents</h3>
      <ul>
        {pdfs.map((doc, index) => (
          <li key={index} className="flex items-center justify-between">
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {doc.file_name || `Registration Document ${index + 1}`}
            </a>
            <Popover>
              <PopoverTrigger className="w-8 flex items-center text-red-500" asChild>
                <Trash2Icon className="cursor-pointer" />
              </PopoverTrigger>
              <PopoverContent>
                <div className="flex flex-col gap-4">
                  <p>Are you sure you want to delete this file?</p>
                  <div className="flex justify-between">
                    <PopoverClose asChild>
                      <Button onClick={() => deletePdf(doc)} variant={'destructive'}>
                        Yes
                      </Button>
                    </PopoverClose>
                    <PopoverClose asChild>
                      <Button>No</Button>
                    </PopoverClose>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RegistrationPDFList;
