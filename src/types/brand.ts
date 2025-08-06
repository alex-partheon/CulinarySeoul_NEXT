/**
 * Brand Management Type Definitions
 * 실제 데이터베이스 스키마와 100% 정합하는 TypeScript 타입 정의
 */

/**
 * 브랜드 컬러 팔레트 (brand_colors JSONB 필드)
 */
export interface BrandColors {
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
  text?: string;
  [key: string]: string | undefined;
}

/**
 * 브랜드 연락처 정보 (contact_info JSONB 필드)
 */
export interface BrandContactInfo {
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  social_media?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
  };
  [key: string]: unknown;
}

/**
 * 데이터베이스의 실제 brands 테이블 구조
 * 실제 유효 필드: id, company_id, name, code, domain, is_active, created_at, updated_at
 */
export interface Brand {
  // 기본 필드 (실제 스키마 기반 - 검증 완료)
  id: string;
  company_id: string;
  name: string;
  code: string; // UNIQUE 제약 조건
  domain: string; // UNIQUE 제약 조건, NOT NULL
  
  // 상태 및 메타데이터
  is_active: boolean; // DEFAULT true
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

/**
 * 브랜드 생성 시 사용되는 입력 데이터 타입 (실제 DB 필드 기준)
 */
export interface CreateBrandInput {
  company_id: string; // 필수 외래키
  name: string;
  code: string;
  domain: string; // 필수 필드 (NOT NULL)
  is_active?: boolean;
}

/**
 * 브랜드 업데이트 시 사용되는 입력 데이터 타입 (실제 DB 필드 기준)
 */
export interface UpdateBrandInput {
  name?: string;
  code?: string;
  domain?: string;
  is_active?: boolean;
}

/**
 * 관련 데이터와 함께 조회되는 브랜드 정보
 */
export interface BrandWithRelations extends Brand {
  // 매장 정보 (JOIN 결과)
  stores?: Array<{
    id: string;
    name: string;
    code: string;
    type: string;
    is_active: boolean;
  }>;
  
  // 회사 정보 (JOIN 결과)
  company?: {
    id: string;
    name: string;
    code: string;
  };
  
  // 계산된 필드들
  stores_count?: number;
  total_revenue?: number; // 실제 매출 데이터 (추후 구현)
}

/**
 * 브랜드 통계 정보
 */
export interface BrandStats {
  total_brands: number;
  active_brands: number;
  inactive_brands: number;
  total_stores: number;
  total_revenue: number;
  average_stores_per_brand: number;
}

/**
 * 브랜드 필터 옵션
 */
export interface BrandFilter {
  search_term?: string;
  is_active?: boolean | 'all';
  company_id?: string;
  has_stores?: boolean;
}

/**
 * 브랜드 정렬 옵션
 */
export type BrandSortField = 'name' | 'code' | 'created_at' | 'updated_at' | 'stores_count';
export type SortDirection = 'asc' | 'desc';

export interface BrandSort {
  field: BrandSortField;
  direction: SortDirection;
}

/**
 * 브랜드 조회 옵션
 */
export interface BrandQueryOptions {
  filter?: BrandFilter;
  sort?: BrandSort;
  include_relations?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * API 응답 타입들
 */
export interface BrandResponse {
  success: true;
  data: Brand;
}

export interface BrandsResponse {
  success: true;
  data: BrandWithRelations[];
  total: number;
  page: number;
  limit: number;
}

export interface BrandStatsResponse {
  success: true;
  data: BrandStats;
}

/**
 * 에러 응답 타입
 */
export interface BrandErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

/**
 * 브랜드 검증 규칙
 */
export interface BrandValidationRules {
  name: {
    required: true;
    min_length: 1;
    max_length: 255;
  };
  code: {
    required: true;
    min_length: 2;
    max_length: 50;
    pattern: RegExp; // 소문자, 숫자, 하이픈, 언더스코어만 허용
    unique: true;
  };
  domain: {
    required: true; // NOT NULL 제약 조건
    pattern: RegExp;
    unique: true;
  };
}

/**
 * 브랜드 업무 도메인 상수
 */
export const BRAND_BUSINESS_CATEGORIES = [
  'cafe',
  'restaurant', 
  'bakery',
  'dessert',
  'fast_food',
  'fine_dining',
  'food_truck',
  'catering',
  'other'
] as const;

export type BrandBusinessCategory = typeof BRAND_BUSINESS_CATEGORIES[number];

/**
 * 브랜드 기본 컬러 팔레트
 */
export const DEFAULT_BRAND_COLORS: BrandColors = {
  primary: '#000000',
  secondary: '#ffffff',
  accent: '#f0f0f0',
  background: '#ffffff',
  text: '#000000'
};