'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ThemeWrapperProps {
  children: ReactNode;
  className?: string;
  theme?: 'default' | 'company' | 'brand' | 'store';
}

export function ThemeWrapper({ children, className, theme = 'default' }: ThemeWrapperProps) {
  return (
    <div
      className={cn('min-h-screen bg-background text-foreground antialiased', className)}
      data-theme={theme}
    >
      {children}
    </div>
  );
}
