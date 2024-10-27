'use client';
import { FactoryForm, FieldConfig } from '@/components/factory-form';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { Database } from '@/types_db';
import { createClient } from '@/utils/supabase/client';
import { updateUser, upsertEmployeeDetails } from '@/utils/supabase/queries';
import React from 'react';
import { z } from 'zod';
type EmpDetails = Database['public']['Tables']['employee_details']['Row'][];
type User = Database['public']['Tables']['users']['Row'];

export const formSchema = z.object({
  email: z.string().nullable(),
  full_name: z.string().nullable(),
  id: z.string(),
  phone: z.string().nullable(),
  user_level: z.number().nullable(),
  emp_id: z.string().nullable(),
  payroll_company: z.string().nullable(),
  primary_position: z.string().nullable(),
  primary_work_location: z.string().nullable()
});

export const fields: FieldConfig[] = [
  {
    type: 'input',
    name: 'full_name',
    label: 'Full Name',
    placeholder: 'Full Name',
    description: 'The full name of the user.'
  },
  {
    type: 'input',
    name: 'email',
    label: 'Email',
    placeholder: 'Email',
    description: 'The email of the user.'
  },
  {
    type: 'input',
    name: 'phone',
    label: 'Phone',
    placeholder: 'Phone',
    description: 'The phone number of the user.'
  },
  {
    type: 'input',
    name: 'user_level',
    label: 'User Level',
    placeholder: 'User Level',
    description: 'The user level of the user.'
  },
  {
    type: 'input',
    name: 'emp_id',
    label: 'Emp ID',
    placeholder: 'Emp ID',
    description: 'The emp ID of the user.'
  },
  {
    type: 'select',
    name: 'payroll_company',
    label: 'Payroll Company',
    placeholder: 'Payroll Company',
    description: 'The payroll company of the user.',
    options: [
      { label: 'NV-ModernHR', value: 'NV-ModernHR' },
      { label: 'NV-BBSI', value: 'NV-BBSI' },
      { label: 'MI-BBSI', value: 'MI-BBSI' },
      { label: 'CA-ModernHR', value: 'CA-ModernHR' }
    ]
  },
  {
    type: 'select',
    name: 'primary_position',
    label: 'Primary Position',
    placeholder: 'Primary Position',
    description: 'The primary position of the user.',
    options: [
      { label: 'JR-DUNIE', value: 'JR-DUNIE' },
      { label: 'SR-DUNIE', value: 'SR-DUNIE' },
      { label: 'ShuttleDriver', value: 'ShuttleDriver' },
      { label: 'CSR', value: 'CSR' },
      { label: 'ADMIN', value: 'ADMIN' },
      { label: 'DEV', value: 'DEV' },
      { label: 'BUGGY-TECH', value: 'BUGGY-TECH' },
      { label: 'ATV-TECH', value: 'ATV-TECH' },
      { label: 'FLEET-TECH', value: 'FLEET-TECH' },
      { label: 'FABRICATOR', value: 'FABRICATOR' },
      { label: 'LABOR', value: 'LABOR' }
    ]
  },
  {
    type: 'select',
    name: 'primary_work_location',
    label: 'Primary Work Location',
    placeholder: 'Primary Work Location',
    description: 'The primary work location of the user.',
    options: [
      { label: 'NV', value: 'NV' },
      { label: 'MI', value: 'MI' },
      { label: 'CA', value: 'CA' },
      { label: 'FL', value: 'FL' }
    ]
  }
];

const UserForm = ({
  user,
  empDetails
}: {
  user: User;
  empDetails: EmpDetails;
}) => {
  const supabase = createClient();
  const [formData, setFormData] = React.useState<
    z.infer<typeof formSchema> | undefined
  >(undefined);
  const [initialData, setInitialData] = React.useState<
    Record<string, any> | undefined
  >(undefined);
  const { toast } = useToast();

  React.useEffect(() => {
    const usr = {
      ...user,
      ...empDetails[0]
    };
    console.log(usr);
    setInitialData(usr);
  }, []);
  React.useEffect(() => {
    if (formData) {
      const user_id = user.id;
      const full_name = formData.full_name;
      const email = formData.email;
      const phone = formData.phone;
      const user_level = formData.user_level;
      const emp_id = formData.emp_id;
      const payroll_company = formData.payroll_company;
      const primary_position = formData.primary_position;
      const primary_work_location = formData.primary_work_location;
      const userTableData = {
        full_name,
        email,
        phone,
        user_level
      };
      const empDetailsTableData = {
        emp_id,
        payroll_company,
        primary_position,
        primary_work_location,
        user_id
      };
      updateUser(supabase, userTableData, user_id).then(() => {
        toast({
          title: 'User updated',
          description: 'User updated successfully',
          variant: 'success',
          duration: 5000
        });
        upsertEmployeeDetails(supabase, empDetailsTableData).then(() => {
          toast({
            title: 'Employee Details updated',
            description: 'Employee Details updated successfully',
            variant: 'success',
            duration: 5000
          });
          window.location.reload();
        });
      });
    }
  }, [formData]);

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    setFormData(data);
  };
  if (user)
    return (
      <>
        {initialData ? (
          <FactoryForm
            fields={fields}
            formSchema={formSchema}
            onSubmit={onSubmit}
            data={initialData}
            hideFilterBoxField={true}
          />
        ) : (
          <Skeleton className="w-[400] h-[728]" />
        )}
      </>
    );
};

export default UserForm;
