# Brand Route Group

CulinarySeoul ERP 시스템의 브랜드 레벨 관리를 위한 라우트 그룹입니다.

## 경로 구조

- `/brand/[brandId]/dashboard` - 브랜드별 대시보드
- `/brand/[brandId]/stores` - 매장 관리
- `/brand/[brandId]/inventory` - 브랜드 재고 관리
- `/brand/[brandId]/sales` - 브랜드 매출 관리
- `/brand/[brandId]/settings` - 브랜드 설정

## 접근 권한

- 브랜드관리자 (brand_admin)
- 브랜드 담당자 (brand_staff)
- 상위 권한자 (company_admin, super_admin)

## 기능

- 브랜드별 상세 관리
- 소속 매장 통합 관리
- 브랜드 독립 운영 준비
- 브랜드별 재고 및 매출 분석
