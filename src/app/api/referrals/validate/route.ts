import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/lib/supabase/auth-api';
import { createServiceClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database.types';

// Supabase 서비스 클라이언트 (관리자 권한)
const supabase = createServiceClient();

/**
 * ERP 시스템 - 추천 코드 검증 불필요
 * GET /api/referrals/validate?code=REFERRAL_CODE
 */
export async function GET(request: NextRequest) {
  try {
    // ERP 시스템에서는 추천 코드 검증이 불필요
    return NextResponse.json({ 
      valid: false,
      message: 'Referral code validation not available in ERP system',
      available: false 
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/referrals/validate:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

/**
 * ERP 시스템 - 추천 관계 설정 불필요
 * POST /api/referrals/validate
 */
export async function POST(request: NextRequest) {
  try {
    // Supabase로 현재 사용자 확인
    const { authenticated, user, error } = await authenticateApiRequest();

    if (!authenticated || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ERP 시스템에서는 추천 관계 설정이 불필요
    return NextResponse.json({ 
      message: 'Referral relationship setting not available in ERP system',
      available: false 
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/referrals/validate:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
