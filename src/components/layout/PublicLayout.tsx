'use client';

import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { ThemeWrapper } from '@/components/theme/theme-wrapper';
import { cn } from '@/lib/utils';

interface PublicLayoutProps {
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  footerClassName?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  theme?: 'default' | 'company' | 'brand' | 'store';
}

export function PublicLayout({
  children,
  className,
  headerClassName,
  footerClassName,
  showHeader = true,
  showFooter = true,
  theme = 'default',
}: PublicLayoutProps) {
  return (
    <ThemeWrapper theme={theme}>
      <div className="min-h-screen flex flex-col bg-background">
        {/* Background pattern */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />
        </div>

        {/* Header */}
        {showHeader && <PublicHeader className={cn('relative z-10', headerClassName)} />}

        {/* Main content */}
        <main className={cn('flex-1 relative z-0', className)}>{children}</main>

        {/* Footer */}
        {showFooter && <PublicFooter className={cn('relative z-10', footerClassName)} />}
      </div>
    </ThemeWrapper>
  );
}
