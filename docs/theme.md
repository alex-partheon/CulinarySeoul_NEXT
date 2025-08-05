# CashUp 통합 테마 시스템

**Generated on**: 2025-07-30  
**Version**: 1.0.0  
**Service**: CashUp (AI-based Performance Marketing Platform)

## 📖 목차

- [개요](#개요)
- [테마 구조](#테마-구조)
- [공통 기반 시스템](#공통-기반-시스템)
- [대시보드 테마](#대시보드-테마)
- [공개페이지 테마](#공개페이지-테마)
- [통합 구현 가이드라인](#통합-구현-가이드라인)
- [테마 관리 시스템](#테마-관리-시스템)

---

## 📋 개요

CashUp의 통합 테마 시스템은 **대시보드 영역**과 **공개페이지 영역**의 서로 다른 사용 맥락을 고려하여 설계되었습니다. 각 영역의 특성에 최적화된 디자인을 제공하면서도, 일관된 브랜드 아이덴티티를 유지합니다.

### 핵심 설계 원칙

1. **맥락 최적화**: 각 영역의 사용 목적에 맞춘 최적화
2. **브랜드 일관성**: 모든 영역에서 통일된 CashUp 브랜드 경험
3. **사용자 중심**: 타겟 사용자의 니즈에 맞춘 인터페이스
4. **접근성 우선**: 모든 사용자를 위한 포용적 디자인
5. **성능 최적화**: 빠른 로딩과 부드러운 인터랙션

---

## 🏗 테마 구조

### 영역별 테마 분류

```yaml
CashUp Integrated Theme System:
  Dashboard Theme:
    적용 대상:
      - crt.domain (크리에이터 대시보드)
      - biz.domain (비즈니스 대시보드)
      - adm.domain (관리자 대시보드)

    특징:
      - 데이터 중심의 기능적 디자인
      - 높은 정보 밀도 지원
      - 전문적이고 신뢰감 있는 UI
      - 생산성 최적화

    디자인 철학:
      - 미니멀리즘: 깔끔하고 정돈된 인터페이스
      - 타이포그래피 우선: 명확한 정보 계층구조
      - 기능 중심: 복잡한 데이터의 효율적 표현

  Public Pages Theme:
    적용 대상:
      - domain (메인 도메인)
      - domain/[slug] (공유 페이지)

    특징:
      - 개인화와 커스터마이징 지원
      - 모바일 우선 반응형 디자인
      - 브랜딩과 개성 표현
      - 전환 최적화

    디자인 철학:
      - 단순함: 직관적이고 이해하기 쉬운 UI
      - 개인화: 크리에이터 개성 표현 지원
      - 접근성: 모든 사용자를 위한 포용적 설계
```

---

## 🎨 공통 기반 시스템

### 브랜드 컬러 팔레트

```typescript
const cashupBrandColors = {
  // Primary Brand Colors
  cashGreen: {
    50: '#F0FDF4', // 매우 밝은 민트
    100: '#DCFCE7', // 밝은 민트
    200: '#BBF7D0', // 민트
    300: '#86EFAC', // 연한 그린
    400: '#4ADE80', // 메인 그린
    500: '#22C55E', // 진한 그린 (Primary)
    600: '#16A34A', // 더 진한 그린
    700: '#15803D', // 다크 그린
    800: '#166534', // 매우 진한 그린
    900: '#14532D', // 가장 진한 그린
  },

  // Secondary Brand Colors
  cashBlue: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6', // Secondary Blue
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },

  // Extended Palette
  purple: '#8B5CF6',
  pink: '#EC4899',
  yellow: '#F59E0B',
  orange: '#F97316',

  // Neutral Colors
  gray: {
    25: '#FCFCFD', // 백그라운드
    50: '#F9FAFB', // 카드 배경
    100: '#F3F4F6', // 보더
    200: '#E5E7EB', // 분할선
    300: '#D1D5DB', // 플레이스홀더
    400: '#9CA3AF', // 보조 텍스트
    500: '#6B7280', // 일반 텍스트
    600: '#4B5563', // 헤딩
    700: '#374151', // 진한 텍스트
    800: '#1F2937', // 메인 텍스트
    900: '#111827', // 가장 진한 텍스트
  },

  // Semantic Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};
```

### 통합 타이포그래피 시스템

```typescript
const cashupTypography = {
  // Font Families
  fontFamily: {
    // 한글 최적화 메인 폰트
    primary: [
      'Pretendard Variable',
      'Pretendard',
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      'system-ui',
      'Apple SD Gothic Neo',
      'Noto Sans KR',
      'sans-serif',
    ].join(','),

    // 숫자/데이터 전용 폰트
    mono: ['JetBrains Mono', 'Fira Code', 'SF Mono', 'Monaco', 'Consolas', 'monospace'].join(','),

    // 디스플레이/브랜딩 폰트
    display: ['Pretendard Variable', 'Inter', 'sans-serif'].join(','),
  },

  // Font Sizes (공통)
  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem', // 48px
    '6xl': '3.75rem', // 60px
  },

  // Font Weights
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  // Line Heights
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
};
```

### 공통 스페이싱 시스템

```typescript
const cashupSpacing = {
  // Base Spacing Scale
  spacing: {
    0: '0',
    1: '0.25rem', // 4px
    2: '0.5rem', // 8px
    3: '0.75rem', // 12px
    4: '1rem', // 16px
    5: '1.25rem', // 20px
    6: '1.5rem', // 24px
    8: '2rem', // 32px
    10: '2.5rem', // 40px
    12: '3rem', // 48px
    16: '4rem', // 64px
    20: '5rem', // 80px
    24: '6rem', // 96px
  },

  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.25rem', // 4px
    base: '0.5rem', // 8px
    md: '0.75rem', // 12px
    lg: '1rem', // 16px
    xl: '1.5rem', // 24px
    full: '9999px',
  },

  // Shadows
  boxShadow: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.04)',
    base: '0 1px 3px rgba(0, 0, 0, 0.09)',
    md: '0 4px 6px rgba(0, 0, 0, 0.08)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
  },
};
```

---

## 🖥 대시보드 테마

### 대시보드 컬러 시스템

```typescript
const dashboardColors = {
  // 배경 컬러
  background: {
    primary: '#FFFFFF', // 메인 배경
    secondary: cashupBrandColors.gray[50], // 카드 배경
    sidebar: cashupBrandColors.gray[900], // 사이드바
    accent: cashupBrandColors.cashGreen[50], // 액센트 영역
  },

  // 텍스트 컬러
  text: {
    primary: cashupBrandColors.gray[900], // 메인 텍스트
    secondary: cashupBrandColors.gray[600], // 보조 텍스트
    tertiary: cashupBrandColors.gray[400], // 비활성 텍스트
    inverse: '#FFFFFF', // 역방향 텍스트
    accent: cashupBrandColors.cashGreen[600], // 강조 텍스트
  },

  // 인터랙티브 컬러
  interactive: {
    primary: cashupBrandColors.cashGreen[500], // 메인 버튼
    primaryHover: cashupBrandColors.cashGreen[600], // 호버 상태
    secondary: cashupBrandColors.cashBlue[500], // 보조 버튼
    border: cashupBrandColors.gray[200], // 기본 테두리
    focusBorder: cashupBrandColors.cashGreen[500], // 포커스 테두리
  },

  // 상태 컬러
  status: {
    success: cashupBrandColors.cashGreen[500], // 성공
    warning: cashupBrandColors.yellow, // 경고
    error: cashupBrandColors.error, // 에러
    info: cashupBrandColors.cashBlue[500], // 정보
  },
};
```

### 대시보드 타이포그래피

```typescript
const dashboardTypography = {
  // 페이지 제목 (대시보드 헤더)
  pageTitle: {
    fontSize: cashupTypography.fontSize['4xl'], // 36px
    fontWeight: cashupTypography.fontWeight.bold,
    lineHeight: cashupTypography.lineHeight.tight,
    letterSpacing: '-0.02em',
    color: dashboardColors.text.primary,
  },

  // 섹션 제목
  sectionTitle: {
    fontSize: cashupTypography.fontSize['2xl'], // 24px
    fontWeight: cashupTypography.fontWeight.semibold,
    lineHeight: cashupTypography.lineHeight.snug,
    letterSpacing: '-0.01em',
    color: dashboardColors.text.primary,
  },

  // 카드 제목
  cardTitle: {
    fontSize: cashupTypography.fontSize.lg, // 18px
    fontWeight: cashupTypography.fontWeight.semibold,
    lineHeight: cashupTypography.lineHeight.normal,
    color: dashboardColors.text.primary,
  },

  // 본문 텍스트
  body: {
    fontSize: cashupTypography.fontSize.sm, // 14px
    fontWeight: cashupTypography.fontWeight.normal,
    lineHeight: cashupTypography.lineHeight.relaxed,
    color: dashboardColors.text.secondary,
  },

  // 메트릭 숫자 (수익, 통계)
  metric: {
    fontSize: cashupTypography.fontSize['4xl'], // 36px
    fontWeight: cashupTypography.fontWeight.bold,
    lineHeight: cashupTypography.lineHeight.none,
    fontFamily: cashupTypography.fontFamily.mono,
    color: dashboardColors.text.accent,
  },

  // 라벨 텍스트
  label: {
    fontSize: cashupTypography.fontSize.xs, // 12px
    fontWeight: cashupTypography.fontWeight.medium,
    lineHeight: cashupTypography.lineHeight.normal,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    color: dashboardColors.text.tertiary,
  },
};
```

### 대시보드 컴포넌트 스타일

```typescript
const dashboardComponents = {
  // 카드 컴포넌트
  card: {
    base: {
      backgroundColor: dashboardColors.background.primary,
      border: `1px solid ${dashboardColors.interactive.border}`,
      borderRadius: cashupSpacing.borderRadius.lg,
      padding: cashupSpacing.spacing[6], // 24px
      boxShadow: cashupSpacing.boxShadow.sm,
      transition: 'box-shadow 0.15s ease',
    },

    hover: {
      boxShadow: cashupSpacing.boxShadow.md,
    },

    // 수익 카드 특별 스타일
    revenue: {
      backgroundColor: dashboardColors.background.accent,
      border: `2px solid ${cashupBrandColors.cashGreen[200]}`,
      position: 'relative',

      '::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        backgroundColor: dashboardColors.interactive.primary,
        borderRadius: `${cashupSpacing.borderRadius.lg} ${cashupSpacing.borderRadius.lg} 0 0`,
      },
    },
  },

  // 버튼 컴포넌트
  button: {
    primary: {
      backgroundColor: dashboardColors.interactive.primary,
      color: '#FFFFFF',
      padding: `${cashupSpacing.spacing[2]} ${cashupSpacing.spacing[4]}`, // 8px 16px
      borderRadius: cashupSpacing.borderRadius.base,
      fontSize: cashupTypography.fontSize.sm,
      fontWeight: cashupTypography.fontWeight.medium,
      border: 'none',
      cursor: 'pointer',
      transition: 'background-color 0.15s ease',

      ':hover': {
        backgroundColor: dashboardColors.interactive.primaryHover,
      },
    },

    secondary: {
      backgroundColor: cashupBrandColors.gray[100],
      color: dashboardColors.text.primary,
      padding: `${cashupSpacing.spacing[2]} ${cashupSpacing.spacing[4]}`,
      borderRadius: cashupSpacing.borderRadius.base,
      fontSize: cashupTypography.fontSize.sm,
      fontWeight: cashupTypography.fontWeight.medium,
      border: 'none',
      cursor: 'pointer',
      transition: 'background-color 0.15s ease',

      ':hover': {
        backgroundColor: cashupBrandColors.gray[200],
      },
    },
  },

  // 사이드바 스타일
  sidebar: {
    container: {
      width: '280px',
      backgroundColor: dashboardColors.background.sidebar,
      color: dashboardColors.text.inverse,
      padding: `${cashupSpacing.spacing[6]} ${cashupSpacing.spacing[4]}`,
      position: 'fixed',
      height: '100vh',
      top: 0,
      left: 0,
    },

    menuItem: {
      padding: `${cashupSpacing.spacing[3]} ${cashupSpacing.spacing[4]}`,
      borderRadius: cashupSpacing.borderRadius.base,
      cursor: 'pointer',
      transition: 'background-color 0.15s ease',

      ':hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      },

      '&.active': {
        backgroundColor: dashboardColors.interactive.primary,
        color: '#000000',
      },
    },
  },
};
```

### 대시보드 전용 UI 패턴

```typescript
const dashboardPatterns = {
  // 3단계 추천 수익 시각화
  referralLevels: {
    container: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: cashupSpacing.spacing[4],
      marginTop: cashupSpacing.spacing[6],
    },

    level: {
      padding: cashupSpacing.spacing[4],
      borderRadius: cashupSpacing.borderRadius.lg,
      textAlign: 'center',
      border: '2px solid transparent',
      transition: 'all 0.15s ease',
    },

    level1: {
      backgroundColor: cashupBrandColors.cashGreen[50],
      borderColor: cashupBrandColors.cashGreen[200],

      '.percentage': {
        color: cashupBrandColors.cashGreen[600],
        fontSize: cashupTypography.fontSize.xl,
        fontWeight: cashupTypography.fontWeight.bold,
        fontFamily: cashupTypography.fontFamily.mono,
      },

      '.label': {
        color: cashupBrandColors.cashGreen[700],
        fontSize: cashupTypography.fontSize.sm,
        fontWeight: cashupTypography.fontWeight.medium,
      },
    },

    level2: {
      backgroundColor: cashupBrandColors.cashBlue[50],
      borderColor: cashupBrandColors.cashBlue[200],

      '.percentage': {
        color: cashupBrandColors.cashBlue[600],
        fontSize: cashupTypography.fontSize.xl,
        fontWeight: cashupTypography.fontWeight.bold,
        fontFamily: cashupTypography.fontFamily.mono,
      },
    },

    level3: {
      backgroundColor: '#F3E8FF',
      borderColor: '#C4B5FD',

      '.percentage': {
        color: cashupBrandColors.purple,
        fontSize: cashupTypography.fontSize.xl,
        fontWeight: cashupTypography.fontWeight.bold,
        fontFamily: cashupTypography.fontFamily.mono,
      },
    },
  },

  // 캠페인 상태 배지
  statusBadge: {
    base: {
      padding: `${cashupSpacing.spacing[1]} ${cashupSpacing.spacing[3]}`,
      borderRadius: cashupSpacing.borderRadius.full,
      fontSize: cashupTypography.fontSize.xs,
      fontWeight: cashupTypography.fontWeight.semibold,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },

    active: {
      backgroundColor: cashupBrandColors.cashGreen[100],
      color: cashupBrandColors.cashGreen[700],
      border: `1px solid ${cashupBrandColors.cashGreen[300]}`,
    },

    pending: {
      backgroundColor: '#FEF3C7',
      color: '#92400E',
      border: '1px solid #FCD34D',
    },

    completed: {
      backgroundColor: cashupBrandColors.cashBlue[100],
      color: cashupBrandColors.cashBlue[700],
      border: `1px solid ${cashupBrandColors.cashBlue[300]}`,
    },
  },
};
```

---

## 🌐 공개페이지 테마

### 공개페이지 컬러 시스템

```typescript
const publicPageColors = {
  // 기본 테마 컬러
  default: {
    background: '#FFFFFF',
    text: cashupBrandColors.gray[900],
    accent: cashupBrandColors.cashGreen[500],
    linkBackground: '#FFFFFF',
    linkText: cashupBrandColors.gray[900],
    linkBorder: cashupBrandColors.gray[200],
  },

  // 확장 색상 팔레트
  extended: {
    purple: cashupBrandColors.purple,
    pink: cashupBrandColors.pink,
    blue: cashupBrandColors.cashBlue[500],
    yellow: cashupBrandColors.yellow,
    orange: cashupBrandColors.orange,
  },

  // 시맨틱 컬러
  semantic: {
    success: cashupBrandColors.success,
    warning: cashupBrandColors.warning,
    error: cashupBrandColors.error,
    info: cashupBrandColors.info,
  },
};
```

### 공개페이지 타이포그래피

```typescript
const publicPageTypography = {
  // 히어로 제목 (랜딩페이지)
  hero: {
    fontSize: cashupTypography.fontSize['6xl'], // 60px
    fontWeight: cashupTypography.fontWeight.extrabold,
    lineHeight: cashupTypography.lineHeight.none,
    letterSpacing: '-0.02em',
    color: publicPageColors.default.text,
  },

  // 메인 제목
  heading1: {
    fontSize: cashupTypography.fontSize['4xl'], // 36px
    fontWeight: cashupTypography.fontWeight.bold,
    lineHeight: cashupTypography.lineHeight.tight,
    letterSpacing: '-0.01em',
  },

  // 서브 제목
  heading2: {
    fontSize: cashupTypography.fontSize['2xl'], // 24px
    fontWeight: cashupTypography.fontWeight.semibold,
    lineHeight: cashupTypography.lineHeight.snug,
  },

  // 본문 텍스트
  body: {
    fontSize: cashupTypography.fontSize.lg, // 18px
    fontWeight: cashupTypography.fontWeight.normal,
    lineHeight: cashupTypography.lineHeight.relaxed,
    color: publicPageColors.default.text,
  },

  // CTA 버튼 텍스트
  cta: {
    fontSize: cashupTypography.fontSize.base, // 16px
    fontWeight: cashupTypography.fontWeight.semibold,
    lineHeight: cashupTypography.lineHeight.normal,
    letterSpacing: '0.01em',
  },
};
```

### 공개페이지 컴포넌트 스타일

```typescript
const publicPageComponents = {
  // 버튼 스타일
  button: {
    primary: {
      backgroundColor: publicPageColors.default.accent,
      color: '#000000',
      padding: `${cashupSpacing.spacing[3]} ${cashupSpacing.spacing[6]}`, // 12px 24px
      borderRadius: cashupSpacing.borderRadius.full,
      fontSize: cashupTypography.fontSize.base,
      fontWeight: cashupTypography.fontWeight.semibold,
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: cashupSpacing.spacing[2],

      ':hover': {
        backgroundColor: cashupBrandColors.cashGreen[600],
        transform: 'translateY(-2px)',
        boxShadow: `0 4px 12px rgba(34, 197, 94, 0.3)`,
      },

      ':active': {
        transform: 'translateY(0)',
      },
    },

    secondary: {
      backgroundColor: 'transparent',
      color: publicPageColors.default.text,
      border: `2px solid ${publicPageColors.default.text}`,
      padding: `${cashupSpacing.spacing[3]} ${cashupSpacing.spacing[6]}`,
      borderRadius: cashupSpacing.borderRadius.full,
      fontSize: cashupTypography.fontSize.base,
      fontWeight: cashupTypography.fontWeight.semibold,
      cursor: 'pointer',
      transition: 'all 0.2s ease',

      ':hover': {
        backgroundColor: publicPageColors.default.text,
        color: '#FFFFFF',
      },
    },
  },

  // 링크/캠페인 카드
  linkCard: {
    base: {
      display: 'block',
      width: '100%',
      padding: cashupSpacing.spacing[5], // 20px
      marginBottom: cashupSpacing.spacing[4],
      borderRadius: cashupSpacing.borderRadius.xl,
      backgroundColor: publicPageColors.default.linkBackground,
      border: `2px solid transparent`,
      textDecoration: 'none',
      color: publicPageColors.default.linkText,
      fontWeight: cashupTypography.fontWeight.medium,
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      textAlign: 'center',

      ':hover': {
        transform: 'scale(1.02)',
        borderColor: publicPageColors.default.linkBorder,
        boxShadow: cashupSpacing.boxShadow.lg,
      },

      ':active': {
        transform: 'scale(0.98)',
      },
    },

    variants: {
      filled: {
        backgroundColor: publicPageColors.default.text,
        color: '#FFFFFF',

        ':hover': {
          backgroundColor: cashupBrandColors.gray[700],
        },
      },

      outlined: {
        backgroundColor: 'transparent',
        border: `2px solid ${publicPageColors.default.text}`,

        ':hover': {
          backgroundColor: cashupBrandColors.gray[50],
        },
      },

      gradient: {
        background: `linear-gradient(135deg, ${cashupBrandColors.cashGreen[500]} 0%, ${cashupBrandColors.cashBlue[500]} 100%)`,
        color: '#FFFFFF',
        border: 'none',

        ':hover': {
          background: `linear-gradient(135deg, ${cashupBrandColors.cashGreen[600]} 0%, ${cashupBrandColors.cashBlue[600]} 100%)`,
        },
      },
    },
  },

  // 프로필 카드
  profileCard: {
    container: {
      backgroundColor: publicPageColors.default.background,
      borderRadius: cashupSpacing.borderRadius.xl,
      padding: cashupSpacing.spacing[8], // 32px
      textAlign: 'center',
      boxShadow: cashupSpacing.boxShadow.md,
      border: `1px solid ${publicPageColors.default.linkBorder}`,
      marginBottom: cashupSpacing.spacing[8],
    },

    avatar: {
      width: '120px',
      height: '120px',
      borderRadius: '50%',
      margin: `0 auto ${cashupSpacing.spacing[4]}`,
      border: `4px solid ${publicPageColors.default.accent}`,
      overflow: 'hidden',
    },

    name: {
      fontSize: cashupTypography.fontSize['2xl'],
      fontWeight: cashupTypography.fontWeight.bold,
      color: publicPageColors.default.text,
      marginBottom: cashupSpacing.spacing[2],
    },

    bio: {
      fontSize: cashupTypography.fontSize.base,
      color: cashupBrandColors.gray[600],
      lineHeight: cashupTypography.lineHeight.relaxed,
      marginBottom: cashupSpacing.spacing[6],
    },
  },
};
```

### 공개페이지 테마 프리셋

```typescript
const publicPageThemes = {
  // 1. 기본 테마
  default: {
    name: 'CashUp Default',
    colors: {
      background: '#FFFFFF',
      text: cashupBrandColors.gray[900],
      accent: cashupBrandColors.cashGreen[500],
      linkBackground: '#FFFFFF',
      linkText: cashupBrandColors.gray[900],
      linkBorder: cashupBrandColors.gray[200],
    },
  },

  // 2. 다크 모드
  dark: {
    name: 'Dark Professional',
    colors: {
      background: cashupBrandColors.gray[900],
      text: cashupBrandColors.gray[50],
      accent: cashupBrandColors.cashGreen[500],
      linkBackground: cashupBrandColors.gray[800],
      linkText: cashupBrandColors.gray[50],
      linkBorder: cashupBrandColors.gray[700],
    },
  },

  // 3. 민트 프레시
  mintFresh: {
    name: 'Mint Fresh',
    colors: {
      background: cashupBrandColors.cashGreen[50],
      text: cashupBrandColors.cashGreen[900],
      accent: cashupBrandColors.cashGreen[600],
      linkBackground: '#FFFFFF',
      linkText: cashupBrandColors.cashGreen[900],
      linkBorder: cashupBrandColors.cashGreen[200],
    },
  },

  // 4. 오션 브리즈
  oceanBreeze: {
    name: 'Ocean Breeze',
    colors: {
      background: cashupBrandColors.cashBlue[50],
      text: cashupBrandColors.cashBlue[900],
      accent: cashupBrandColors.cashBlue[600],
      linkBackground: '#FFFFFF',
      linkText: cashupBrandColors.cashBlue[900],
      linkBorder: cashupBrandColors.cashBlue[200],
    },
  },

  // 5. 머니 그린
  moneyGreen: {
    name: 'Money Green',
    colors: {
      background: cashupBrandColors.cashGreen[800],
      text: cashupBrandColors.cashGreen[50],
      accent: cashupBrandColors.yellow,
      linkBackground: cashupBrandColors.cashGreen[700],
      linkText: '#FFFFFF',
      linkBorder: 'transparent',
    },
  },

  // 6. 미니멀리스트
  minimalist: {
    name: 'Minimalist',
    colors: {
      background: cashupBrandColors.gray[50],
      text: cashupBrandColors.gray[700],
      accent: cashupBrandColors.gray[900],
      linkBackground: 'transparent',
      linkText: cashupBrandColors.gray[700],
      linkBorder: cashupBrandColors.gray[700],
    },
  },

  // 7. 네온 나이츠
  neonNights: {
    name: 'Neon Nights',
    colors: {
      background: '#0F0F0F',
      text: '#FFFFFF',
      accent: cashupBrandColors.pink,
      linkBackground: `rgba(236, 72, 153, 0.1)`,
      linkText: '#FFFFFF',
      linkBorder: cashupBrandColors.pink,
    },
  },

  // 8. 퍼플 드림
  purpleDream: {
    name: 'Purple Dream',
    colors: {
      background: '#FAF5FF',
      text: '#581C87',
      accent: cashupBrandColors.purple,
      linkBackground: '#FFFFFF',
      linkText: '#581C87',
      linkBorder: '#C4B5FD',
    },
  },
};
```

---

## 🛠 통합 구현 가이드라인

### CSS 변수 시스템

```css
/* 공통 기반 변수 */
:root {
  /* 브랜드 컬러 */
  --cashup-green-50: #f0fdf4;
  --cashup-green-500: #22c55e;
  --cashup-green-600: #16a34a;
  --cashup-blue-500: #3b82f6;

  /* 타이포그래피 */
  --font-family-primary: 'Pretendard Variable', 'Pretendard', 'Inter', sans-serif;
  --font-family-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* 스페이싱 */
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-4: 1rem;
  --spacing-6: 1.5rem;
  --spacing-8: 2rem;

  /* 애니메이션 */
  --transition-fast: 0.15s ease;
  --transition-normal: 0.25s ease;
  --transition-slow: 0.35s ease;
}

/* 대시보드 영역 변수 */
[data-area='dashboard'] {
  --background-primary: #ffffff;
  --background-secondary: #f9fafb;
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --accent-primary: var(--cashup-green-500);
  --border-color: #e5e7eb;
}

/* 공개페이지 영역 변수 */
[data-area='public'] {
  --background-primary: var(--theme-background, #ffffff);
  --text-primary: var(--theme-text, #111827);
  --accent-primary: var(--theme-accent, var(--cashup-green-500));
  --link-background: var(--theme-link-background, #ffffff);
  --link-text: var(--theme-link-text, #111827);
  --link-border: var(--theme-link-border, #e5e7eb);
}

/* 테마별 변수 오버라이드 */
[data-theme='dark'] {
  --theme-background: #111827;
  --theme-text: #f9fafb;
  --theme-link-background: #1f2937;
  --theme-link-text: #f9fafb;
  --theme-link-border: #374151;
}

[data-theme='mint-fresh'] {
  --theme-background: var(--cashup-green-50);
  --theme-text: #064e3b;
  --theme-accent: #10b981;
  --theme-link-border: #a7f3d0;
}
```

### React 테마 컨텍스트

```tsx
// contexts/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeConfig {
  area: 'dashboard' | 'public';
  theme?: string;
  customColors?: Record<string, string>;
}

interface ThemeContextType {
  config: ThemeConfig;
  setConfig: (config: Partial<ThemeConfig>) => void;
  availableThemes: Array<{
    id: string;
    name: string;
    colors: Record<string, string>;
    preview: string;
  }>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{
  children: React.ReactNode;
  defaultArea: 'dashboard' | 'public';
}> = ({ children, defaultArea }) => {
  const [config, setConfigState] = useState<ThemeConfig>({
    area: defaultArea,
    theme: defaultArea === 'public' ? 'default' : undefined,
  });

  const setConfig = (newConfig: Partial<ThemeConfig>) => {
    setConfigState((prev) => ({ ...prev, ...newConfig }));
  };

  useEffect(() => {
    // 영역별 data attribute 설정
    document.documentElement.setAttribute('data-area', config.area);

    // 공개페이지의 경우 테마 설정
    if (config.area === 'public' && config.theme) {
      document.documentElement.setAttribute('data-theme', config.theme);

      // 커스텀 컬러 적용
      if (config.customColors) {
        Object.entries(config.customColors).forEach(([key, value]) => {
          document.documentElement.style.setProperty(`--theme-${key}`, value);
        });
      }
    }
  }, [config]);

  const availableThemes = config.area === 'public' ? publicPageThemes : [];

  return (
    <ThemeContext.Provider value={{ config, setConfig, availableThemes }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
```

### 영역별 레이아웃 컴포넌트

```tsx
// components/layouts/DashboardLayout.tsx
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setConfig } = useTheme();

  React.useEffect(() => {
    setConfig({ area: 'dashboard' });
  }, [setConfig]);

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">{/* 사이드바 콘텐츠 */}</aside>
      <main className="dashboard-main">
        <header className="dashboard-header">{/* 헤더 콘텐츠 */}</header>
        <div className="dashboard-content">{children}</div>
      </main>
    </div>
  );
};

// components/layouts/PublicPageLayout.tsx
export const PublicPageLayout: React.FC<{
  children: React.ReactNode;
  theme?: string;
}> = ({ children, theme = 'default' }) => {
  const { setConfig } = useTheme();

  React.useEffect(() => {
    setConfig({ area: 'public', theme });
  }, [setConfig, theme]);

  return (
    <div className="public-layout">
      <main className="public-main">{children}</main>
      <footer className="public-footer">
        <a href="/" className="footer-logo">
          Powered by CashUp
        </a>
      </footer>
    </div>
  );
};
```

### 통합 컴포넌트 라이브러리

```tsx
// components/ui/Button.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // 대시보드용 버튼
        'dashboard-primary':
          'bg-[var(--accent-primary)] text-white hover:bg-[var(--cashup-green-600)] rounded-lg',
        'dashboard-secondary':
          'bg-gray-100 text-[var(--text-primary)] hover:bg-gray-200 rounded-lg',

        // 공개페이지용 버튼
        'public-primary':
          'bg-[var(--accent-primary)] text-black hover:bg-[var(--cashup-green-600)] rounded-full hover:shadow-lg hover:-translate-y-0.5',
        'public-secondary':
          'bg-transparent text-[var(--text-primary)] border-2 border-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-white rounded-full',
        'public-link':
          'bg-[var(--link-background)] text-[var(--link-text)] border-2 border-transparent hover:border-[var(--link-border)] hover:scale-105 rounded-2xl',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-11 px-8 text-base',
        'public-link': 'w-full p-5 text-base font-medium',
      },
    },
    defaultVariants: {
      variant: 'dashboard-primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);

export { Button, buttonVariants };
```

---

## 🎛 테마 관리 시스템

### 테마 설정 관리자

```tsx
// components/admin/ThemeManager.tsx
import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export const ThemeManager: React.FC = () => {
  const { config, setConfig, availableThemes } = useTheme();
  const [customColors, setCustomColors] = useState<Record<string, string>>({});

  const handleThemeChange = (themeId: string) => {
    const selectedTheme = availableThemes.find((t) => t.id === themeId);
    if (selectedTheme) {
      setConfig({
        theme: themeId,
        customColors: selectedTheme.colors,
      });
    }
  };

  const handleCustomColorChange = (colorKey: string, value: string) => {
    const newCustomColors = { ...customColors, [colorKey]: value };
    setCustomColors(newCustomColors);
    setConfig({ customColors: newCustomColors });
  };

  return (
    <div className="theme-manager">
      <div className="theme-selector">
        <h3>프리셋 테마</h3>
        <div className="theme-grid">
          {availableThemes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleThemeChange(theme.id)}
              className={`theme-option ${config.theme === theme.id ? 'active' : ''}`}
            >
              <div className="theme-preview" style={{ backgroundColor: theme.colors.background }}>
                <div className="accent-bar" style={{ backgroundColor: theme.colors.accent }} />
                <span style={{ color: theme.colors.text }}>{theme.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="custom-colors">
        <h3>커스텀 컬러</h3>
        <div className="color-inputs">
          {Object.entries(customColors).map(([key, value]) => (
            <div key={key} className="color-input-group">
              <label>{key}</label>
              <input
                type="color"
                value={value}
                onChange={(e) => handleCustomColorChange(key, e.target.value)}
              />
              <input
                type="text"
                value={value}
                onChange={(e) => handleCustomColorChange(key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

### 테마 프리뷰 시스템

```tsx
// components/admin/ThemePreview.tsx
export const ThemePreview: React.FC<{
  theme: typeof publicPageThemes.default;
  type: 'dashboard' | 'public';
}> = ({ theme, type }) => {
  return (
    <div
      className="theme-preview-container"
      style={
        {
          '--preview-background': theme.colors.background,
          '--preview-text': theme.colors.text,
          '--preview-accent': theme.colors.accent,
        } as React.CSSProperties
      }
    >
      {type === 'dashboard' ? (
        <div className="dashboard-preview">
          <div className="preview-sidebar" />
          <div className="preview-main">
            <div className="preview-header" />
            <div className="preview-cards">
              <div className="preview-card revenue-card" />
              <div className="preview-card" />
              <div className="preview-card" />
            </div>
          </div>
        </div>
      ) : (
        <div className="public-preview">
          <div className="preview-profile-card" />
          <div className="preview-links">
            <div className="preview-link" />
            <div className="preview-link" />
            <div className="preview-link" />
          </div>
        </div>
      )}
    </div>
  );
};
```

### 반응형 및 접근성 고려사항

```css
/* 반응형 대시보드 */
@media (max-width: 1024px) {
  [data-area='dashboard'] .dashboard-sidebar {
    transform: translateX(-100%);
    position: fixed;
    z-index: 200;
  }

  [data-area='dashboard'] .dashboard-main {
    margin-left: 0;
  }
}

/* 반응형 공개페이지 */
@media (max-width: 640px) {
  [data-area='public'] .public-layout {
    padding: var(--spacing-4);
  }

  [data-area='public'] .profile-card {
    padding: var(--spacing-6);
  }

  [data-area='public'] .link-card {
    padding: var(--spacing-4);
  }
}

/* 접근성 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-contrast: high) {
  :root {
    --border-color: #000000;
    --text-primary: #000000;
    --background-primary: #ffffff;
  }
}

/* 다크 모드 시스템 연동 */
@media (prefers-color-scheme: dark) {
  [data-area='dashboard']:not([data-theme]) {
    --background-primary: #111827;
    --background-secondary: #1f2937;
    --text-primary: #f9fafb;
    --text-secondary: #d1d5db;
  }
}
```

---

## 📋 구현 체크리스트

### 기반 시스템

- [ ] CSS 변수 시스템 구현
- [ ] React 테마 컨텍스트 설정
- [ ] 영역별 데이터 어트리뷰트 적용
- [ ] 통합 폰트 로딩 시스템

### 대시보드 테마

- [ ] 대시보드 레이아웃 컴포넌트
- [ ] 사이드바 네비게이션
- [ ] 카드 컴포넌트 (기본, 수익, 캠페인)
- [ ] 버튼 컴포넌트 (대시보드 변형)
- [ ] 3단계 추천 수익 시각화
- [ ] 상태 배지 시스템
- [ ] AI 매칭 점수 표시

### 공개페이지 테마

- [ ] 공개페이지 레이아웃 컴포넌트
- [ ] 프로필 카드 컴포넌트
- [ ] 링크/캠페인 카드 컴포넌트
- [ ] 버튼 컴포넌트 (공개페이지 변형)
- [ ] 8개 기본 테마 프리셋
- [ ] 테마 선택기 UI
- [ ] 커스텀 컬러 설정

### 관리 시스템

- [ ] 테마 관리 대시보드
- [ ] 테마 프리뷰 시스템
- [ ] 테마 내보내기/가져오기
- [ ] 사용자별 테마 저장

### 접근성 & 성능

- [ ] 키보드 네비게이션 지원
- [ ] 스크린 리더 최적화
- [ ] 색상 대비율 검증 (WCAG AA)
- [ ] 모션 감소 모드 지원
- [ ] 반응형 디자인 (모바일 우선)
- [ ] 테마 전환 성능 최적화
- [ ] 중요 CSS 인라인화

### 개발자 경험

- [ ] TypeScript 타입 정의
- [ ] Storybook 컴포넌트 문서화
- [ ] 테마 개발 도구
- [ ] 디자인 토큰 관리 시스템

---

**마지막 업데이트**: 2025년 7월 30일  
**버전**: 1.0.0  
**적용 범위**: 전체 CashUp 플랫폼 (대시보드 + 공개페이지)  
**다음 리뷰**: 개발 진행에 따라 지속 업데이트
