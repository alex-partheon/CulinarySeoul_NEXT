import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

// Supabase 클라이언트 (데이터베이스 전용)
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
    // Clerk로 현재 사용자 확인
    const { userId } = await auth();

    if (!userId) {
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
