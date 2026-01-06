/**
 * ACTION: Update User Profile
 * Path: app/actions/update-user-profile.ts
 * Description: specific server action to handle user profile updates with 
 * Role-Based Access Control (RBAC) and hierarchy protection.
 * * UPDATES:
 * - Added 'payrollCompany' support for overtime logic.
 * - Added 'empId' mapping.
 */

"use server";

import { createClient } from '@supabase/supabase-js';
import { createClient as createUserClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
// Import our Single Source of Truth to avoid magic numbers
import { USER_LEVELS } from '@/lib/constants/user-levels';

/**
 * IMPACT ANALYSIS: Hierarchical Sync
 * Added 'department' to handle Roster sorting groups.
 * Added 'hire_date' for seniority tracking.
 * Added 'payroll_company' for State-based OT rules.
 */
const ProfileSchema = z.object({
  userId: z.string().uuid(),
  // Allow partial updates if needed, but validate format if present
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  stageName: z.string().optional().nullable(),
  email: z.string().email("Invalid email address").optional(),
  userLevel: z.coerce.number().optional(),
  
  // Employee Details fields
  location: z.string().optional().nullable(),
  department: z.string().optional().nullable(), 
  position: z.string().optional().nullable(),   
  hireDate: z.string().optional().nullable(),
  workPhone: z.string().optional().nullable(),
  dialpadNumber: z.string().optional().nullable(),
  payrollId: z.string().optional().nullable(),      // Maps to emp_id
  payrollCompany: z.string().optional().nullable(), // Maps to payroll_company
});

/**
 * Admin Client: Bypasses RLS to allow managers to update 
 * employee metadata from the central roster portal.
 */
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function updateEmployeeProfile(prevState: any, formData: FormData) {
  // 1. Verify Authorization (Auth Layer)
  const userClient = await createUserClient();
  const { data: { user: actor } } = await userClient.auth.getUser();
  
  if (!actor) return { message: 'Unauthorized: Please log in.', success: false };

  const supabaseAdmin = getAdminClient();

  // 2. Validate & Map FormData
  // We handle both naming conventions (first_name vs fullName logic handled later if needed)
  // For the specific UserForm we just built, we might need to split fullName manually if strictly required,
  // but usually, it's safer to keep the existing specific fields if available.
  const validated = ProfileSchema.safeParse({
    // Accept either 'userId' or 'targetUserId' to be flexible with different forms
    userId: formData.get('userId') || formData.get('targetUserId'),
    
    firstName: formData.get('first_name') || formData.get('fullName')?.toString().split(' ')[0],
    lastName: formData.get('last_name') || formData.get('fullName')?.toString().split(' ').slice(1).join(' '),
    stageName: formData.get('stage_name'),
    email: formData.get('email'),
    userLevel: formData.get('user_level'),
    
    location: formData.get('location'),
    department: formData.get('department'),
    position: formData.get('position'),
    hireDate: formData.get('hire_date'),
    workPhone: formData.get('phone'),
    dialpadNumber: formData.get('dialpad_number'),
    
    // PAYROLL MAPPING
    payrollId: formData.get('payroll_id') || formData.get('empId'), 
    payrollCompany: formData.get('payroll_company') || formData.get('payrollCompany'),
  });

  if (!validated.success) {
    const errorMsg = validated.error.issues.map(i => `${i.path}: ${i.message}`).join(', ');
    return { message: `Validation failed: ${errorMsg}`, success: false };
  }

  const data = validated.data;
  
  // Construct Full Name if we have the parts, otherwise rely on existing
  let fullNameUpdate = {};
  if (data.firstName && data.lastName) {
      fullNameUpdate = {
          first_name: data.firstName,
          last_name: data.lastName,
          full_name: `${data.firstName} ${data.lastName}`.trim(),
          stage_name: data.stageName || data.firstName,
      };
  }

  try {
    // --- SECURITY CHECKPOINT START ------------------------------------------
    
    // A. Get the Actor's real level (The person clicking the button)
    const { data: actorProfile } = await supabaseAdmin
        .from('users')
        .select('user_level')
        .eq('id', actor.id)
        .single();
    
    const actorLevel = actorProfile?.user_level || 0;

    // B. Get the Target's current state (The person being updated)
    const { data: targetCurrent } = await supabaseAdmin
        .from('users')
        .select('user_level')
        .eq('id', data.userId)
        .single();

    if (!targetCurrent) throw new Error("Target user not found.");

    let finalUserLevel = data.userLevel || targetCurrent.user_level;

    // C. Enforce Privilege Rules
    const isSelfUpdate = actor.id === data.userId;
    const isSuperAdmin = actorLevel >= USER_LEVELS.ADMIN; // 900+

    // Rule 1: Self-Promotion Protection
    if (isSelfUpdate) {
        if (data.userLevel && finalUserLevel !== targetCurrent.user_level) {
            console.warn(`SECURITY: User ${actor.id} attempted self-promotion. Reverting level.`);
            finalUserLevel = targetCurrent.user_level;
        }
    }

    // Rule 2: Hierarchy Protection (For updating others)
    if (!isSelfUpdate && !isSuperAdmin) {
        if (finalUserLevel > actorLevel) {
             return { message: 'Security: You cannot promote a user above your own rank.', success: false };
        }
    }

    // --- SECURITY CHECKPOINT END --------------------------------------------

    // 3. Update IDENTITY (public.users)
    const userUpdates: any = {
        ...fullNameUpdate,
        phone: data.workPhone,
        email: data.email
    };
    // Only update level if it was provided and validated
    if (data.userLevel) userUpdates.user_level = finalUserLevel;

    const { error: userError } = await supabaseAdmin
      .from('users')
      .update(userUpdates)
      .eq('id', data.userId);

    if (userError) throw new Error(`Users table error: ${userError.message}`);

    // 4. Update OPERATIONS (public.employee_details)
    // Only apply operational details if the resulting user is Staff level or higher
    if (finalUserLevel >= USER_LEVELS.STAFF) {
      
      // Build update object dynamically to allow partial updates
      const detailsUpdate: any = {
          user_id: data.userId,
      };
      
      if (data.department) detailsUpdate.department = data.department;
      if (data.position) detailsUpdate.primary_position = data.position;
      if (data.location) detailsUpdate.primary_work_location = data.location;
      if (data.hireDate) detailsUpdate.hire_date = data.hireDate;
      if (data.dialpadNumber) detailsUpdate.dialpad_number = data.dialpadNumber;
      
      // NEW FIELDS
      if (data.payrollId) detailsUpdate.emp_id = data.payrollId;
      if (data.payrollCompany) detailsUpdate.payroll_company = data.payrollCompany;

      const { error: empError } = await supabaseAdmin
        .from('employee_details')
        .upsert(detailsUpdate, { onConflict: 'user_id' });

      if (empError) throw new Error(`Employee details error: ${empError.message}`);
    }

    // 5. Cache Invalidation
    revalidatePath('/biz/schedule');
    revalidatePath('/account');
    revalidatePath(`/biz/users/${data.userId}`);
    revalidatePath(`/biz/payroll`); // Ensure payroll page sees the new company settings
    
    return { message: 'Profile synced successfully', success: true };

  } catch (error: any) {
    console.error('Update Action Failure:', error.message);
    return { message: error.message, success: false };
  }
}