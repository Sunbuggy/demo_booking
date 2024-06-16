'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';

export default function ThemeButton({ className }: { className?: string }) {
  const [mounted, setMounted] = React.useState(false);
  const { systemTheme, theme, setTheme } = useTheme();
  const currentTheme = theme === 'system' ? systemTheme : theme;

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Button
      aria-label="Toggle Dark Mode"
      variant={'ghost'}
      size={'sm'}
      onClick={() =>
        currentTheme === 'dark' ? setTheme('light') : setTheme('dark')
      }
      className={className}
    >
      {currentTheme === 'dark' ? (
        <Sun className="w-4 h-4 text-gray-400" />
      ) : (
        <Moon className="w-4 h-4 text-blue-500" />
      )}
    </Button>
  );
}
