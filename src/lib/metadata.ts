import { Metadata } from 'next';

// SEO 메타데이터 생성 유틸리티 (Server-side only)
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

// Additional metadata generators for different page types
export function generateDashboardMetadata({
  dashboardType,
  title,
  description,
}: {
  dashboardType: 'company' | 'brand' | 'store';
  title?: string;
  description?: string;
}): Metadata {
  const dashboardTitles = {
    company: '회사 대시보드',
    brand: '브랜드 대시보드',
    store: '매장 대시보드',
  };

  const dashboardDescriptions = {
    company: 'CulinarySeoul 회사 전체 운영 현황을 한눈에 확인하고 관리하세요.',
    brand: '브랜드별 성과와 운영 지표를 실시간으로 모니터링하세요.',
    store: '매장 운영 상황과 재고 현황을 효율적으로 관리하세요.',
  };

  return generatePublicMetadata({
    title: title || dashboardTitles[dashboardType],
    description: description || dashboardDescriptions[dashboardType],
    keywords: [
      '대시보드',
      dashboardType === 'company'
        ? '회사 관리'
        : dashboardType === 'brand'
          ? '브랜드 관리'
          : '매장 관리',
    ],
  });
}

// Base metadata configuration
export const baseMetadata: Partial<Metadata> = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://culinaryseoul.com'),
  applicationName: 'CulinarySeoul ERP',
  referrer: 'origin-when-cross-origin',
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png' }],
  },
};
