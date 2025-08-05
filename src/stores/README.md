# State Management (Zustand)

Zustand를 사용한 전역 상태 관리 스토어들을 포함합니다.

## Store 목록

- `authStore` - 인증 상태
- `campaignStore` - 캠페인 상태
- `uiStore` - UI 상태 (모달, 사이드바 등)
- `referralStore` - 추천 시스템 상태

## 규칙

- 최소한의 전역 상태 유지
- 서버 상태는 SWR/TanStack Query 사용
- 타입 안전성 보장
