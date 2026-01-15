'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache'; // <--- Required to update UI state after login
import { getURL, getErrorRedirect, getStatusRedirect } from 'utils/helpers';
import { getAuthTypes } from 'utils/auth-helpers/settings';
import { updatePhoneNumber, updateUserName } from '../supabase/queries';
import { updateUserLevel } from '../supabase/queries';
import { getPostLoginRedirect } from '@/lib/utils/auth-routing'; // <--- Smart Routing Utility

/**
 * Validates email format.
 */
function isValidEmail(email: string) {
  var regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return regex.test(email);
}

/**
 * Simple wrapper to handle server-side redirects.
 */
export async function redirectToPath(path: string) {
  return redirect(path);
}

/**
 * Handles User Sign Out.
 */
export async function SignOut(formData: FormData) {
  const pathName = String(formData.get('pathName')).trim();

  const supabase = await createClient(); // Fixed double await
  const { error } = await supabase.auth.signOut();

  if (error) {
    return getErrorRedirect(
      pathName,
      'Hmm... Something went wrong.',
      'You could not be signed out.'
    );
  }

  return '/signin';
}

/**
 * Handles Magic Link Sign In (Email OTP).
 */
export async function signInWithEmail(formData: FormData) {
  const cookieStore = cookies();
  const callbackURL = getURL('/auth/callback');

  const email = String(formData.get('email')).trim();
  let redirectPath: string;

  if (!isValidEmail(email)) {
    redirectPath = getErrorRedirect(
      '/signin/email_signin',
      'Invalid email address.',
      'Please try again.'
    );
  }

  const supabase = await createClient(); // Fixed double await
  let options = {
    emailRedirectTo: callbackURL,
    shouldCreateUser: true
  };

  const { allowPassword } = getAuthTypes();
  if (allowPassword) options.shouldCreateUser = false;
  
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: options
  });

  if (error) {
    redirectPath = getErrorRedirect(
      '/signin/email_signin',
      'You could not be signed in.',
      error.message
    );
  } else if (data) {
    (await cookieStore).set('preferredSignInView', 'email_signin', { path: '/' });
    redirectPath = getStatusRedirect(
      '/signin/email_signin',
      'Success!',
      'Please check your email for a magic link. You may now close this tab.',
      true
    );
  } else {
    redirectPath = getErrorRedirect(
      '/signin/email_signin',
      'Hmm... Something went wrong.',
      'You could not be signed in.'
    );
  }

  return redirectPath;
}

/**
 * Handles Password Reset Request.
 */
export async function requestPasswordUpdate(formData: FormData) {
  const callbackURL = getURL('/auth/reset_password');
  const email = String(formData.get('email')).trim();
  let redirectPath: string;

  if (!isValidEmail(email)) {
    redirectPath = getErrorRedirect(
      '/signin/forgot_password',
      'Invalid email address.',
      'Please try again.'
    );
  }

  const supabase = await createClient(); // Fixed double await

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: callbackURL
  });

  if (error) {
    redirectPath = getErrorRedirect(
      '/signin/forgot_password',
      error.message,
      'Please try again.'
    );
  } else if (data) {
    redirectPath = getStatusRedirect(
      '/signin/forgot_password',
      'Success!',
      'Please check your email for a password reset link. You may now close this tab.',
      true
    );
  } else {
    redirectPath = getErrorRedirect(
      '/signin/forgot_password',
      'Hmm... Something went wrong.',
      'Password reset email could not be sent.'
    );
  }

  return redirectPath;
}

/**
 * Handles Standard Password Sign In.
 * [UPDATED]: Includes "Tracer Bullets" logging and Smart Routing.
 */
export async function signInWithPassword(formData: FormData) {
  const cookieStore = cookies();
  const email = String(formData.get('email')).trim();
  const password = String(formData.get('password')).trim();
  let redirectPath: string;

  const supabase = await createClient(); // Fixed double await
  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    redirectPath = getErrorRedirect(
      '/signin/password_signin',
      'Sign in failed.',
      error.message
    );
  } else if (data.user) {
    (await cookieStore).set('preferredSignInView', 'password_signin', { path: '/' });
    
    // --- 🔫 TRACER BULLETS (DEBUG LOGS) START ---
    console.log("✅ [Auth] User Authenticated via Password. ID:", data.user.id);

    // 1. Fetch Profile Details
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select(`
        user_level,
        homepage,
        employee_details ( primary_work_location )
      `)
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error("❌ [Auth] Profile Fetch Error:", profileError.message);
    } else {
      console.log("📊 [Auth] Profile Loaded. Level:", profile?.user_level, "| Homepage Pref:", profile?.homepage);
    }

    // 2. Determine Destination using Smart Logic
    let nextPath = '/'; // Default fallback
    
    if (profile) {
      // Handle Supabase join quirk (array vs object)
      const empData = Array.isArray(profile.employee_details) 
        ? profile.employee_details[0] 
        : profile.employee_details;

      nextPath = getPostLoginRedirect({
        user_level: profile.user_level ?? 0,
        primary_work_location: empData?.primary_work_location,
        homepage: profile.homepage
      });
    }

    console.log("🚀 [Auth] Redirecting User To:", nextPath);
    // --- 🔫 TRACER BULLETS END ---

    // 3. Revalidate Root to ensure UI updates (e.g. Nav bar changes)
    revalidatePath('/', 'layout');

    // 4. Construct the Final Redirect
    redirectPath = getStatusRedirect(nextPath, 'Success!', 'You are now signed in.');

  } else {
    redirectPath = getErrorRedirect(
      '/signin/password_signin',
      'Hmm... Something went wrong.',
      'You could not be signed in.'
    );
  }

  return redirectPath;
}

