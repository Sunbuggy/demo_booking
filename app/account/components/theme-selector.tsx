'use client';

import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { themes } from './themes';

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex space-x-2">
      {Object.keys(themes).map((themeName) => (
        <Button
          key={themeName}
          onClick={() => setTheme(themeName)}
          variant={theme === themeName ? 'default' : 'outline'}
        >
          {themeName}
        </Button>
      ))}
    </div>
  );
}
