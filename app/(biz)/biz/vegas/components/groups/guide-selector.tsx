'use client';

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface Guide {
  id: string;
  full_name: string;
  // Add other props if needed like role or avatar
}

interface GuideSelectorProps {
  label: string;
  value: string; // Currently storing name as string based on your DB
  guides: Guide[];
  onChange: (value: string) => void;
}

export const GuideSelector: React.FC<GuideSelectorProps> = ({
  label,
  value,
  guides,
  onChange,
}) => {
  return (
    <div className="flex items-center gap-1 w-full max-w-[200px]">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-xs bg-slate-950 border-slate-700">
          <SelectValue placeholder={`Select ${label}`} />
        </SelectTrigger>
        <SelectContent>
          {guides.length > 0 ? (
            guides.map((guide) => (
              <SelectItem key={guide.id} value={guide.full_name}>
                {guide.full_name}
              </SelectItem>
            ))
          ) : (
            <div className="p-2 text-xs text-muted-foreground">
              No guides scheduled
            </div>
          )}
        </SelectContent>
      </Select>
      
      {/* Clear Button */}
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:text-red-500"
          onClick={() => onChange('')}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};