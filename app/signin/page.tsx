import { createClient } from '@/utils/supabase/server';
import SmartLoginForm from './login-form';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, LogOut } from 'lucide-react';
import { signOutAction } from '@/app/actions/auth-actions'; // <--- NEW IMPORT

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();

  // 1. Check Session
  const { data: { user } } = await supabase.auth.getUser();

  // 2. SAFETY VALVE: If logged in, DO NOT auto-redirect.
  // Render a "You are logged in" screen instead.
  // This physically breaks the infinite redirect loop.
  if (user) {
    return (
      // SEMANTIC: Main Page Layout (bg-background)
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background px-4 text-center">
        
        {/* SEMANTIC: Card Container (bg-card, border-border) */}
        <div className="max-w-md w-full space-y-6 p-8 bg-card rounded-xl border border-border shadow-2xl animate-in fade-in zoom-in-95">
          
          {/* SEMANTIC: Status Indicator (Primary tint) */}
          <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
             <div className="h-3 w-3 bg-primary rounded-full animate-pulse shadow-sm" />
          </div>
          
          {/* SEMANTIC: Typography (foreground/muted-foreground) */}
          <h2 className="text-2xl font-bold text-foreground">Welcome Back!</h2>
          <p className="text-muted-foreground text-sm">
            You are currently signed in as <span className="text-primary font-mono font-bold">{user.email}</span>
          </p>

          <div className="grid gap-3 pt-4">
            <Link href="/biz" className="w-full">
              {/* SEMANTIC: Primary Action Button */}
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg font-bold shadow-lg transition-all">
                Go to Dashboard <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            
            {/* SHARED SERVER ACTION: Ensures strict cookie clearing */}
            {/* We replaced the inline action with the imported one */}
            <form action={signOutAction} className="w-full">
               {/* SEMANTIC: Destructive/Ghost Action */}
               <Button 
                 variant="ghost" 
                 type="submit"
                 className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
               >
                 <LogOut className="mr-2 w-4 h-4" /> Sign Out & Switch Account
               </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // 3. Normal Sign In (If not logged in)
  const resolvedParams = await searchParams;
  const message = typeof resolvedParams.message === 'string' 
    ? resolvedParams.message 
    : undefined;

  return (
    // SEMANTIC: Sign In Page Background
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-foreground tracking-tight">
            SunBuggy Staff
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to access schedules and fleet controls
          </p>
        </div>
        <SmartLoginForm initialMessage={message} />
      </div>
    </div>
  );
}