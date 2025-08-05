'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

/**
 * Theme switcher component that prevents hydration errors
 *
 * Uses the official next-themes mounted state pattern to prevent
 * className mismatches between server and client rendering.
 */
export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Prevent hydration mismatch by only rendering theme-dependent UI after mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Show skeleton while mounting to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled>
          Light
        </Button>
        <Button variant="outline" size="sm" disabled>
          Dark
        </Button>
        <Button variant="outline" size="sm" disabled>
          System
        </Button>
      </div>
    );
  }

  // Only render theme-dependent variants after mounting
  return (
    <div className="flex items-center gap-2">
      <Button
        variant={theme === 'light' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setTheme('light')}
      >
        Light
      </Button>
      <Button
        variant={theme === 'dark' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setTheme('dark')}
      >
        Dark
      </Button>
      <Button
        variant={theme === 'system' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setTheme('system')}
      >
        System
      </Button>
    </div>
  );
}
