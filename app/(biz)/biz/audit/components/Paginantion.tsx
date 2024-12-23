import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        {/* Goes back a page in table */}
        <Button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        {/* Shows the current pasge of info for table */}
        <span>
          Page {currentPage} of {totalPages}
        </span>
        {/* Goes to show the next items in table from database */}
        <Button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>

      {/* Allows the user top increase the amount of items in table */}
      <Select
        value={pageSize.toString()}
        onValueChange={(value) => onPageSizeChange(Number(value))}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select page size" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="10">10 per page</SelectItem>
          <SelectItem value="25">25 per page</SelectItem>
          <SelectItem value="50">50 per page</SelectItem>
          <SelectItem value="100">100 per page</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default Pagination;
