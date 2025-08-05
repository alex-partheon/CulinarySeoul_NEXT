# Tailwind CSS v4 개발 가이드

## 개요

Tailwind CSS는 유틸리티 우선(utility-first) CSS 프레임워크로, CashUp 프로젝트의 스타일링을 담당합니다. v4에서는 성능 개선과 새로운 기능들이 추가되어 더욱 효율적인 개발이 가능합니다.

## 설치 및 환경 설정

### 기본 설치

```bash
npm install tailwindcss@next @tailwindcss/postcss@next
npx tailwindcss init
```

### 설정 파일

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // CashUp 브랜드 컬러
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          900: '#0f172a',
        },
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      fontFamily: {
        sans: ['Pretendard', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        18: '4.5rem',
        88: '22rem',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(-5%)' },
          '50%': { transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
  darkMode: 'class', // 다크 모드 지원
};
```

### CSS 파일 설정

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 커스텀 베이스 스타일 */
@layer base {
  html {
    font-family: 'Pretendard', system-ui, sans-serif;
  }

  body {
    @apply bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    @apply font-semibold;
  }

  h1 {
    @apply text-3xl lg:text-4xl;
  }

  h2 {
    @apply text-2xl lg:text-3xl;
  }

  h3 {
    @apply text-xl lg:text-2xl;
  }
}

/* 커스텀 컴포넌트 */
@layer components {
  .btn {
    @apply px-4 py-2 rounded-lg font-medium transition-colors duration-200;
  }

  .btn-primary {
    @apply btn bg-primary-500 text-white hover:bg-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2;
  }

  .btn-secondary {
    @apply btn bg-secondary-100 text-secondary-700 hover:bg-secondary-200 dark:bg-secondary-800 dark:text-secondary-200 dark:hover:bg-secondary-700;
  }

  .card {
    @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700;
  }

  .input {
    @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent;
  }
}

/* 커스텀 유틸리티 */
@layer utilities {
  .text-balance {
    text-wrap: balance;
  }

  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }

  .gradient-text {
    @apply bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent;
  }
}
```

## 핵심 기능 및 사용법

### 1. 반응형 디자인

```tsx
// 반응형 그리드 레이아웃
export function ResponsiveGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
      {/* 그리드 아이템들 */}
    </div>
  );
}

// 반응형 텍스트 크기
export function ResponsiveText() {
  return (
    <div>
      <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold">반응형 제목</h1>
      <p className="text-sm sm:text-base lg:text-lg text-gray-600">반응형 본문 텍스트</p>
    </div>
  );
}

// 반응형 패딩/마진
export function ResponsiveSpacing() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 xl:p-12">
      <div className="space-y-4 sm:space-y-6 lg:space-y-8">{/* 콘텐츠 */}</div>
    </div>
  );
}
```

### 2. 다크 모드 구현

```tsx
// 다크 모드 토글 컴포넌트
'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
    const initialTheme = savedTheme || systemTheme;

    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      aria-label="테마 변경"
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      ) : (
        <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      )}
    </button>
  );
}

// 다크 모드 스타일 적용 예시
export function DarkModeCard() {
  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        다크 모드 카드
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">이 카드는 다크 모드를 지원합니다.</p>
      <button className="btn-primary">액션 버튼</button>
    </div>
  );
}
```

### 3. 애니메이션 및 트랜지션

```tsx
// 호버 효과
export function HoverEffects() {
  return (
    <div className="space-y-4">
      {/* 스케일 효과 */}
      <div className="card p-4 hover:scale-105 transition-transform duration-200 cursor-pointer">
        호버 시 확대
      </div>

      {/* 그림자 효과 */}
      <div className="card p-4 hover:shadow-lg transition-shadow duration-300">
        호버 시 그림자 증가
      </div>

      {/* 색상 변화 */}
      <button className="btn bg-blue-500 hover:bg-blue-600 active:bg-blue-700 transition-colors duration-150">
        색상 변화 버튼
      </button>
    </div>
  );
}

// 페이드 인 애니메이션
export function FadeInAnimation() {
  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-4">페이드 인 제목</h2>
      <p className="text-gray-600">이 콘텐츠는 페이드 인 효과와 함께 나타납니다.</p>
    </div>
  );
}

// 슬라이드 업 애니메이션
export function SlideUpAnimation() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((item, index) => (
        <div
          key={item}
          className="card p-4 animate-slide-up"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          아이템 {item}
        </div>
      ))}
    </div>
  );
}
```

### 4. 폼 스타일링

```tsx
// 폼 컴포넌트
export function StyledForm() {
  return (
    <form className="space-y-6 max-w-md mx-auto">
      {/* 입력 필드 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          이메일
        </label>
        <input type="email" className="input" placeholder="이메일을 입력하세요" />
      </div>

      {/* 텍스트 영역 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          메시지
        </label>
        <textarea className="input h-32 resize-none" placeholder="메시지를 입력하세요" />
      </div>

      {/* 선택 박스 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          카테고리
        </label>
        <select className="input">
          <option>카테고리를 선택하세요</option>
          <option>뷰티</option>
          <option>패션</option>
          <option>라이프스타일</option>
        </select>
      </div>

      {/* 체크박스 */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="agree"
          className="w-4 h-4 text-primary-500 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
        />
        <label htmlFor="agree" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
          이용약관에 동의합니다
        </label>
      </div>

      {/* 제출 버튼 */}
      <button type="submit" className="btn-primary w-full">
        제출하기
      </button>
    </form>
  );
}
```

## CashUp 프로젝트 특화 스타일

### 1. 브랜드 컴포넌트

```tsx
// 로고 컴포넌트
export function CashUpLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16',
  };

  return (
    <div className="flex items-center space-x-2">
      <div
        className={`${sizeClasses[size]} aspect-square bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center`}
      >
        <span className="text-white font-bold text-lg">C</span>
      </div>
      <span className="font-bold text-xl gradient-text">CashUp</span>
    </div>
  );
}

// 크리에이터 카드
export function CreatorCard({ creator }: { creator: any }) {
  return (
    <div className="card p-6 hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
          <span className="text-white font-semibold">{creator.name.charAt(0)}</span>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-500 transition-colors">
            {creator.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{creator.category}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>팔로워 {creator.followers.toLocaleString()}명</span>
        {creator.verified && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300">
            인증됨
          </span>
        )}
      </div>
    </div>
  );
}
```

### 2. 대시보드 레이아웃

```tsx
// 대시보드 통계 카드
export function StatsCard({ title, value, change, icon: Icon }: any) {
  const isPositive = change > 0;

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
          <Icon className="w-6 h-6 text-primary-500" />
        </div>
        <span className={`text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {isPositive ? '+' : ''}
          {change}%
        </span>
      </div>

      <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
        {value.toLocaleString()}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
    </div>
  );
}

