# Store Route Group

CulinarySeoul ERP 시스템의 매장 레벨 운영을 위한 라우트 그룹입니다.

## 경로 구조

- `/store/[storeId]/dashboard` - 매장별 대시보드
- `/store/[storeId]/inventory` - 매장 재고 관리
- `/store/[storeId]/sales` - 매장 매출 관리
- `/store/[storeId]/operations` - 매장 운영 관리
- `/store/[storeId]/staff` - 직원 관리

## 접근 권한

- 매장 대표 (store_manager)
- 매장담당자 (store_staff)
- 상위 권한자 (brand_admin, company_admin, super_admin)

## 기능

- 매장별 일일 운영 관리
- 실시간 재고 현황 관리
- 매출 및 수익성 추적
- 직원 및 운영 관리
