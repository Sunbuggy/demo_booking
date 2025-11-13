import React, { useState } from 'react';
import { VehiclePdf } from '../../admin/tables/components/row-action-pdf';
import { Trash2Icon } from 'lucide-react';
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PDFListProps {
  pdfList: VehiclePdf[]; // Generic prop for PDF list
  type: 'registration' | 'title' | 'insurance'; // Added 'insurance' type
}
const PDFList: React.FC<PDFListProps> = ({ pdfList = [], type }) => {
  const [pdfs, setPdfs] = useState<VehiclePdf[]>(pdfList);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const deletePdf = async (pdf: VehiclePdf) => {
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

  const filteredPdfs = pdfs.filter((doc) =>
    (doc.file_name || doc.key.split('/').pop() || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!pdfs || pdfs.length === 0) {
    return <p>No {type} documents available.</p>;
  }

  return (
    <div>
      {/* Search input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder={`Search ${type} documents...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-2 border border-gray-300 rounded w-full"
        />
      </div>

      <ul>
        {filteredPdfs.length > 0 ? (
          filteredPdfs.map((doc, index) => (
            <ScrollArea key={index}>
              <li className="flex items-center justify-between py-2">
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {doc.file_name || doc.key.split('/').pop() || `${type} Document ${index + 1}`}
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
              <hr className="border-t border-gray-300 my-2" />
            </ScrollArea>
          ))
        ) : (
          <p>No documents match your search.</p>
        )}
      </ul>
    </div>
  );
};

export default PDFList;