'use client';

import { ReactNode } from 'react';
import { ThemeWrapper } from '@/components/theme/theme-wrapper';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: ReactNode;
  className?: string;
}

export function MainLayout({ children, className }: MainLayoutProps) {
  return (
    <ThemeWrapper theme="default">
      <div className={cn('relative', className)}>
        {/* Background pattern */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />
        </div>

        {/* Content */}
        <main className="relative z-0">{children}</main>
      </div>
    </ThemeWrapper>
  );
}
