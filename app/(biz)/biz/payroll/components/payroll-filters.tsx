'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

type SimpleUser = {
  id: string;
  full_name: string;
};

export default function PayrollFilters({ users }: { users: SimpleUser[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = React.useState(false);

  // Get current values from URL
  const currentUserId = searchParams.get('userId') || '';
  const currentDate = searchParams.get('date') || '';

  // Helper to update URL params
  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    
    router.push(`/biz/payroll?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('/biz/payroll');
  };

  // Find the currently selected user object for display label
  const selectedUser = users.find((u) => u.id === currentUserId);

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white dark:bg-slate-900 rounded-lg border shadow-sm items-end sm:items-center">
      
      {/* SEARCHABLE EMPLOYEE SELECTOR (Combobox) */}
      <div className="w-full sm:w-[300px] space-y-1">
        <label className="text-xs font-semibold text-muted-foreground uppercase">Filter by Employee</label>
        
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between font-normal"
            >
              {selectedUser ? selectedUser.full_name : "Select employee..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
            <Command>
              <CommandInput placeholder="Search employee name..." />
              <CommandList>
                <CommandEmpty>No employee found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="all"
                    onSelect={() => {
                      updateFilters('userId', '');
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        currentUserId === "" ? "opacity-100" : "opacity-0"
                      )}
                    />
                    ALL EMPLOYEES
                  </CommandItem>
                  
                  {users.map((user) => (
                    <CommandItem
                      key={user.id}
                      value={user.full_name} // Search by name
                      onSelect={() => {
                        updateFilters('userId', user.id); // Set ID in URL
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          currentUserId === user.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {user.full_name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Date Picker */}
      <div className="w-full sm:w-[200px] space-y-1">
        <label className="text-xs font-semibold text-muted-foreground uppercase">Filter by Date</label>
        <Input 
          type="date" 
          value={currentDate} 
          onChange={(e) => updateFilters('date', e.target.value)}
        />
      </div>

      {/* Clear Button */}
      {(currentUserId || currentDate) && (
        <Button variant="ghost" size="icon" onClick={clearFilters} title="Clear Filters" className="mb-0.5">
           <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}