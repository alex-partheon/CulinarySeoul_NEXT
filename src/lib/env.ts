/**
 * 환경 변수 검증 및 타입 안전성 보장
 */

// 필수 환경 변수 목록
const requiredEnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
} as const;

// 선택적 환경 변수 목록
const optionalEnvVars = {
  // Supabase
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET,
  
  // 카카오 OAuth
  NEXT_PUBLIC_KAKAO_CLIENT_ID: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID,
  KAKAO_CLIENT_SECRET: process.env.KAKAO_CLIENT_SECRET,
  
  // Google Gemini AI
  GOOGLE_GEMINI_API_KEY: process.env.GOOGLE_GEMINI_API_KEY,
  
  // 이메일 서비스
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  
  // 토스페이먼츠
  TOSS_CLIENT_KEY: process.env.TOSS_CLIENT_KEY,
  TOSS_SECRET_KEY: process.env.TOSS_SECRET_KEY,
  
  // 도메인 설정
  NEXT_PUBLIC_DOMAIN_MAIN: process.env.NEXT_PUBLIC_DOMAIN_MAIN,
  NEXT_PUBLIC_DOMAIN_CREATOR: process.env.NEXT_PUBLIC_DOMAIN_CREATOR,
  NEXT_PUBLIC_DOMAIN_BUSINESS: process.env.NEXT_PUBLIC_DOMAIN_BUSINESS,
  NEXT_PUBLIC_DOMAIN_ADMIN: process.env.NEXT_PUBLIC_DOMAIN_ADMIN,
  
  // 기타 설정
  LOG_LEVEL: process.env.LOG_LEVEL,
  SESSION_EXPIRY: process.env.SESSION_EXPIRY,
  CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS,
  API_RATE_LIMIT: process.env.API_RATE_LIMIT,
} as const;

/**
 * 환경 변수 검증 함수
 * 애플리케이션 시작 시 호출하여 필수 환경 변수가 설정되었는지 확인
 */
export function validateEnv() {
  const missingVars: string[] = [];

  // 필수 환경 변수 검증
  Object.entries(requiredEnvVars).forEach(([key, value]) => {
    if (!value) {
      missingVars.push(key);
    }
  });

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
        'Please check your .env.local file and ensure all required variables are set.',
    );
  }

  return {
    ...requiredEnvVars,
    ...optionalEnvVars,
  };
}

/**
 * 타입 안전한 환경 변수 접근
 */
export const env = {
  // Supabase
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET,

  // 카카오 OAuth
  KAKAO_CLIENT_ID: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID,
  KAKAO_CLIENT_SECRET: process.env.KAKAO_CLIENT_SECRET,

  // Google Gemini AI
  GOOGLE_GEMINI_API_KEY: process.env.GOOGLE_GEMINI_API_KEY,

  // 이메일 서비스
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || 'noreply@cashup.kr',

  // 토스페이먼츠
  TOSS_CLIENT_KEY: process.env.TOSS_CLIENT_KEY,
  TOSS_SECRET_KEY: process.env.TOSS_SECRET_KEY,

  // Site
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL!,

  // Node Environment
  NODE_ENV: process.env.NODE_ENV as 'development' | 'production' | 'test',

  // 개발 환경 여부
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',

  // 기타 설정
  LOG_LEVEL: (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
  SESSION_EXPIRY: parseInt(process.env.SESSION_EXPIRY || '604800', 10), // 기본값: 7일
  API_RATE_LIMIT: parseInt(process.env.API_RATE_LIMIT || '60', 10), // 기본값: 60 요청/분
  CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS,
} as const;

/**
 * 환경별 설정
 */
export const config = {
  // 개발 환경에서만 디버그 로그 출력
  enableDebugLogs: env.isDevelopment,

  // 쿠키 설정
  cookieOptions: {
    secure: env.isProduction,
    sameSite: 'lax' as const,
    httpOnly: false, // Supabase Auth에서 클라이언트 접근 필요
    path: '/',
    maxAge: env.SESSION_EXPIRY,
  },

  // 세션 설정
  session: {
    maxAge: env.SESSION_EXPIRY,
    updateAge: 60 * 60 * 24, // 1일마다 갱신
  },

  // CORS 설정
  cors: {
    origins: env.CORS_ALLOWED_ORIGINS 
      ? env.CORS_ALLOWED_ORIGINS.split(',').map((origin: string) => origin.trim())
      : ['http://localhost:3002', 'http://localhost:3000'],
  },

  // API 설정
  api: {
    rateLimit: env.API_RATE_LIMIT,
  },
} as const;

/**
 * 클라이언트 안전 환경 변수만 반환
 * 브라우저에 노출되어도 안전한 환경 변수만 포함
 */
export function getPublicEnv() {
  const publicEnv: Record<string, string | undefined> = {};
  
  Object.entries(process.env).forEach(([key, value]) => {
    if (key.startsWith('NEXT_PUBLIC_')) {
      publicEnv[key] = value;
    }
  });
  
  return publicEnv;
}

/**
 * 도메인 설정 반환
 * 개발 환경에서는 localhost, 프로덕션에서는 실제 도메인 사용
 */
export function getDomainConfig() {
  if (env.isDevelopment || env.isTest) {
    const host = new URL(env.SITE_URL).host;
    return {
      main: host,
      creator: host,
      business: host,
      admin: host,
    };
  }

  return {
    main: process.env.NEXT_PUBLIC_DOMAIN_MAIN || 'cashup.kr',
    creator: process.env.NEXT_PUBLIC_DOMAIN_CREATOR || 'crt.cashup.kr',
    business: process.env.NEXT_PUBLIC_DOMAIN_BUSINESS || 'biz.cashup.kr',
    admin: process.env.NEXT_PUBLIC_DOMAIN_ADMIN || 'adm.cashup.kr',
  };
}

/**
 * 환경 변수 타입 정의
 */
export type Env = typeof env;
export type Config = typeof config;