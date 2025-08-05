# Vitest vs Jest 비교 분석

**Generated on**: 2025-01-27  
**Project**: CashUp (AI-based Performance Marketing Platform)  
**Current Status**: Jest 사용 중

## 📖 목차

- [현재 프로젝트 테스트 환경](#현재-프로젝트-테스트-환경)
- [Jest vs Vitest 비교](#jest-vs-vitest-비교)
- [성능 및 개발 경험 비교](#성능-및-개발-경험-비교)
- [CashUp 프로젝트 전환 가능성](#cashup-프로젝트-전환-가능성)
- [전환 시 고려사항](#전환-시-고려사항)
- [권장사항](#권장사항)

---

## 🔧 현재 프로젝트 테스트 환경

### 현재 사용 중인 테스트 도구

```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test"
  },
  "devDependencies": {
    "@types/jest": "^29.5.14",
    "@playwright/test": "^1.54.1"
  }
}
```

### Jest 설정 현황

**jest.config.js**:

- Next.js 통합 설정 (`next/jest` 사용)
- Node.js 테스트 환경
- TypeScript 지원
- 모듈 경로 매핑 (`@/` → `src/`)
- 커버리지 리포팅 설정

**테스트 파일 구조**:

```
src/__tests__/
├── api/           # API 테스트
├── auth/          # 인증 테스트 (3개 파일)
└── middleware.test.ts  # 미들웨어 테스트 (453줄)
```

**현재 테스트 특징**:

- Supabase 클라이언트 모킹
- Next.js 미들웨어 테스트
- TypeScript 완전 지원
- 환경변수 모킹 설정

---

## ⚖️ Jest vs Vitest 비교

### 1. 기본 특성

| 항목            | Jest             | Vitest                  |
| --------------- | ---------------- | ----------------------- |
| **개발사**      | Meta (Facebook)  | Anthony Fu (Vue 팀)     |
| **출시년도**    | 2014             | 2021                    |
| **주요 타겟**   | React 생태계     | Vite 생태계             |
| **번들러**      | 자체 변환 시스템 | Vite (esbuild + Rollup) |
| **설정 복잡도** | 중간             | 낮음                    |

### 2. 성능 비교

#### Jest

```bash
# 장점
✅ 성숙한 생태계와 안정성
✅ 광범위한 커뮤니티 지원
✅ Next.js와의 완벽한 통합
✅ 풍부한 플러그인과 확장성

# 단점
❌ 상대적으로 느린 시작 시간
❌ 복잡한 설정 (특히 ESM)
❌ 메모리 사용량이 높음
❌ TypeScript 변환 오버헤드
```

#### Vitest

```bash
# 장점
✅ 매우 빠른 시작 시간 (HMR 지원)
✅ 네이티브 ESM 지원
✅ TypeScript 즉시 지원
✅ Jest 호환 API
✅ 낮은 메모리 사용량
✅ 내장 UI 모드

# 단점
❌ 상대적으로 새로운 도구
❌ Next.js 통합이 복잡할 수 있음
❌ 일부 Jest 플러그인 호환성 이슈
❌ 커뮤니티 규모가 작음
```

### 3. API 호환성

**Jest API와 거의 100% 호환**:

```typescript
// 동일한 API 사용 가능
describe('테스트 그룹', () => {
  test('테스트 케이스', () => {
    expect(result).toBe(expected);
  });

  beforeEach(() => {
    // 설정
  });
});

// 모킹도 동일
jest.mock('./module'); // Vitest에서도 동작
vi.mock('./module'); // Vitest 네이티브 API
```

---

## 🚀 성능 및 개발 경험 비교

### 시작 시간 비교

```bash
# Jest (일반적인 Next.js 프로젝트)
$ npm test
# 첫 실행: 3-5초
# 재실행: 1-2초

# Vitest (동일한 프로젝트)
$ npm test
# 첫 실행: 0.5-1초
# 재실행: 0.1-0.3초 (HMR)
```

### 개발 경험

#### Jest

- **Watch 모드**: 파일 변경 시 관련 테스트만 재실행
- **스냅샷 테스트**: 강력한 스냅샷 기능
- **커버리지**: 상세한 커버리지 리포트
- **디버깅**: VS Code 통합 디버깅

#### Vitest

- **HMR**: 실시간 테스트 결과 업데이트
- **UI 모드**: 브라우저 기반 테스트 인터페이스
- **타입 체킹**: 런타임 타입 체킹 지원
- **병렬 실행**: 기본적으로 병렬 테스트 실행

### 메모리 사용량

```bash
# 대규모 테스트 스위트 기준
Jest:   ~200-400MB
Vitest: ~100-200MB (약 50% 절약)
```

---

## 🔄 CashUp 프로젝트 전환 가능성

### 현재 프로젝트 분석

**전환 용이성**: ⭐⭐⭐⭐☆ (4/5)

#### 전환 가능한 이유

1. **Jest 호환 API**: 기존 테스트 코드 대부분 그대로 사용 가능
2. **TypeScript 지원**: 현재 TS 설정과 호환
3. **모킹 패턴**: Supabase 모킹 패턴 유지 가능
4. **테스트 구조**: 현재 테스트 파일 구조 그대로 사용

#### 전환 시 수정 필요한 부분

```typescript
// 1. jest.config.js → vitest.config.ts
// 2. Jest 환경 주석 제거
/**
 * @jest-environment node  // 제거 필요
 */

// 3. 모킹 API 일부 변경
// Before (Jest)
jest.mock('@/lib/supabase/server');

// After (Vitest) - 선택사항
vi.mock('@/lib/supabase/server');
// 또는 jest.mock 그대로 사용 가능
```

### Next.js 통합 고려사항

#### 현재 Jest + Next.js 설정

```javascript
// jest.config.js
const nextJest = require('next/jest');
const createJestConfig = nextJest({ dir: './' });
```

#### Vitest + Next.js 설정 (예상)

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom', // 또는 'node'
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

---

## ⚠️ 전환 시 고려사항

### 1. Next.js 통합 복잡성

**문제점**:

- `next/jest`의 자동 설정 기능 손실
- Next.js 특화 기능 (이미지 최적화, 라우팅 등) 모킹 복잡
- App Router 테스트 설정 추가 작업 필요

**해결 방안**:

```typescript
// 수동 Next.js 환경 설정 필요
import { loadEnvConfig } from '@next/env';

// vitest.setup.ts
loadEnvConfig(process.cwd());

// Next.js 컴포넌트 테스트를 위한 추가 설정
import '@testing-library/jest-dom';
```

### 2. 기존 테스트 마이그레이션

**현재 테스트 파일 수**: 약 10개 파일 (추정)
**마이그레이션 작업량**: 1-2일

**마이그레이션 체크리스트**:

- [ ] `jest.config.js` → `vitest.config.ts` 변환
- [ ] `jest.setup.js` → `vitest.setup.ts` 변환
- [ ] `@jest-environment` 주석 제거
- [ ] Next.js 모킹 설정 재구성
- [ ] 테스트 실행 스크립트 업데이트

### 3. 팀 학습 곡선

**Jest 경험자**: 1-2일 적응 기간
**새로운 기능**: UI 모드, HMR 활용법 학습

---

## 💡 권장사항

### 현재 상황 분석

**CashUp 프로젝트 특성**:

- ✅ Next.js 15.4.4 사용 (최신 버전)
- ✅ TypeScript 완전 도입
- ✅ 테스트 코드 비교적 적음 (초기 단계)
- ✅ 개발 속도 중시 (MVP 단계)

### 권장 시나리오

#### 시나리오 1: 현재 Jest 유지 (권장) ⭐⭐⭐⭐⭐

**이유**:

1. **안정성**: Next.js와의 검증된 통합
2. **개발 집중**: 테스트 도구보다 기능 개발에 집중
3. **팀 효율성**: 기존 설정으로 충분한 성능
4. **MVP 우선**: 현재 Core MVP 단계에서 도구 변경 리스크 최소화

**개선 방안**:

```bash
# Jest 성능 최적화
# 1. 병렬 실행 활성화
npm test -- --maxWorkers=4

# 2. 캐시 활용
npm test -- --cache

# 3. 변경된 파일만 테스트
npm test -- --onlyChanged
```

#### 시나리오 2: Enhanced MVP 단계에서 전환 고려 ⭐⭐⭐☆☆

**타이밍**: Week 9-12 (Enhanced MVP)
**이유**:

- 테스트 코드가 더 많아진 후 성능 이점 체감
- 페이지 빌더, AI 매칭 등 복잡한 기능 테스트 시 HMR 이점
- 안정적인 기능 개발 완료 후 도구 최적화

#### 시나리오 3: 즉시 전환 ⭐⭐☆☆☆

**권장하지 않는 이유**:

- 현재 MVP 개발에 집중해야 하는 시점
- Next.js 통합 설정에 추가 시간 소요
- 테스트 코드가 적어 성능 이점 체감 어려움

### 최종 권장사항

```markdown
🎯 **현재 단계**: Jest 유지하며 개발 속도 집중
📈 **향후 계획**: Enhanced MVP 완료 후 Vitest 전환 검토
⚡ **성능 개선**: Jest 최적화 옵션 활용
🔄 **점진적 전환**: 새로운 테스트부터 Vitest 패턴 적용 고려
```

### 실행 계획

#### 단기 (현재 - Week 8)

1. Jest 성능 최적화 설정 적용
2. 테스트 커버리지 확대
3. E2E 테스트 (Playwright) 강화

#### 중기 (Week 9-12)

1. Vitest 전환 가능성 재평가
2. 복잡한 컴포넌트 테스트에서 성능 이슈 모니터링
3. 팀 의견 수렴 및 전환 계획 수립

#### 장기 (Week 13+)

1. 필요시 Vitest 전환 실행
2. 테스트 성능 및 개발 경험 개선 측정
3. 지속적인 테스트 도구 최적화

---

## 📚 참고 자료

- [Vitest 공식 문서](https://vitest.dev/)
- [Jest 공식 문서](https://jestjs.io/)
- [Next.js Testing 가이드](https://nextjs.org/docs/app/building-your-application/testing)
- [Vitest vs Jest 성능 벤치마크](https://github.com/vitest-dev/vitest/tree/main/benchmarks)

---

**결론**: 현재 CashUp 프로젝트는 Jest를 유지하며 MVP 개발에 집중하고, Enhanced MVP 단계에서 Vitest 전환을 재검토하는 것이 가장 효율적인 전략입니다.
