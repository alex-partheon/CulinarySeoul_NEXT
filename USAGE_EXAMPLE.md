# 공개 페이지 레이아웃 컴포넌트 사용 예시

## 기본 사용법

### 1. PublicLayout 사용하기

```tsx
// app/page.tsx - 메인 홈페이지
import { PublicLayout, generatePublicMetadata } from '@/components/layout';

export const metadata = generatePublicMetadata({
  title: '홈',
  description: 'CulinarySeoul ERP 시스템으로 서울의 미식 문화를 함께 만들어가세요.',
  keywords: ['홈페이지', '요리 관리', '미식 문화'],
});

export default function HomePage() {
  return (
    <PublicLayout>
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
              서울의 미식 문화를 선도하는
              <span className="text-emerald-600 block">CulinarySeoul</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              전문적인 재고 관리와 운영 최적화로 여러분의 요리 사업을 지원합니다.
            </p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
```

### 2. 소개 페이지 예시

```tsx
// app/about/page.tsx
import { PublicLayout, generatePublicMetadata } from '@/components/layout';

export const metadata = generatePublicMetadata({
  title: '소개',
  description: 'CulinarySeoul의 비전과 서비스에 대해 알아보세요.',
  canonical: 'https://culinaryseoul.com/about',
});

export default function AboutPage() {
  return (
    <PublicLayout>
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">CulinarySeoul 소개</h1>
            <p className="mt-4 text-lg text-gray-600">서울의 미식 문화를 혁신하는 ERP 시스템</p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* 서비스 카드들 */}
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900">재고 관리</h3>
              <p className="mt-2 text-gray-600">
                실시간 재고 추적과 FIFO 방식의 효율적인 재고 관리
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900">수요 예측</h3>
              <p className="mt-2 text-gray-600">AI 기반 수요 예측으로 최적의 재고 수준 유지</p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900">알림 시스템</h3>
              <p className="mt-2 text-gray-600">임계 수량 도달시 실시간 알림으로 재고 부족 방지</p>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
```

### 3. 커스텀 클래스 사용

```tsx
// app/contact/page.tsx
import { PublicLayout, generatePublicMetadata } from '@/components/layout';

export const metadata = generatePublicMetadata({
  title: '문의하기',
  description: '궁금한 점이 있으시면 언제든지 문의해주세요.',
});

export default function ContactPage() {
  return (
    <PublicLayout
      className="bg-gray-50"
      headerClassName="bg-white shadow-sm"
      footerClassName="bg-gray-900 text-white"
    >
      <div className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">문의하기</h1>
          {/* 문의 폼 컨텐츠 */}
        </div>
      </div>
    </PublicLayout>
  );
}
```

### 4. 헤더/푸터 숨기기

```tsx
// app/auth/signin/page.tsx - 로그인 페이지 (헤더/푸터 없이)
import { PublicLayout } from '@/components/layout';

export default function SignInPage() {
  return (
    <PublicLayout showHeader={false} showFooter={false}>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">{/* 로그인 폼 */}</div>
      </div>
    </PublicLayout>
  );
}
```

## 개별 컴포넌트 사용

### PublicHeader만 사용하기

```tsx
import { PublicHeader } from '@/components/layout';

export default function CustomPage() {
  return (
    <div>
      <PublicHeader className="shadow-lg" />
      {/* 커스텀 콘텐츠 */}
    </div>
  );
}
```

### PublicFooter만 사용하기

```tsx
import { PublicFooter } from '@/components/layout';

export default function CustomPage() {
  return (
    <div>
      {/* 커스텀 콘텐츠 */}
      <PublicFooter className="mt-16" />
    </div>
  );
}
```

## 메타데이터 생성 유틸리티

### 기본 메타데이터

```tsx
export const metadata = generatePublicMetadata({});
// 결과: 기본 CulinarySeoul 메타데이터
```

### 커스텀 메타데이터

```tsx
export const metadata = generatePublicMetadata({
  title: '재고 관리',
  description: '실시간 재고 추적과 효율적인 관리 시스템',
  keywords: ['재고', '관리', 'FIFO', '실시간'],
  canonical: 'https://culinaryseoul.com/inventory',
});
```

## 반응형 디자인

모든 컴포넌트는 모바일 우선 반응형 디자인으로 구현되었습니다:

- **모바일 (< 768px)**: 햄버거 메뉴, 세로 스택 레이아웃
- **태블릿 (768px - 1024px)**: 적응형 그리드, 컴팩트 네비게이션
- **데스크톱 (> 1024px)**: 풀 네비게이션, 최적화된 레이아웃

## 접근성 (Accessibility)

- **키보드 네비게이션**: 모든 인터랙티브 요소에 키보드 접근 가능
- **스크린 리더**: ARIA 레이블과 semantic HTML 사용
- **색상 대비**: WCAG 2.1 AA 기준 준수
- **포커스 관리**: 명확한 포커스 표시 및 논리적 탭 순서

## 커스터마이징

테마나 브랜딩 변경이 필요한 경우:

1. `PublicHeader.tsx`에서 로고와 브랜드명 수정
2. `PublicFooter.tsx`에서 회사 정보 업데이트
3. Tailwind CSS 클래스로 색상 및 스타일 조정
4. `generatePublicMetadata`에서 기본 SEO 정보 변경
