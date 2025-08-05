/**
 * 서버 사이드 전용 환경 변수
 * 이 파일은 서버 컴포넌트와 API 라우트에서만 사용해야 합니다.
 * 절대 클라이언트 번들에 포함되지 않도록 주의하세요.
 */

// 서버 환경 확인
if (typeof window !== 'undefined') {
  throw new Error('이 모듈은 서버 사이드에서만 사용할 수 있습니다.');
}

/**
 * 서버 전용 환경 변수
 * 민감한 정보를 포함하므로 클라이언트에 노출되면 안됩니다.
 */
export const serverEnv = {
  // Supabase 서비스 롤 키 (관리자 권한)
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET,
  
  // 카카오 OAuth 시크릿
  KAKAO_CLIENT_SECRET: process.env.KAKAO_CLIENT_SECRET,
  
  // Google Gemini AI API 키
  GOOGLE_GEMINI_API_KEY: process.env.GOOGLE_GEMINI_API_KEY,
  
  // 이메일 서비스 API 키
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  
  // 토스페이먼츠 시크릿 키
  TOSS_SECRET_KEY: process.env.TOSS_SECRET_KEY,
} as const;

/**
 * 서버 환경 변수 검증
 * 서버 시작 시 필요한 환경 변수가 설정되었는지 확인
 */
export function validateServerEnv() {
  const _missingVars: string[] = [];
  
  // 서버 전용 필수 환경 변수 검증
  if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('경고: SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다. 일부 관리자 기능이 제한될 수 있습니다.');
  }
  
  if (!serverEnv.GOOGLE_GEMINI_API_KEY) {
    console.warn('경고: GOOGLE_GEMINI_API_KEY가 설정되지 않았습니다. AI 매칭 기능이 작동하지 않습니다.');
  }
  
  if (!serverEnv.RESEND_API_KEY) {
    console.warn('경고: RESEND_API_KEY가 설정되지 않았습니다. 이메일 전송 기능이 작동하지 않습니다.');
  }
  
  return serverEnv;
}

/**
 * 서버 환경 타입 정의
 */
export type ServerEnv = typeof serverEnv;