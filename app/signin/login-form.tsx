'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FaGoogle, FaEnvelope, FaLock, FaMagic } from 'react-icons/fa';
import { toast } from 'sonner';

export default function SmartLoginForm({ initialMessage }: { initialMessage?: string }) {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'password' | 'magic_link'>('password'); // Default view

  // Handle Google Login (The "Easy Button")
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            // Forces the account chooser so they don't get stuck in a loop
            // if they have multiple Google accounts (Personal vs Work).
            prompt: 'select_account', 
          },
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error('Google Sign-In Failed: ' + error.message);
      setIsLoading(false);
    }
  };

  // Handle Email Login
  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      if (view === 'password') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // Success handled by middleware redirect
        window.location.href = '/biz'; 
      } else {
        // Magic Link
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        toast.success('Check your email for the magic link!');
      }
    } catch (error: any) {
      toast.error(error.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 py-8 px-4 shadow rounded-lg sm:px-10 border border-slate-800">
      
      {/* 1. GOOGLE BUTTON (Primary Action) */}
      <div className="mb-6">
        <Button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          variant="outline"
          className="w-full flex justify-center items-center gap-3 py-6 text-base font-medium bg-white text-slate-900 hover:bg-slate-100 border-0"
        >
          <FaGoogle className="text-red-500" />
          Sign in with Google
        </Button>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-slate-900 text-slate-500 uppercase">Or continue with</span>
        </div>
      </div>

      {/* 2. EMAIL FORM */}
      <form className="space-y-4" onSubmit={handleEmailLogin}>
        <div>
          <label className="block text-sm font-medium text-slate-300">Email address</label>
          <div className="mt-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaEnvelope className="text-slate-500" />
            </div>
            <Input 
              name="email" 
              type="email" 
              required 
              placeholder="you@sunbuggy.com"
              className="pl-10 bg-slate-950 border-slate-700"
            />
          </div>
        </div>

        {view === 'password' && (
          <div>
            <label className="block text-sm font-medium text-slate-300">Password</label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="text-slate-500" />
              </div>
              <Input 
                name="password" 
                type="password" 
                required 
                placeholder="••••••••"
                className="pl-10 bg-slate-950 border-slate-700"
              />
            </div>
          </div>
        )}

        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-slate-800 hover:bg-slate-700 text-white"
        >
          {isLoading ? 'Signing in...' : view === 'password' ? 'Sign In' : 'Send Magic Link'}
        </Button>
      </form>

      {/* 3. TOGGLE VIEW (Preference Switcher) */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={() => setView(view === 'password' ? 'magic_link' : 'password')}
          className="text-sm text-yellow-500 hover:text-yellow-400 font-medium flex items-center gap-2"
        >
          {view === 'password' ? (
            <>Use Magic Link instead <FaMagic /></>
          ) : (
             <>Use Password instead <FaLock /></>
          )}
        </button>
      </div>

      {initialMessage && (
        <div className="mt-4 p-3 bg-red-900/20 border border-red-900/50 rounded text-red-200 text-sm text-center">
          {initialMessage}
        </div>
      )}
    </div>
  );
}