// 사이드바 네비게이션
export function Sidebar() {
  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen">
      <div className="p-6">
        <CashUpLogo />
      </div>

      <nav className="px-4 space-y-2">
        {[
          { name: '대시보드', href: '/dashboard', icon: 'dashboard' },
          { name: '크리에이터', href: '/creators', icon: 'users' },
          { name: '캠페인', href: '/campaigns', icon: 'megaphone' },
          { name: '수익', href: '/earnings', icon: 'dollar-sign' },
        ].map((item) => (
          <a
            key={item.name}
            href={item.href}
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <span>{item.name}</span>
          </a>
        ))}
      </nav>
    </aside>
  );
}
```

### 3. 모바일 최적화

```tsx
// 모바일 네비게이션
export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 모바일 메뉴 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-800"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* 모바일 메뉴 오버레이 */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsOpen(false)} />
          <div className="fixed top-0 left-0 w-64 h-full bg-white dark:bg-gray-800 shadow-xl">
            <div className="p-6">
              <CashUpLogo />
            </div>
            {/* 네비게이션 메뉴 */}
          </div>
        </div>
      )}
    </>
  );
}

// 모바일 친화적 그리드
export function MobileGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-4 sm:px-6 lg:px-8">
      {children}
    </div>
  );
}
```

### 4. 접근성 고려사항

```tsx
// 접근성을 고려한 버튼
export function AccessibleButton({ children, variant = 'primary', ...props }: any) {
  return (
    <button
      className={`
        btn
        ${variant === 'primary' ? 'btn-primary' : 'btn-secondary'}
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
      {...props}
    >
      {children}
    </button>
  );
}

// 스크린 리더를 위한 숨김 텍스트
export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

// 고대비 모드 지원
export function HighContrastCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="card p-6 contrast-more:border-2 contrast-more:border-black dark:contrast-more:border-white">
      {children}
    </div>
  );
}
```

## 성능 최적화

### 1. CSS 번들 크기 최적화

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  // 사용하지 않는 스타일 제거
  safelist: [
    // 동적으로 생성되는 클래스들
    'bg-red-500',
    'bg-green-500',
    'bg-blue-500',
  ],
  // 특정 클래스 제외
  blocklist: ['container'],
};
```

### 2. 조건부 스타일링

```tsx
// 조건부 클래스 적용
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

// 사용 예시
export function ConditionalButton({ isActive, size }: any) {
  return (
    <button
      className={cn(
        'btn transition-colors',
        isActive ? 'btn-primary' : 'btn-secondary',
        size === 'lg' && 'px-6 py-3 text-lg',
        size === 'sm' && 'px-2 py-1 text-sm',
      )}
    >
      버튼
    </button>
  );
}
```

## 문제 해결 및 모범 사례

### 1. 일반적인 문제들

```tsx
// 문제: 스타일이 적용되지 않음
// 해결: content 경로 확인
// tailwind.config.js에서 올바른 파일 경로 설정

// 문제: 다크 모드가 작동하지 않음
// 해결: HTML 클래스 확인
const toggleDarkMode = () => {
  document.documentElement.classList.toggle('dark');
};

// 문제: 반응형이 제대로 작동하지 않음
// 해결: 모바일 우선 접근법 사용
// 잘못된 예: lg:text-base text-lg
// 올바른 예: text-lg lg:text-base
```

### 2. 코드 품질 향상

```tsx
// 재사용 가능한 스타일 변수
const buttonVariants = {
  primary: 'bg-primary-500 hover:bg-primary-600 text-white',
  secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
  danger: 'bg-red-500 hover:bg-red-600 text-white',
};

const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export function Button({ variant = 'primary', size = 'md', children, ...props }: any) {
  return (
    <button
      className={cn(
        'rounded-lg font-medium transition-colors duration-200',
        buttonVariants[variant],
        buttonSizes[size],
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

## 참고 자료

- [Tailwind CSS 공식 문서](https://tailwindcss.com/docs)
- [Tailwind UI 컴포넌트](https://tailwindui.com/)
- [Headless UI](https://headlessui.com/)
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

---

**작성일**: 2024년 12월
**버전**: 1.0
**담당자**: CashUp 개발팀
