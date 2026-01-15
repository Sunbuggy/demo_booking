/**
 * @file app/actions/get-payroll-week.ts
 * @description Logic to calculate payroll week ranges and ISO week numbers.
 */
import { startOfWeek, endOfWeek, format, isValid, getISOWeek } from 'date-fns';

export const getPayrollWeek = (dateInput: string | Date | null | undefined) => {
  // 1. Default to Today if null
  if (!dateInput) dateInput = new Date();
  
  // 2. Normalize input to Date object
  const dateObj = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

  // 3. Validation
  if (!isValid(dateObj)) {
    return { 
      startDate: format(new Date(), 'yyyy-MM-dd'), 
      endDate: format(new Date(), 'yyyy-MM-dd'), 
      label: 'Invalid Date',
      weekNumber: 0
    };
  }

  // 4. Calculate Monday - Sunday
  const start = startOfWeek(dateObj, { weekStartsOn: 1 }); // Monday
  const end = endOfWeek(dateObj, { weekStartsOn: 1 });

  return {
    startDate: format(start, 'yyyy-MM-dd'),
    endDate: format(end, 'yyyy-MM-dd'),
    // NEW: ISO Week Number for the Title
    weekNumber: getISOWeek(start), 
    label: `Week ${getISOWeek(start)} • ${format(start, 'MMM d')}`
  };
};