/**
 * Handles New User Sign Up.
 */
export async function signUp(formData: FormData) {
  const callbackURL = getURL('/auth/callback');

  const name = String(formData.get('name')).trim();
  const email = String(formData.get('email')).trim();
  const password = String(formData.get('password')).trim();
  let redirectPath: string;

  if (!name || name.length < 2) {
    redirectPath = getErrorRedirect(
      '/signin/signup',
      'No name provided.',
      'Please try again.'
    );
  }
  if (!isValidEmail(email)) {
    redirectPath = getErrorRedirect(
      '/signin/signup',
      'Invalid email address.',
      'Please try again.'
    );
  }

  const supabase = await createClient(); // Fixed double await
  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: callbackURL,
      data: {
        full_name: name
      }
    }
  });

  if (error) {
    redirectPath = getErrorRedirect(
      '/signin/signup',
      'Sign up failed.',
      error.message
    );
  } else if (data.session) {
    // New users go to Root to book tours
    redirectPath = getStatusRedirect('/', 'Success!', 'You are now signed in.');
  } else if (
    data.user &&
    data.user.identities &&
    data.user.identities.length == 0
  ) {
    redirectPath = getErrorRedirect(
      '/signin/signup',
      'Sign up failed.',
      'There is already an account associated with this email address. Try resetting your password.'
    );
  } else if (data.user) {
    redirectPath = getStatusRedirect(
      '/',
      'Success!',
      'Please check your email for a confirmation link. You may now close this tab.'
    );
  } else {
    redirectPath = getErrorRedirect(
      '/signin/signup',
      'Hmm... Something went wrong.',
      'You could not be signed up.'
    );
  }

  return redirectPath;
}

/**
 * Handles Password Update.
 */
export async function updatePassword(formData: FormData) {
  const password = String(formData.get('password')).trim();
  const passwordConfirm = String(formData.get('passwordConfirm')).trim();
  let redirectPath: string;

  if (password !== passwordConfirm) {
    redirectPath = getErrorRedirect(
      '/signin/update_password',
      'Your password could not be updated.',
      'Passwords do not match.'
    );
  }

  const supabase = await createClient(); // Fixed double await
  const { error, data } = await supabase.auth.updateUser({
    password
  });

  if (error) {
    redirectPath = getErrorRedirect(
      '/signin/update_password',
      'Your password could not be updated.',
      error.message
    );
  } else if (data.user) {
    redirectPath = getStatusRedirect(
      '/',
      'Success!',
      'Your password has been updated.'
    );
  } else {
    redirectPath = getErrorRedirect(
      '/signin/update_password',
      'Hmm... Something went wrong.',
      'Your password could not be updated.'
    );
  }

  return redirectPath;
}

/**
 * Handles Email Update.
 */
export async function updateEmail(formData: FormData) {
  const newEmail = String(formData.get('newEmail')).trim();

  if (!isValidEmail(newEmail)) {
    return getErrorRedirect(
      '/account',
      'Your email could not be updated.',
      'Invalid email address.'
    );
  }

  const supabase = await createClient(); // Fixed double await

  const callbackUrl = getURL(
    getStatusRedirect('/account', 'Success!', `Your email has been updated.`)
  );

  const { error } = await supabase.auth.updateUser(
    { email: newEmail },
    {
      emailRedirectTo: callbackUrl
    }
  );

  if (error) {
    return getErrorRedirect(
      '/account',
      'Your email could not be updated.',
      error.message
    );
  } else {
    return getStatusRedirect(
      '/account',
      'Confirmation emails sent.',
      `You will need to confirm the update by clicking the links sent to both the old and new email addresses.`
    );
  }
}

/**
 * Handles Name Update.
 */
export async function updateName(formData: FormData) {
  const fullName = String(formData.get('fullName')).trim();

  const supabase = await createClient(); // Fixed double await
  const { error } = await updateUserName(supabase, fullName);
  if (error) {
    return getErrorRedirect(
      '/account',
      'Your name could not be updated.',
      error.message
    );
  } else {
    return getStatusRedirect(
      '/account',
      'Success!',
      'Your name has been updated.'
    );
  }
}

/**
 * Handles Phone Update.
 */
export async function updatePhone(formData: FormData) {
  const phone = String(formData.get('phone')).trim();
  const supabase = await createClient(); // Fixed double await
  const { error } = await updatePhoneNumber(supabase, phone);
  if (error) {
    return getErrorRedirect(
      '/account',
      'Your phone number could not be updated.',
      error.message
    );
  } else {
    return getStatusRedirect(
      '/account',
      'Success!',
      'Your phone number has been updated.'
    );
  }
}

/**
 * Handles Role Update.
 */
export async function updateRole(formData: FormData) {
  const role = Number(formData.get('current_role'));

  const supabase = await createClient(); // Fixed double await
  const { error } = await updateUserLevel(supabase, role);
  if (error) {
    return getErrorRedirect(
      '/account',
      'Your role could not be updated.',
      error.message
    );
  } else {
    return getStatusRedirect(
      '/account',
      'Success!',
      'Your role has been updated.'
    );
  }
}