import { Metadata } from 'next';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { cn } from '@/lib/utils';

interface PublicLayoutProps {
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  footerClassName?: string;
  showHeader?: boolean;
  showFooter?: boolean;
}

export function PublicLayout({
  children,
  className,
  headerClassName,
  footerClassName,
  showHeader = true,
  showFooter = true,
}: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* 헤더 */}
      {showHeader && <PublicHeader className={headerClassName} />}

      {/* 메인 콘텐츠 */}
      <main className={cn('flex-1', className)}>
        {children}
      </main>

      {/* 푸터 */}
      {showFooter && <PublicFooter className={footerClassName} />}
    </div>
  );
}

// SEO 메타데이터 생성 유틸리티
export function generatePublicMetadata({
  title,
  description,
  keywords,
  canonical,
}: {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
}): Metadata {
  const defaultTitle = 'CulinarySeoul';
  const defaultDescription = 
    '서울의 미식 문화를 선도하는 종합 요리 관리 시스템. 전문적인 재고 관리와 운영 최적화로 여러분의 요리 사업을 지원합니다.';
  const defaultKeywords = [
    'CulinarySeoul',
    '요리 관리',
    '재고 관리',
    '서울 미식',
    'ERP',
    '요리 사업',
    '운영 최적화',
    '수요 예측',
  ];

  const finalTitle = title ? `${title} | ${defaultTitle}` : defaultTitle;
  const finalDescription = description || defaultDescription;
  const finalKeywords = keywords ? [...defaultKeywords, ...keywords] : defaultKeywords;

  return {
    title: finalTitle,
    description: finalDescription,
    keywords: finalKeywords.join(', '),
    authors: [{ name: 'CulinarySeoul Team' }],
    creator: 'CulinarySeoul',
    publisher: 'CulinarySeoul',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      title: finalTitle,
      description: finalDescription,
      url: canonical,
      siteName: 'CulinarySeoul',
      type: 'website',
      locale: 'ko_KR',
    },
    twitter: {
      card: 'summary_large_image',
      title: finalTitle,
      description: finalDescription,
      creator: '@CulinarySeoul',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical,
    },
  };
}