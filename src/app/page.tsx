import { Metadata } from 'next';
import { PublicLayout, generatePublicMetadata } from '@/components/layout/PublicLayout';
import { HeroSection } from '@/components/public/HeroSection';

// SEO 메타데이터 설정
export const metadata: Metadata = generatePublicMetadata({
  title: '통합 F&B 관리 솔루션',
  description: 'FIFO 재고관리, 브랜드 분리 지원, 실시간 대시보드를 통한 전문적인 요리 사업 관리 시스템. 서울의 미식 문화를 선도하는 CulinarySeoul ERP.',
  keywords: [
    '통합 F&B 관리',
    'FIFO 재고관리',
    '브랜드 분리',
    '실시간 대시보드',
    '요리 사업 관리',
    '음식점 ERP',
    '카페 관리 시스템',
    '레스토랑 솔루션'
  ],
  canonical: '/',
});

export default function HomePage() {
  return (
    <PublicLayout>
      <HeroSection />
    </PublicLayout>
  );
}
