# RLS 권한 시스템 복원 가이드

## 🚨 현재 상황

- **브랜드 조회 시 "permission denied for table users" 오류 발생**
- **RLS 함수들이 누락되어 권한 시스템 작동 불가**
- **임시로 Admin 클라이언트를 사용하여 우회 중**

## ✅ 해결 완료 사항

1. **RLS 함수 완전 복원 마이그레이션 생성**: `014_restore_rls_functions.sql`
2. **브랜드 페이지 코드 수정**: Admin 클라이언트 → 일반 사용자 권한으로 변경
3. **권한 시스템 통합**: profiles 테이블 기반 단일 권한 시스템

## 🔧 마이그레이션 적용 방법

### 방법 1: Supabase Dashboard (권장)

1. **Supabase Dashboard 접속**
   ```
   https://supabase.com/dashboard/project/iduamiwrgnutulqmcpca
   ```

2. **SQL Editor 열기**
   - 좌측 메뉴 > SQL Editor 클릭

3. **마이그레이션 실행**
   - `supabase/migrations/014_restore_rls_functions.sql` 파일 내용 복사
   - SQL Editor에 붙여넣기
   - "Run" 버튼 클릭

4. **실행 결과 확인**
   - 모든 함수가 성공적으로 생성되었는지 확인
   - 오류 메시지가 있다면 무시 가능한 오류인지 검토

### 방법 2: 로컬 Supabase CLI (Docker 필요)

```bash
# 1. Docker Desktop 실행 확인
# 2. Supabase 로컬 환경 시작
npm run supabase:start

# 3. 마이그레이션 적용
npx supabase db push

# 4. 브랜드 페이지 테스트
npm run dev
# http://localhost:3000/company/brands 접속
```

## 🧪 복원 검증 방법

### 1. Supabase Dashboard에서 확인

```sql
-- 핵심 함수 존재 확인
SELECT routine_name, routine_schema 
FROM information_schema.routines 
WHERE routine_name IN (
  'get_current_user_profile',
  'user_has_brand_access', 
  'user_has_company_access',
  'current_user_role_level'
);

-- RLS 정책 확인
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('brands', 'profiles', 'companies', 'stores');
```

### 2. 브랜드 페이지 테스트

1. 애플리케이션 실행: `npm run dev`
2. Company Admin 계정으로 로그인:
   - 이메일: `companyadmin@culinaryseoul.com`
   - 비밀번호: `CompanyAdmin123!`
3. 브랜드 관리 페이지 접속: `http://localhost:3000/company/brands`
4. 브랜드 데이터가 오류 없이 로드되는지 확인

### 3. 개발자 콘솔 확인

- 브라우저 개발자 도구 > Console 탭
- "permission denied" 오류가 없는지 확인
- "✅ 사용자 권한으로 브랜드 데이터 조회 중..." 메시지 확인

## 🔍 복원된 핵심 함수들

### 인증 관련 함수
- `get_current_user_profile()`: 현재 사용자 프로파일 조회
- `current_user_role_level()`: 계층적 권한 레벨 (0-100)
- `auth.uid_safe()`: 안전한 사용자 ID 조회

### 권한 확인 함수
- `user_has_company_access()`: 회사 대시보드 접근 권한
- `user_has_brand_access(uuid)`: 특정 브랜드 접근 권한  
- `user_has_store_access(uuid)`: 특정 매장 접근 권한

### 역할 확인 함수
- `user_has_role(erp_role)`: 특정 역할 보유 여부
- `user_has_any_role(erp_role[])`: 다중 역할 중 하나 보유 여부
- `user_has_role_level(integer)`: 계층적 권한 레벨 비교

## 🛡️ RLS 정책 구조

### BRANDS 테이블 정책
```sql
-- 브랜드 조회 권한
CREATE POLICY "brands_select" ON public.brands
  FOR SELECT USING (
    current_user_role_level() >= 80 OR -- company_admin 이상
    company_id = auth.current_company_id() OR -- 같은 회사
    id = auth.current_brand_id() OR -- 할당된 브랜드
    user_has_brand_access(id) -- 브랜드 접근 권한
  );
```

### PROFILES 테이블 정책
```sql
-- 자신의 프로파일 조회
CREATE POLICY "profiles_own_select" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- 계층적 프로파일 조회
CREATE POLICY "profiles_hierarchy_select" ON public.profiles
  FOR SELECT USING (
    current_user_role_level() >= 80 OR -- company_admin 이상
    (current_user_role_level() >= 60 AND auth.current_brand_id() = brand_id) OR
    (current_user_role_level() >= 30 AND auth.current_store_id() = store_id)
  );
```

## ⚠️ 주의사항

1. **마이그레이션 실행 순서**
   - 함수 생성 → RLS 정책 생성 → 권한 부여 순서로 진행
   - 일부 "already exists" 오류는 정상적인 상황

2. **권한 계층 구조**
   - super_admin (100) > company_admin (80) > brand_admin (60) > brand_staff (40) > store_manager (30) > store_staff (10)

3. **데이터 보존**
   - 기존 사용자 데이터는 모두 보존됨
   - profiles 테이블의 권한 메타데이터만 업데이트

## 🎯 예상 결과

### 마이그레이션 성공 시
- ✅ 브랜드 페이지에서 "permission denied" 오류 해결
- ✅ Admin 클라이언트 없이도 정상적인 데이터 접근
- ✅ 계층적 권한 시스템 정상 작동
- ✅ 모든 CRUD 기능 정상 작동

### 실패 시 대안
- **임시 해결책**: 현재 Admin 클라이언트 사용 유지
- **장기 해결책**: Supabase 지원팀 문의 또는 수동 함수 생성

## 📞 지원

이 가이드대로 진행해도 문제가 해결되지 않으면:
1. Supabase Dashboard의 Logs 탭에서 상세 오류 확인
2. 브라우저 개발자 콘솔에서 네트워크 탭 확인  
3. 필요시 추가 디버깅 스크립트 실행

---

**마지막 업데이트**: 2025-08-06  
**작성자**: Claude Code Assistant
**상태**: RLS 마이그레이션 준비 완료 ✅