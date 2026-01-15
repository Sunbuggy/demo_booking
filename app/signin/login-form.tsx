'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FaGoogle, FaEnvelope, FaLock, FaArrowLeft, FaMagic } from 'react-icons/fa';
import { toast } from 'sonner';

type ViewState = 'password' | 'magic_link' | 'forgot_password';

export default function SmartLoginForm({ initialMessage }: { initialMessage?: string }) {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<ViewState>('password');

  // 1. Google Login
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Dynamic Redirect: Sends them back to wherever they currently are
          // This fixes the "localhost vs production" loop issue
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { prompt: 'select_account' },
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message);
      setIsLoading(false);
    }
  };

  // 2. Email Logic
  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      // SCENARIO A: Password Login
      if (view === 'password') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Hard redirect to clear any lingering router cache
        window.location.href = '/biz'; 
      } 
      
      // SCENARIO B: "Email me a link" (Magic Link)
      else if (view === 'magic_link') {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            // Fix: Uses window.location.origin to support Localhost AND Production
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            shouldCreateUser: false, 
          },
        });
        if (error) throw error;
        toast.success(`Login link sent to ${email}! Check your inbox.`);
      }

      // SCENARIO C: Forgot Password
      else if (view === 'forgot_password') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
           // Redirects to callback -> logs in -> redirects to account settings
           redirectTo: `${window.location.origin}/auth/callback?next=/account`,
        });
        if (error) throw error;
        toast.success(`Password reset link sent to ${email}`);
      }
      
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Authentication failed');
      setIsLoading(false);
    } finally {
      // Keep loading true for redirects to prevent UI flicker
      if (view === 'password') return;
      setIsLoading(false);
    }
  };

  return (
    // SEMANTIC: Card Container (bg-card, border-border)
    <div className="bg-card text-card-foreground py-8 px-4 shadow-xl rounded-lg sm:px-10 border border-border animate-in fade-in zoom-in-95 duration-300">
      
      {/* HEADER */}
      <div className="mb-6 text-center">
        {view === 'password' && <h3 className="text-lg font-medium text-foreground">Sign in with Email</h3>}
        {view === 'magic_link' && <h3 className="text-lg font-medium text-foreground">Sign in without Password</h3>}
        {view === 'forgot_password' && <h3 className="text-lg font-medium text-foreground">Reset Password</h3>}
      </div>

      {/* GOOGLE BUTTON (Only in Password View) */}
      {view === 'password' && (
        <>
          <div className="mb-6">
            <Button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              variant="outline"
              // SEMANTIC: Button (bg-background, text-foreground, border-input)
              className="w-full flex justify-center items-center gap-3 py-6 text-base font-medium bg-background text-foreground hover:bg-muted border border-input shadow-sm transition-colors"
            >
              <FaGoogle className="text-red-500" />
              Sign in with Google
            </Button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground uppercase">Or use email</span>
            </div>
          </div>
        </>
      )}

      {/* FORM */}
      <form className="space-y-4" onSubmit={handleEmailSubmit}>
        
        {/* Email Input */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground">Email address</label>
          <div className="mt-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaEnvelope className="text-muted-foreground" />
            </div>
            {/* SEMANTIC: Input (bg-background, border-input, text-foreground) */}
            <Input 
              name="email" 
              type="email" 
              required 
              placeholder="you@sunbuggy.com"
              className="pl-10 bg-background border-input text-foreground focus:ring-2 focus:ring-ring focus:border-input"
            />
          </div>
        </div>

        {/* Password Input (Conditional) */}
        {view === 'password' && (
          <div>
            <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-muted-foreground">Password</label>
                <button 
                  type="button"
                  onClick={() => setView('forgot_password')}
                  // SEMANTIC: Link (text-primary)
                  className="text-xs text-primary hover:text-primary/80 hover:underline"
                >
                  Forgot password?
                </button>
            </div>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="text-muted-foreground" />
              </div>
              <Input 
                name="password" 
                type="password" 
                required 
                placeholder="••••••••"
                className="pl-10 bg-background border-input text-foreground focus:ring-2 focus:ring-ring focus:border-input"
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        {/* SEMANTIC: Primary Button (bg-primary, text-primary-foreground) */}
        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-5 border border-primary shadow-md transition-all"
        >
          {isLoading ? 'Processing...' : (
             view === 'password' ? 'Sign In' : 
             view === 'forgot_password' ? 'Send Reset Link' : 
             'Email me a Login Link'
          )}
        </Button>
      </form>

      {/* FOOTER SWITCHERS */}
      <div className="mt-6 flex flex-col gap-3 justify-center items-center">
        
        {view === 'password' && (
           <button
             type="button"
             onClick={() => setView('magic_link')}
             className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 group transition-colors"
           >
             No password? <span className="text-primary underline group-hover:text-primary/80">Email me a login link</span> <FaMagic className="text-xs text-primary" />
           </button>
        )}

        {(view === 'magic_link' || view === 'forgot_password') && (
           <button
             type="button"
             onClick={() => setView('password')}
             className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors"
           >
             <FaArrowLeft className="text-xs" /> Back to Password Login
           </button>
        )}
      </div>

      {initialMessage && (
        // SEMANTIC: Error/Destructive Message
        <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm text-center font-medium">
          {initialMessage}
        </div>
      )}
    </div>
  );
}