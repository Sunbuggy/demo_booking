import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * MANAGING THE SUPABASE SESSION
 * -----------------------------
 * This middleware acts as the "Gatekeeper" for the application.
 * It runs on every single request (as defined in middleware.ts matcher) to:
 * 1. Refresh Auth Tokens: Ensuring the user stays logged in as they navigate.
 * 2. Protect Routes: Kicking unauthenticated users out of the /biz area.
 * 3. Redirect Logic: Sending logged-in users to the dashboard if they hit /signin.
 */
export async function updateSession(request: NextRequest) {
  
  // 1. Initialize the Response
  // We create an initial response object that we will attach cookies to later.
  let supabaseResponse = NextResponse.next({
    request,
  })

  // 2. Initialize the Supabase Client
  // This client is configured to interact with the request/response cookies directly.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Method to READ cookies from the incoming request
        getAll() {
          return request.cookies.getAll()
        },
        // Method to WRITE cookies to the outgoing response
        // FIX: Explicitly typed 'cookiesToSet' as 'any[]' to satisfy TypeScript strict mode
        setAll(cookiesToSet: any[]) {
          // A. Update the request cookies (so Server Components can read them immediately)
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          
          // B. Re-create the response object to ensure it carries the new cookies
          supabaseResponse = NextResponse.next({
            request,
          })
          
          // C. Set the cookies on the final response object
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // --------------------------------------------------------------------------
  // IMPORTANT WARNING:
  // Avoid writing any complex logic between createServerClient and getUser().
  // If you throw an error here, the auth token might not get refreshed,
  // causing users to be randomly logged out.
  // --------------------------------------------------------------------------

  // 3. Verify the User (The "Check ID" Step)
  // This call securely checks the JWT token in the cookies.
  const {
    data: { user },
  } = await supabase.auth.getUser()


  // --------------------------------------------------------------------------
  // SECURITY & ROUTING LOGIC
  // --------------------------------------------------------------------------
  
  const path = request.nextUrl.pathname;

  // RULE 1: PROTECT THE BUSINESS CORE (/biz)
  // Scenario: A random person (or Google bot) tries to visit the schedule page.
  // Action: If they have no user object (not logged in), kick them to /signin.
  if (!user && path.startsWith('/biz')) {
    
    // Clone the URL so we can modify it safely
    const url = request.nextUrl.clone()
    url.pathname = '/signin' 
    
    // User Experience Improvement: 
    // We attach the page they WANTED to visit as a 'next' parameter.
    // Example: /signin?next=/biz/schedule
    // The login form can use this to redirect them back after they sign in.
    url.searchParams.set('next', path) 
    
    return NextResponse.redirect(url)
  }

 

  // --------------------------------------------------------------------------
  // FINAL RETURN
  // You *must* return the supabaseResponse object created in step 2/3.
  // If you create a new NextResponse here without copying the cookies,
  // the user's fresh auth token will be lost, logging them out immediately.
  // --------------------------------------------------------------------------
  
  return supabaseResponse
}