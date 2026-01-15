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

  // Return null (or a skeleton) to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    // SEMANTIC: Flex container with gap for consistent spacing
    <div className="flex flex-wrap gap-2 items-center">
      {Object.keys(themes).map((themeName) => {
        const isActive = theme === themeName;
        
        return (
          <Button
            key={themeName}
            onClick={() => setTheme(themeName)}
            // SEMANTIC: 
            // Active = Primary Brand Color (bg-primary)
            // Inactive = Outline (border-input, bg-background)
            variant={isActive ? 'default' : 'outline'}
            // SEMANTIC: Enhancements
            // Active: Shadow for depth
            // Inactive: Muted text to reduce visual noise, highlighting on hover
            className={`capitalize transition-all duration-200 ${
              isActive 
                ? 'shadow-md font-bold' 
                : 'text-muted-foreground hover:text-foreground hover:border-primary/50'
            }`}
          >
            {themeName}
          </Button>
        );
      })}
    </div>
  );
}