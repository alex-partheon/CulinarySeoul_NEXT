# Supabase 원격 프로젝트 연결 가이드

이 가이드는 CashUp 프로젝트를 원격 Supabase 프로젝트에 연결하는 방법을 설명합니다.

## 1. Supabase 프로젝트 생성

### 1.1 Supabase 계정 생성 및 로그인

1. [Supabase 웹사이트](https://supabase.com)에 접속
2. "Start your project" 클릭
3. GitHub 계정으로 로그인 (권장)

### 1.2 새 프로젝트 생성

1. Dashboard에서 "New Project" 클릭
2. 프로젝트 정보 입력:
   - **Name**: `cashup-production` (또는 원하는 이름)
   - **Database Password**: 강력한 비밀번호 생성 (저장 필수)
   - **Region**: `Northeast Asia (Seoul)` 선택 (한국 서비스용)
   - **Pricing Plan**: 개발용은 Free tier 선택
3. "Create new project" 클릭
4. 프로젝트 생성 완료까지 2-3분 대기

## 2. 환경 변수 설정

### 2.1 Supabase 프로젝트 정보 확인

1. Supabase Dashboard → Settings → API
2. 다음 정보 복사:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public key**: `eyJ...` (공개 키)
   - **service_role key**: `eyJ...` (서비스 역할 키, 비공개)

### 2.2 .env.local 파일 설정

프로젝트 루트에 `.env.local` 파일 생성 또는 수정:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_public_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3002

# Kakao OAuth (선택사항)
NEXT_PUBLIC_KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_CLIENT_SECRET=your_kakao_client_secret
```

⚠️ **보안 주의사항**:

- `service_role_key`는 절대 클라이언트 코드에 노출하지 마세요
- `.env.local` 파일이 `.gitignore`에 포함되어 있는지 확인하세요

## 3. Supabase CLI 설정

### 3.1 Supabase CLI 설치

```bash
# npm으로 설치
npm install -g supabase

# 또는 Homebrew로 설치 (macOS)
brew install supabase/tap/supabase
```

### 3.2 CLI 로그인

```bash
# Supabase CLI 로그인
supabase login

# 브라우저가 열리면 GitHub 계정으로 인증
```

### 3.3 프로젝트 연결

```bash
# 프로젝트 루트 디렉토리에서 실행
cd /Users/alex/Dev/next/cashup

# 원격 프로젝트와 연결
supabase link --project-ref your-project-id

# project-id는 Supabase Dashboard URL에서 확인 가능
# 예: https://supabase.com/dashboard/project/abcdefghijklmnop
# project-id = abcdefghijklmnop
```

## 4. 데이터베이스 마이그레이션

### 4.1 스키마 적용

```bash
# 로컬 마이그레이션을 원격 데이터베이스에 적용
supabase db push

# 확인 메시지가 나오면 'y' 입력
```

### 4.2 시드 데이터 적용 (선택사항)

```bash
# 시드 데이터 적용
supabase db reset --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

### 4.3 TypeScript 타입 생성

```bash
# 데이터베이스 스키마에서 TypeScript 타입 생성
supabase gen types typescript --project-id your-project-id --schema public > src/types/database.ts
```

## 5. 인증 설정

### 5.1 사이트 URL 설정

1. Supabase Dashboard → Authentication → Settings
2. **Site URL** 설정:
   - 개발: `http://localhost:3002`
   - 프로덕션: `https://your-domain.com`

### 5.2 리다이렉트 URL 설정

**Additional Redirect URLs**에 추가:

```
http://localhost:3002/auth/callback
https://your-domain.com/auth/callback
```

### 5.3 이메일 템플릿 설정 (선택사항)

1. Authentication → Email Templates
2. 각 템플릿을 한국어로 커스터마이징

## 6. OAuth 설정 (카카오)

### 6.1 카카오 개발자 콘솔 설정

1. [Kakao Developers](https://developers.kakao.com) 접속
2. 애플리케이션 생성 또는 선택
3. **플랫폼 설정** → **Web**:
   - 사이트 도메인: `http://localhost:3002`, `https://your-domain.com`
4. **카카오 로그인** → **Redirect URI**:
   - `https://your-project-id.supabase.co/auth/v1/callback`

### 6.2 Supabase OAuth 설정

1. Supabase Dashboard → Authentication → Providers
2. **Kakao** 활성화
3. 카카오 앱 정보 입력:
   - **Client ID**: 카카오 REST API 키
   - **Client Secret**: 카카오 보안 키

## 7. 연결 테스트

### 7.1 개발 서버 시작

```bash
npm run dev
```

### 7.2 연결 확인

1. `http://localhost:3002` 접속
2. 회원가입/로그인 테스트
3. 브라우저 개발자 도구에서 네트워크 탭 확인
4. Supabase Dashboard에서 Authentication → Users 확인

### 7.3 데이터베이스 확인

1. Supabase Dashboard → Table Editor
2. `profiles` 테이블에 사용자 데이터 생성 확인

## 8. 프로덕션 배포 준비

### 8.1 환경 변수 설정

배포 플랫폼(Vercel, Netlify 등)에 환경 변수 설정:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### 8.2 도메인 설정 업데이트

1. Supabase Dashboard에서 Site URL을 프로덕션 도메인으로 변경
2. 카카오 개발자 콘솔에서 도메인 추가

## 9. 문제 해결

### 9.1 일반적인 오류

**"Invalid API key" 오류**:

- `.env.local` 파일의 키 값 재확인
- 개발 서버 재시작 (`npm run dev`)

**"CORS 오류"**:

- Supabase Dashboard에서 Site URL 확인
- 브라우저 캐시 클리어

**마이그레이션 실패**:

```bash
# 현재 상태 확인
supabase db diff

# 강제 리셋 (주의: 데이터 손실)
supabase db reset
```

### 9.2 로그 확인

```bash
# Supabase CLI 디버그 모드
supabase --debug db push

# 프로젝트 상태 확인
supabase status
```

## 10. 추가 리소스

- [Supabase 공식 문서](https://supabase.com/docs)
- [Next.js + Supabase 가이드](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase CLI 레퍼런스](https://supabase.com/docs/reference/cli)
- [카카오 로그인 API 문서](https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api)

---

**참고**: 이 가이드는 CashUp 프로젝트의 현재 구조를 기반으로 작성되었습니다. 프로젝트 구조가 변경되면 가이드도 함께 업데이트해야 합니다.
