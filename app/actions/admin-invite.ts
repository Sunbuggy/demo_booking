'use server';

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// --- VALIDATION SCHEMA ---
const InviteUserSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  fullName: z.string().min(2, { message: "Name must be at least 2 characters" }),
  phone: z.string().optional(),
  employeeId: z.string().optional(),
  position: z.string().optional(),
  location: z.enum(['Las Vegas', 'Pismo', 'Michigan']).optional(),
  userLevel: z.coerce.number().default(300),
});

export type InviteFormState = {
  message: string;
  success?: boolean;
  errors?: {
    [K in keyof z.infer<typeof InviteUserSchema>]?: string[];
  };
};

// --- HELPER: FORMAT PHONE NUMBER ---
function formatPhoneNumber(phone: string): string | null {
  if (!phone) return null;
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // If it's 10 digits (e.g., 7025551234), add +1
  if (cleaned.length === 10) return `+1${cleaned}`;
  // If it's 11 digits and starts with 1, add +
  if (cleaned.length === 11 && cleaned.startsWith('1')) return `+${cleaned}`;
  
  // Return as-is if it doesn't match standard US formats (fallback)
  return `+${cleaned}`; 
}

// --- MAIN SERVER ACTION ---
export async function inviteUser(
  prevState: InviteFormState, 
  formData: FormData
): Promise<InviteFormState> {
  
  // 1. Validate Form Data
  const validatedFields = InviteUserSchema.safeParse({
    email: formData.get('email'),
    fullName: formData.get('fullName'),
    phone: formData.get('phone'),
    employeeId: formData.get('employeeId'),
    position: formData.get('position'),
    location: formData.get('location'),
    userLevel: formData.get('userLevel'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Please fix the errors below.',
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }

  const { email, fullName, phone, employeeId, position, location, userLevel } = validatedFields.data;

  // 2. Initialize Supabase Admin Client
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  try {
    // 3. Send Supabase Invite Email
    const { data: authData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: { full_name: fullName },
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/account/update-password`,
      }
    );

    if (inviteError) {
      console.error('Supabase Invite Error:', inviteError);
      return { message: `Invite failed: ${inviteError.message}`, success: false };
    }

    const newUserId = authData.user.id;

    // 4. Update 'users' Table
    const formattedPhone = phone ? formatPhoneNumber(phone) : null;

    const { error: userError } = await supabaseAdmin
      .from('users')
      .update({
        user_level: userLevel,
        user_type: 'employee',
        phone: formattedPhone, // Save formatted number to DB
        external_metadata: {
             onboarding_status: 'invited',
             invited_at: new Date().toISOString(),
             invited_by: 'admin_action'
        }
      })
      .eq('id', newUserId);

    if (userError) {
       console.warn('User update failed, attempting upsert:', userError);
       // Basic fallback upsert
       await supabaseAdmin.from('users').upsert({
         id: newUserId,
         email: email,
         full_name: fullName,
         user_level: userLevel,
         user_type: 'employee',
         phone: formattedPhone,
       });
    }

    // 5. Create 'employee_details' Record
    const { error: detailsError } = await supabaseAdmin
      .from('employee_details')
      .insert({
        user_id: newUserId,
        emp_id: employeeId || null,
        primary_position: position || null,
        primary_work_location: location || null,
        time_correction_count: 0
      });

    if (detailsError) {
      console.error('Employee Details Error:', detailsError);
    }

    // 6. Send SMS Notification (via Dialpad)
    if (formattedPhone && process.env.DIALPAD_API_KEY) {
      console.log(`Attempting SMS to ${formattedPhone}...`);
      
      try {
        const smsResponse = await fetch(
          `https://dialpad.com/api/v2/sms?apikey=${process.env.DIALPAD_API_KEY}`,
          {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              infer_country_code: false, // We formatted it manually above
              user_id: 6293603667378176, // Hardcoded ID
              text: `Hi ${fullName}, welcome to the SunBuggy Team! Please check your email (${email}) for your invite link.`,
              to_numbers: [formattedPhone],
            }),
          }
        );

        if (!smsResponse.ok) {
          const errorText = await smsResponse.text();
          console.error('Dialpad SMS Failed:', errorText);
        } else {
          const result = await smsResponse.json();
          console.log(`Invite SMS sent successfully! ID: ${result.id || 'ok'}`);
        }
      } catch (smsErr) {
        console.error('SMS Fetch Error:', smsErr);
      }
    } else if (formattedPhone && !process.env.DIALPAD_API_KEY) {
        console.warn("Skipping SMS: DIALPAD_API_KEY is missing from .env.local");
    }

    return { 
      message: `Successfully invited ${fullName}. Email sent.`, 
      success: true 
    };

  } catch (err) {
    console.error('Unexpected Admin Invite Error:', err);
    return { 
      message: 'An unexpected system error occurred. Please try again.', 
      success: false 
    };
  }
}